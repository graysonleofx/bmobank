begin;

grant usage on schema public to authenticated;
grant select on public.transactions to authenticated;

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "BMO transactions select own or admin" on public.transactions;

create policy "BMO transactions select own or admin"
on public.transactions for select to authenticated
using (user_id = auth.uid() or public.is_admin());

notify pgrst, 'reload schema';

commit;