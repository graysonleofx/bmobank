begin;

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
  if (p_from_account = 'checking' and v_account.checking_account_balance < p_amount)
     or (p_from_account = 'savings' and v_account.savings_account_balance < p_amount) then
    raise exception 'Insufficient funds';
  end if;

  if p_from_account = 'checking' then
    update public.accounts
    set checking_account_balance = checking_account_balance - p_amount
    where id = v_account.id;
  else
    update public.accounts
    set savings_account_balance = savings_account_balance - p_amount
    where id = v_account.id;
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

notify pgrst, 'reload schema';

commit;