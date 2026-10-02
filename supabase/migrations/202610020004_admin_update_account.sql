create or replace function public.admin_update_account(
  p_account_id uuid,
  p_full_name text,
  p_checking_balance numeric,
  p_savings_balance numeric
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
begin
  if not public.is_admin() then
    raise exception 'Only administrators can update accounts';
  end if;
  if nullif(trim(p_full_name), '') is null then
    raise exception 'Account name is required';
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

  update public.accounts
  set full_name = trim(p_full_name),
      checking_account_balance = p_checking_balance,
      savings_account_balance = p_savings_balance
  where id = p_account_id
  returning * into v_updated_account;

  if v_checking_delta <> 0 then
    insert into public.transactions (
      user_id, email, account_name, user_account, from_account,
      type, amount, note, status, reference, date
    ) values (
      v_updated_account.id, v_updated_account.email, v_updated_account.full_name,
      v_updated_account.account_number, 'checking', 'admin_adjustment',
      abs(v_checking_delta), 'Administrator account edit (checking)',
      'completed', 'ADJUST-CHECKING-' || gen_random_uuid()::text, current_date
    );
  end if;

  if v_savings_delta <> 0 then
    insert into public.transactions (
      user_id, email, account_name, user_account, from_account,
      type, amount, note, status, reference, date
    ) values (
      v_updated_account.id, v_updated_account.email, v_updated_account.full_name,
      v_updated_account.account_number, 'savings', 'admin_adjustment',
      abs(v_savings_delta), 'Administrator account edit (savings)',
      'completed', 'ADJUST-SAVINGS-' || gen_random_uuid()::text, current_date
    );
  end if;

  return v_updated_account;
end;
$$;

revoke all on function public.admin_update_account(uuid, text, numeric, numeric) from public, anon;
grant execute on function public.admin_update_account(uuid, text, numeric, numeric) to authenticated;

notify pgrst, 'reload schema';