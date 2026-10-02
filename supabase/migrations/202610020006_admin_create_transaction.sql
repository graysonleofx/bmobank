create or replace function public.admin_create_transaction(
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_note text,
  p_date date
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
  if not public.is_admin() then
    raise exception 'Only administrators can create transactions';
  end if;
  if p_type is null or p_type not in ('deposit', 'withdrawal', 'transfer') then
    raise exception 'Invalid transaction type';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Transaction amount must be greater than zero';
  end if;
  if p_date is null then
    raise exception 'Transaction date is required';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;
  if not found then
    raise exception 'Account not found';
  end if;

  insert into public.transactions (
    user_id, email, account_name, user_account, account_number,
    type, amount, note, status, reference, date
  ) values (
    v_account.id, v_account.email, v_account.full_name, v_account.account_number,
    v_account.account_number, p_type, p_amount,
    coalesce(nullif(trim(p_note), ''), 'Admin transaction'),
    'completed', 'ADMIN-' || gen_random_uuid()::text, p_date
  ) returning * into v_transaction;

  return v_transaction;
end;
$$;

revoke all on function public.admin_create_transaction(uuid, text, numeric, text, date) from public, anon;
grant execute on function public.admin_create_transaction(uuid, text, numeric, text, date) to authenticated;

notify pgrst, 'reload schema';