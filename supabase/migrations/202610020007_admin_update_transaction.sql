create or replace function public.admin_update_transaction(
  p_transaction_id uuid,
  p_account_id uuid,
  p_type text,
  p_amount numeric,
  p_note text,
  p_status text,
  p_from_account text,
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
  v_updated_transaction public.transactions;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update transactions';
  end if;
  if p_type is null or p_type not in ('deposit', 'withdrawal', 'transfer') then
    raise exception 'Invalid transaction type';
  end if;
  if p_amount is null or p_amount <= 0 or p_amount::text in ('NaN', 'Infinity', '-Infinity') then
    raise exception 'Transaction amount must be greater than zero';
  end if;
  if p_status is null or p_status not in ('pending', 'completed', 'failed', 'approved', 'rejected') then
    raise exception 'Invalid transaction status';
  end if;
  if p_from_account is not null and p_from_account not in ('checking', 'savings') then
    raise exception 'Invalid source account';
  end if;
  if p_date is null then
    raise exception 'Transaction date is required';
  end if;

  select * into v_transaction
  from public.transactions
  where id = p_transaction_id
  for update;
  if not found then
    raise exception 'Transaction not found';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;
  if not found then
    raise exception 'Account not found';
  end if;

  update public.transactions
  set user_id = v_account.id,
      email = v_account.email,
      account_name = v_account.full_name,
      user_account = v_account.account_number,
      account_number = v_account.account_number,
      type = p_type,
      amount = p_amount,
      note = coalesce(nullif(trim(p_note), ''), 'Admin transaction'),
      status = p_status,
      from_account = p_from_account,
      date = p_date,
      created_at = p_date::timestamp at time zone 'UTC'
  where id = p_transaction_id
  returning * into v_updated_transaction;

  return v_updated_transaction;
end;
$$;

revoke all on function public.admin_update_transaction(uuid, uuid, text, numeric, text, text, text, date) from public, anon;
grant execute on function public.admin_update_transaction(uuid, uuid, text, numeric, text, text, text, date) to authenticated;

notify pgrst, 'reload schema';