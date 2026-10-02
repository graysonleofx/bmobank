create or replace function public.admin_delete_account(p_account_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth
as $$
declare
  v_account public.accounts;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can delete accounts';
  end if;

  select * into v_account
  from public.accounts
  where id = p_account_id
  for update;
  if not found then
    raise exception 'Account not found';
  end if;

  if v_account.checking_account_balance <> 0
     or v_account.savings_account_balance <> 0
     or exists (select 1 from public.deposits where user_id = p_account_id or account_id = p_account_id)
     or exists (select 1 from public.transactions where user_id = p_account_id) then
    raise exception 'Cannot permanently delete an account with a balance, deposits, or transaction history. Preserve the account to retain its financial records.';
  end if;

  begin
    delete from public.accounts where id = p_account_id;
    delete from auth.users where id = p_account_id;
  exception when foreign_key_violation then
    raise exception 'Cannot permanently delete this account because related records exist. Preserve the account to retain its financial records.';
  end;
end;
$$;

revoke all on function public.admin_delete_account(uuid) from public, anon;
grant execute on function public.admin_delete_account(uuid) to authenticated;

notify pgrst, 'reload schema';