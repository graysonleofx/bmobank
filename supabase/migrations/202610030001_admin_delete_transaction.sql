create or replace function public.admin_delete_transaction(p_transaction_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_transaction public.transactions;
begin
  if not public.is_admin() then
    raise exception 'Only administrators can delete transactions';
  end if;

  select * into v_transaction
  from public.transactions
  where id = p_transaction_id
  for update;
  if not found then
    raise exception 'Transaction not found';
  end if;

  delete from public.transactions where id = p_transaction_id;
end;
$$;

revoke all on function public.admin_delete_transaction(uuid) from public, anon;
grant execute on function public.admin_delete_transaction(uuid) to authenticated;

notify pgrst, 'reload schema';