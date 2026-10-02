-- ============================================
-- BMO BANKING SUPABASE DATABASE SETUP
-- Fresh-project setup; no existing rows are deleted.
-- Do not run this as an upgrade over a different schema without reviewing it first.
-- User-facing balance/ledger mutations must use the RPCs below; direct table writes are denied.
-- ============================================

begin;

-- ============================================
-- Extensions
-- ============================================
-- gen_random_uuid() is built into supported Supabase PostgreSQL versions.

-- ============================================
-- Tables
-- ============================================
-- accounts is the app's profile and account row. Its id is the Auth user UUID;
-- a separate profiles/users identity table is not required.
create table if not exists public.accounts (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null,
  email text not null,
  phone text,
  date_of_birth date,
  national_id text,
  account_number text not null unique,
  referral_code text,
  address text,
  occupation text,
  profile_image text,
  checking_account_balance numeric(18, 2) not null default 0 check (checking_account_balance >= 0),
  savings_account_balance numeric(18, 2) not null default 0 check (savings_account_balance >= 0),
  balance numeric(18, 2) not null default 0 check (balance >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked', 'pending')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deposits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.accounts(id) on delete restrict,
  account_id uuid not null constraint deposits_account_id_fkey references public.accounts(id) on delete restrict,
  account_number text not null,
  type text not null default 'cheque' check (type = 'cheque'),
  amount numeric(18, 2) not null check (amount > 0),
  currency text not null check (currency in ('USD', 'EUR', 'GBP', 'CAD', 'AUD')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  cheque_number text not null,
  bank_name text not null,
  account_holder_name text not null,
  issue_date date not null,
  memo text,
  notes text,
  front_image_path text not null,
  back_image_path text not null,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  admin_note text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, cheque_number)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  deposit_id uuid references public.deposits(id) on delete restrict,
  reference text,
  email text not null,
  account_name text,
  user_account text,
  account_number text,
  routing_number text,
  swift_code text,
  bank_name text,
  type text not null check (type in (
    'deposit', 'withdrawal', 'transfer', 'Transfer', 'Withdraw',
    'cheque_deposit', 'admin_adjustment'
  )),
  amount numeric(18, 2) not null check (amount > 0),
  note text,
  from_account text check (from_account is null or from_account in ('checking', 'savings')),
  status text not null default 'completed' check (status in (
    'pending', 'completed', 'failed', 'approved', 'rejected'
  )),
  created_at timestamptz not null default now(),
  date date not null default current_date
);

-- ============================================
-- Indexes
-- ============================================
create unique index if not exists accounts_email_lower_key
  on public.accounts (lower(email));
create index if not exists accounts_status_idx
  on public.accounts (status);
create index if not exists accounts_created_at_idx
  on public.accounts (created_at desc);

create index if not exists deposits_user_submitted_idx
  on public.deposits (user_id, submitted_at desc);
create index if not exists deposits_account_id_idx
  on public.deposits (account_id);
create index if not exists deposits_status_submitted_idx
  on public.deposits (status, submitted_at desc);

create index if not exists transactions_user_created_idx
  on public.transactions (user_id, created_at desc);
create index if not exists transactions_email_date_idx
  on public.transactions (lower(email), date desc);
create index if not exists transactions_status_created_idx
  on public.transactions (status, created_at desc);
create unique index if not exists transactions_deposit_id_key
  on public.transactions (deposit_id) where deposit_id is not null;
create unique index if not exists transactions_reference_key
  on public.transactions (reference) where reference is not null;

-- ============================================
-- Triggers
-- ============================================
create or replace function public.sync_account_totals()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.checking_account_balance := coalesce(new.checking_account_balance, 0);
  new.savings_account_balance := coalesce(new.savings_account_balance, 0);
  new.balance := new.checking_account_balance + new.savings_account_balance;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.sync_account_totals() from public, anon, authenticated;

drop trigger if exists accounts_sync_totals on public.accounts;
create trigger accounts_sync_totals
before insert or update on public.accounts
for each row execute function public.sync_account_totals();

-- ============================================
-- Functions
-- ============================================
-- SECURITY DEFINER is used here only to read the protected role column from RLS.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.accounts a
    where a.id = auth.uid()
      and a.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Create the deposit and matching ledger row in one database transaction.
-- Images are uploaded to private Storage first; the caller cleans those files up
-- if this RPC fails. user_id and account_number are derived from the signed-in row.
create or replace function public.submit_cheque_deposit(
  p_deposit_id uuid,
  p_amount numeric,
  p_currency text,
  p_cheque_number text,
  p_bank_name text,
  p_account_holder_name text,
  p_issue_date date,
  p_memo text,
  p_notes text,
  p_front_image_path text,
  p_back_image_path text
)
returns public.deposits
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account public.accounts;
  v_deposit public.deposits;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_deposit_id is null or p_amount is null or p_amount <= 0 then
    raise exception 'A positive deposit amount and id are required';
  end if;
  if p_currency is null or p_currency not in ('USD', 'EUR', 'GBP', 'CAD', 'AUD') then
    raise exception 'Unsupported deposit currency';
  end if;
  if nullif(trim(p_cheque_number), '') is null
     or nullif(trim(p_bank_name), '') is null
     or nullif(trim(p_account_holder_name), '') is null
     or p_issue_date is null or p_issue_date > current_date then
    raise exception 'Required cheque details are invalid';
  end if;
    if p_front_image_path is distinct from (auth.uid()::text || '/' || p_deposit_id::text || '/front.jpg')
      or p_back_image_path is distinct from (auth.uid()::text || '/' || p_deposit_id::text || '/back.jpg') then
    raise exception 'Cheque image paths must belong to the authenticated user and deposit';
  end if;

  select * into v_account
  from public.accounts
  where id = auth.uid()
  for update;
  if not found then
    raise exception 'Account profile not found';
  end if;
  if v_account.status <> 'active' then
    raise exception 'Account is not active';
  end if;

  insert into public.deposits (
    id, user_id, account_id, account_number, amount, currency,
    cheque_number, bank_name, account_holder_name, issue_date,
    memo, notes, front_image_path, back_image_path, status
  ) values (
    p_deposit_id, v_account.id, v_account.id, v_account.account_number, p_amount, p_currency,
    trim(p_cheque_number), trim(p_bank_name), trim(p_account_holder_name), p_issue_date,
    nullif(trim(p_memo), ''), nullif(trim(p_notes), ''),
    p_front_image_path, p_back_image_path, 'pending'
  ) returning * into v_deposit;

  insert into public.transactions (
    user_id, deposit_id, reference, email, account_name, user_account,
    type, amount, note, status, created_at, date
  ) values (
    v_account.id, v_deposit.id, 'CHEQUE-' || v_deposit.id::text, v_account.email,
    v_account.full_name, v_account.account_number, 'cheque_deposit', p_amount,
    coalesce(nullif(trim(p_memo), ''), 'Cheque deposit'), 'pending', now(), current_date
  );

  return v_deposit;
end;
$$;
revoke all on function public.submit_cheque_deposit(uuid, numeric, text, text, text, text, date, text, text, text, text) from public, anon;
grant execute on function public.submit_cheque_deposit(uuid, numeric, text, text, text, text, date, text, text, text, text) to authenticated;

-- Admin-only review; deposit state, balance, and ledger status change atomically.
create or replace function public.review_cheque_deposit(
  p_deposit_id uuid,
  p_decision text,
  p_admin_note text default null
)
returns public.deposits
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_deposit public.deposits;
  v_account public.accounts;
  v_transaction_count integer;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can review deposits';
  end if;
  if p_decision is null or p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid deposit decision';
  end if;

  select * into v_deposit
  from public.deposits
  where id = p_deposit_id
  for update;
  if not found then
    raise exception 'Deposit not found';
  end if;
  if v_deposit.status <> 'pending' then
    raise exception 'Deposit has already been reviewed';
  end if;

  update public.deposits
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      approved_at = case when p_decision = 'approved' then now() else null end,
      admin_note = nullif(trim(p_admin_note), '')
  where id = p_deposit_id
  returning * into v_deposit;

  if p_decision = 'approved' then
    update public.accounts
    set checking_account_balance = checking_account_balance + v_deposit.amount
    where id = v_deposit.account_id
    returning * into v_account;
    if not found then
      raise exception 'Account not found';
    end if;
  end if;

  update public.transactions
  set status = p_decision,
      note = coalesce(v_deposit.admin_note, note)
  where deposit_id = p_deposit_id;
  get diagnostics v_transaction_count = row_count;

  -- Supports a legacy pending deposit created before submit_cheque_deposit existed.
  if v_transaction_count = 0 then
    insert into public.transactions (
      user_id, deposit_id, reference, email, account_name, user_account,
      type, amount, note, status, created_at, date
    )
    select v_deposit.user_id, v_deposit.id, 'CHEQUE-' || v_deposit.id::text,
           a.email, a.full_name, a.account_number, 'cheque_deposit',
           v_deposit.amount, coalesce(v_deposit.admin_note, 'Cheque deposit'),
           p_decision, now(), current_date
    from public.accounts a
    where a.id = v_deposit.user_id;
    if not found then
      raise exception 'Account not found for deposit';
    end if;
  end if;

  return v_deposit;
end;
$$;
revoke all on function public.review_cheque_deposit(uuid, text, text) from public, anon;
grant execute on function public.review_cheque_deposit(uuid, text, text) to authenticated;

-- Atomic customer transfer/outflow. This app records the destination details;
-- it does not currently implement a receiving account or external payout rail.
create or replace function public.process_transfer(
  p_from_account text,
  p_amount numeric,
  p_account_name text,
  p_account_number text,
  p_routing_number text,
  p_swift_code text,
  p_bank_name text,
  p_note text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account public.accounts;
  v_transaction public.transactions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_from_account is null or p_from_account not in ('checking', 'savings') then
    raise exception 'Invalid source account';
  end if;
  if p_amount is null or p_amount < 10 then
    raise exception 'Transfer amount must be at least 10';
  end if;

  select * into v_account from public.accounts where id = auth.uid() for update;
  if not found then
    raise exception 'Account profile not found';
  end if;
  if v_account.status <> 'active' then
    raise exception 'Account is not active';
  end if;
  if (p_from_account = 'checking' and v_account.checking_account_balance < p_amount)
     or (p_from_account = 'savings' and v_account.savings_account_balance < p_amount) then
    raise exception 'Insufficient funds';
  end if;

  if p_from_account = 'checking' then
    update public.accounts set checking_account_balance = checking_account_balance - p_amount where id = v_account.id;
  else
    update public.accounts set savings_account_balance = savings_account_balance - p_amount where id = v_account.id;
  end if;

  insert into public.transactions (
    user_id, email, account_name, user_account, account_number, routing_number,
    swift_code, bank_name, amount, note, from_account, type, status, reference, date
  ) values (
    v_account.id, v_account.email, p_account_name, v_account.account_number,
    p_account_number, p_routing_number, p_swift_code, p_bank_name,
    p_amount, nullif(trim(p_note), ''), p_from_account, 'transfer', 'completed',
    'TRANSFER-' || gen_random_uuid()::text, current_date
  ) returning * into v_transaction;

  return v_transaction;
end;
$$;
revoke all on function public.process_transfer(text, numeric, text, text, text, text, text, text) from public, anon;
grant execute on function public.process_transfer(text, numeric, text, text, text, text, text, text) to authenticated;

create or replace function public.process_withdrawal(
  p_from_account text,
  p_amount numeric,
  p_account_name text,
  p_account_number text,
  p_routing_number text,
  p_swift_code text,
  p_bank_name text,
  p_note text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account public.accounts;
  v_transaction public.transactions;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if p_from_account is null or p_from_account not in ('checking', 'savings') then
    raise exception 'Invalid source account';
  end if;
  if p_amount is null or p_amount < 10 then
    raise exception 'Withdrawal amount must be at least 10';
  end if;

  select * into v_account from public.accounts where id = auth.uid() for update;
  if not found then
    raise exception 'Account profile not found';
  end if;
  if v_account.status <> 'active' then
    raise exception 'Account is not active';
  end if;
  if (p_from_account = 'checking' and v_account.checking_account_balance < p_amount)
     or (p_from_account = 'savings' and v_account.savings_account_balance < p_amount) then
    raise exception 'Insufficient funds';
  end if;

  if p_from_account = 'checking' then
    update public.accounts set checking_account_balance = checking_account_balance - p_amount where id = v_account.id;
  else
    update public.accounts set savings_account_balance = savings_account_balance - p_amount where id = v_account.id;
  end if;

  insert into public.transactions (
    user_id, email, account_name, user_account, account_number, routing_number,
    swift_code, bank_name, amount, note, from_account, type, status, reference, date
  ) values (
    v_account.id, v_account.email, p_account_name, v_account.account_number,
    p_account_number, p_routing_number, p_swift_code, p_bank_name,
    p_amount, nullif(trim(p_note), ''), p_from_account, 'withdrawal', 'completed',
    'WITHDRAW-' || gen_random_uuid()::text, current_date
  ) returning * into v_transaction;

  return v_transaction;
end;
$$;
revoke all on function public.process_withdrawal(text, numeric, text, text, text, text, text, text) from public, anon;
grant execute on function public.process_withdrawal(text, numeric, text, text, text, text, text, text) to authenticated;

-- The admin balance adjustment RPC both changes the balance and appends an
-- immutable ledger row; it replaces direct account balance edits.
create or replace function public.admin_adjust_balance(
  p_account_id uuid,
  p_account_type text,
  p_delta numeric,
  p_note text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account public.accounts;
  v_new_balance numeric(18, 2);
  v_transaction public.transactions;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can adjust balances';
  end if;
    if p_account_type is null or p_account_type not in ('checking', 'savings')
      or p_delta is null or p_delta = 0 then
    raise exception 'Invalid balance adjustment';
  end if;

  select * into v_account from public.accounts where id = p_account_id for update;
  if not found then
    raise exception 'Account not found';
  end if;

  if p_account_type = 'checking' then
    v_new_balance := v_account.checking_account_balance + p_delta;
    if v_new_balance < 0 then raise exception 'Adjustment would make balance negative'; end if;
    update public.accounts set checking_account_balance = v_new_balance where id = p_account_id;
  else
    v_new_balance := v_account.savings_account_balance + p_delta;
    if v_new_balance < 0 then raise exception 'Adjustment would make balance negative'; end if;
    update public.accounts set savings_account_balance = v_new_balance where id = p_account_id;
  end if;

  insert into public.transactions (
    user_id, email, account_name, user_account, from_account,
    type, amount, note, status, reference, date
  ) values (
    v_account.id, v_account.email, v_account.full_name, v_account.account_number,
    p_account_type, 'admin_adjustment', abs(p_delta),
    coalesce(nullif(trim(p_note), ''), 'Administrator balance adjustment'),
    'completed', 'ADJUST-' || gen_random_uuid()::text, current_date
  ) returning * into v_transaction;

  return v_transaction;
end;
$$;
revoke all on function public.admin_adjust_balance(uuid, text, numeric, text) from public, anon;
grant execute on function public.admin_adjust_balance(uuid, text, numeric, text) to authenticated;

-- Supports the existing admin user editor's absolute checking/savings values.
-- Both balances and their audit rows are committed or rolled back together.
create or replace function public.admin_set_account_balances(
  p_account_id uuid,
  p_checking_balance numeric,
  p_savings_balance numeric,
  p_note text default null
)
returns public.accounts
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_account public.accounts;
  v_updated_account public.accounts;
  v_checking_delta numeric;
  v_savings_delta numeric;
  v_note text;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can set account balances';
  end if;
  if p_checking_balance is null or p_checking_balance < 0
     or p_savings_balance is null or p_savings_balance < 0 then
    raise exception 'Account balances must be zero or greater';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;
  if not found then
    raise exception 'Account not found';
  end if;

  v_checking_delta := p_checking_balance - v_account.checking_account_balance;
  v_savings_delta := p_savings_balance - v_account.savings_account_balance;
  v_note := coalesce(nullif(trim(p_note), ''), 'Administrator balance update');

  update public.accounts
  set checking_account_balance = p_checking_balance,
      savings_account_balance = p_savings_balance
  where id = p_account_id
  returning * into v_updated_account;

  if v_checking_delta <> 0 then
    insert into public.transactions (
      user_id, email, account_name, user_account, from_account,
      type, amount, note, status, reference, date
    ) values (
      v_account.id, v_account.email, v_account.full_name, v_account.account_number,
      'checking', 'admin_adjustment', abs(v_checking_delta),
      v_note || ' (checking)', 'completed',
      'ADJUST-CHECKING-' || gen_random_uuid()::text, current_date
    );
  end if;

  if v_savings_delta <> 0 then
    insert into public.transactions (
      user_id, email, account_name, user_account, from_account,
      type, amount, note, status, reference, date
    ) values (
      v_account.id, v_account.email, v_account.full_name, v_account.account_number,
      'savings', 'admin_adjustment', abs(v_savings_delta),
      v_note || ' (savings)', 'completed',
      'ADJUST-SAVINGS-' || gen_random_uuid()::text, current_date
    );
  end if;

  return v_updated_account;
end;
$$;
revoke all on function public.admin_set_account_balances(uuid, numeric, numeric, text) from public, anon;
grant execute on function public.admin_set_account_balances(uuid, numeric, numeric, text) to authenticated;

-- ============================================
-- Grants and RLS
-- ============================================
grant usage on schema public to authenticated;

alter table public.accounts enable row level security;
alter table public.deposits enable row level security;
alter table public.transactions enable row level security;

revoke all on table public.accounts from public, anon, authenticated;
revoke all on table public.deposits from public, anon, authenticated;
revoke all on table public.transactions from public, anon, authenticated;

grant select on table public.accounts to authenticated;
grant insert (
  id, full_name, email, phone, date_of_birth, national_id, account_number,
  referral_code, checking_account_balance, savings_account_balance, balance
) on public.accounts to authenticated;
grant update (
  full_name, phone, address, date_of_birth, occupation, profile_image, status
) on public.accounts to authenticated;

grant select on table public.deposits to authenticated;
grant select on table public.transactions to authenticated;

-- Remove policies from the repository migrations so they cannot broaden access.
drop policy if exists "Admins can manage all accounts" on public.accounts;
drop policy if exists "Users can submit own cheque deposits" on public.deposits;
drop policy if exists "Users can read own deposits" on public.deposits;
drop policy if exists "Admins can review deposits" on public.deposits;
drop policy if exists "Users can remove own pending deposits" on public.deposits;
drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can create own pending deposit transaction" on public.transactions;
drop policy if exists "Admins can manage transactions" on public.transactions;

drop policy if exists "BMO accounts select own or admin" on public.accounts;
drop policy if exists "BMO accounts insert own zero-balance" on public.accounts;
drop policy if exists "BMO accounts update own profile" on public.accounts;
drop policy if exists "BMO admins update safe account fields" on public.accounts;
drop policy if exists "BMO deposits select own or admin" on public.deposits;
drop policy if exists "BMO transactions select own or admin" on public.transactions;

create policy "BMO accounts select own or admin"
on public.accounts for select to authenticated
using (id = auth.uid() or public.is_admin());

create policy "BMO accounts insert own zero-balance"
on public.accounts for insert to authenticated
with check (
  id = auth.uid()
  and lower(email) = lower(auth.jwt() ->> 'email')
  and role = 'user'
  and status = 'active'
  and checking_account_balance = 0
  and savings_account_balance = 0
  and balance = 0
);

create policy "BMO accounts update own profile"
on public.accounts for update to authenticated
using (id = auth.uid())
with check (id = auth.uid() and role = 'user' and status = 'active');

create policy "BMO admins update safe account fields"
on public.accounts for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "BMO deposits select own or admin"
on public.deposits for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "BMO transactions select own or admin"
on public.transactions for select to authenticated
using (user_id = auth.uid() or public.is_admin());

-- ============================================
-- Storage
-- ============================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cheque-images', 'cheque-images', false, 8388608, array['image/jpeg']::text[])
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users upload own cheque images" on storage.objects;
drop policy if exists "Users read own cheque images" on storage.objects;
drop policy if exists "Users replace own cheque images" on storage.objects;
drop policy if exists "BMO users upload own cheque images" on storage.objects;
drop policy if exists "BMO users read own or admin cheque images" on storage.objects;
drop policy if exists "BMO users delete own cheque images" on storage.objects;

create policy "BMO users upload own cheque images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'cheque-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "BMO users read own or admin cheque images"
on storage.objects for select to authenticated
using (
  bucket_id = 'cheque-images'
  and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
);

-- Allows the form to clean up files when its database submission fails.
create policy "BMO users delete own cheque images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'cheque-images'
  and (storage.foldername(name))[1] = auth.uid()::text
  and not exists (
    select 1
    from public.deposits d
    where d.user_id = auth.uid()
      and (d.front_image_path = name or d.back_image_path = name)
  )
);

commit;

-- ============================================
-- Optional admin bootstrap (run manually after the account is created)
-- ============================================
-- UPDATE public.accounts
-- SET role = 'admin'
-- WHERE id = (SELECT id FROM auth.users WHERE lower(email) = lower('admin@example.com'));
-- Use a real address you control. Do not store a password or service-role key here.

-- ============================================
-- Verification queries (run after the setup transaction commits)
-- ============================================
-- 1. Tables
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('accounts', 'transactions', 'deposits')
order by table_name;

-- 2. Foreign keys
select tc.table_name, tc.constraint_name, kcu.column_name,
       ccu.table_name as referenced_table, ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name and tc.constraint_schema = kcu.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name and ccu.constraint_schema = tc.constraint_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in ('accounts', 'transactions', 'deposits')
order by tc.table_name, tc.constraint_name;

-- 3. RLS enabled
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('accounts', 'transactions', 'deposits')
order by c.relname;

-- 4. Policies
select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('accounts', 'transactions', 'deposits')
order by tablename, policyname;

-- 5. Functions
select n.nspname as schema_name, p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_admin', 'submit_cheque_deposit', 'review_cheque_deposit',
    'process_transfer', 'process_withdrawal', 'admin_adjust_balance',
    'admin_set_account_balances', 'sync_account_totals'
  )
order by p.proname;

-- 6. Triggers
select event_object_table as table_name, trigger_name, event_manipulation, action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and event_object_table = 'accounts'
order by trigger_name, event_manipulation;

-- 7. Storage bucket
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'cheque-images';

-- 8. Important indexes
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('accounts', 'transactions', 'deposits')
order by tablename, indexname;

-- ============================================
-- Cross-user RLS smoke test (replace both UUID placeholders, then run separately)
-- ============================================
-- Expected counts are all zero. The test sets the JWT subject to User A and asks
-- whether rows belonging to User B are visible. Run as the SQL Editor owner.
-- BEGIN;
-- SET LOCAL ROLE authenticated;
-- SELECT set_config('request.jwt.claim.sub', 'USER_A_UUID', true);
-- SELECT count(*) AS other_accounts_visible
--   FROM public.accounts WHERE id = 'USER_B_UUID'::uuid;
-- SELECT count(*) AS other_transactions_visible
--   FROM public.transactions WHERE user_id = 'USER_B_UUID'::uuid;
-- SELECT count(*) AS other_deposits_visible
--   FROM public.deposits WHERE user_id = 'USER_B_UUID'::uuid;
-- ROLLBACK;
-- A direct client balance update should fail with a column privilege error:
-- UPDATE public.accounts SET checking_account_balance = 999999
-- WHERE id = 'USER_A_UUID'::uuid;
