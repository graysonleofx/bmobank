begin;

alter table public.transactions enable row level security;

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
	if v_account.status is distinct from 'active' then
		raise exception 'Account is not active';
	end if;

	insert into public.deposits (
		id, user_id, account_id, account_number, amount, currency,
		cheque_number, bank_name, account_holder_name, issue_date,
		memo, notes, front_image_path, back_image_path, status
	) values (
		p_deposit_id, v_account.id, v_account.id, v_account.account_number,
		p_amount, p_currency, trim(p_cheque_number), trim(p_bank_name),
		trim(p_account_holder_name), p_issue_date, nullif(trim(p_memo), ''),
		nullif(trim(p_notes), ''), p_front_image_path, p_back_image_path, 'pending'
	) returning * into v_deposit;

	insert into public.transactions (
		user_id, deposit_id, reference, email, account_name, user_account,
		type, amount, note, status, created_at, date
	) values (
		v_account.id, v_deposit.id, 'CHEQUE-' || v_deposit.id::text,
		v_account.email, v_account.full_name, v_account.account_number,
		'cheque_deposit', p_amount, coalesce(nullif(trim(p_memo), ''), 'Cheque deposit'),
		'pending', now(), current_date
	);

	return v_deposit;
end;
$$;
revoke all on function public.submit_cheque_deposit(uuid, numeric, text, text, text, text, date, text, text, text, text) from public, anon;
grant execute on function public.submit_cheque_deposit(uuid, numeric, text, text, text, text, date, text, text, text, text) to authenticated;

drop policy if exists "Users can read own transactions" on public.transactions;
drop policy if exists "Users can create own pending deposit transaction" on public.transactions;
drop policy if exists "BMO transactions select own or admin" on public.transactions;

create policy "BMO transactions select own or admin"
on public.transactions for select to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "BMO users delete own cheque images" on storage.objects;
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

notify pgrst, 'reload schema';

commit;