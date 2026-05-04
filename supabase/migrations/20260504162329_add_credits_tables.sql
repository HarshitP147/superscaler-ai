create table public.user_credit_balances (
  user_id uuid primary key references auth.users (id) on delete cascade,
  balance numeric(12, 2) not null default 0 check (balance >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.credit_activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('manual_top_up')),
  amount numeric(12, 2) not null check (amount > 0),
  balance_after numeric(12, 2) not null check (balance_after >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index credit_activity_user_created_at_idx
  on public.credit_activity (user_id, created_at desc);

alter table public.user_credit_balances enable row level security;
alter table public.credit_activity enable row level security;

create policy "Users can read own credit balance"
  on public.user_credit_balances
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own credit balance row"
  on public.user_credit_balances
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update own credit balance row"
  on public.user_credit_balances
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can read own credit activity"
  on public.credit_activity
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own credit activity"
  on public.credit_activity
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create or replace function public.enforce_credit_balance_write()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.credit_write', true) = '1' then
    return new;
  end if;

  if tg_op = 'INSERT'
    and new.user_id = auth.uid()
    and new.balance = 0
  then
    return new;
  end if;

  raise exception 'Direct credit balance writes are not allowed';
end;
$$;

create or replace function public.enforce_credit_activity_insert()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.credit_write', true) = '1' then
    return new;
  end if;

  raise exception 'Direct credit activity writes are not allowed';
end;
$$;

create trigger guard_credit_balance_write
before insert or update on public.user_credit_balances
for each row
execute function public.enforce_credit_balance_write();

create trigger guard_credit_activity_insert
before insert on public.credit_activity
for each row
execute function public.enforce_credit_activity_insert();

create or replace function public.apply_manual_credit_topup(p_amount numeric(12, 2))
returns numeric(12, 2)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_amount numeric(12, 2) := round(p_amount, 2);
  v_timestamp timestamptz := timezone('utc', now());
  v_balance numeric(12, 2);
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_amount <> v_amount then
    raise exception 'Amount must have at most two decimal places';
  end if;

  perform set_config('app.credit_write', '1', true);

  insert into public.user_credit_balances (user_id, balance, created_at, updated_at)
  values (v_user_id, 0, v_timestamp, v_timestamp)
  on conflict (user_id) do nothing;

  update public.user_credit_balances
  set balance = balance + v_amount,
      updated_at = v_timestamp
  where user_id = v_user_id
  returning balance into v_balance;

  insert into public.credit_activity (user_id, kind, amount, balance_after, created_at)
  values (v_user_id, 'manual_top_up', v_amount, v_balance, v_timestamp);

  return v_balance;
end;
$$;

grant select, insert, update on public.user_credit_balances to authenticated;
grant select, insert on public.credit_activity to authenticated;
grant execute on function public.apply_manual_credit_topup(numeric) to authenticated;
