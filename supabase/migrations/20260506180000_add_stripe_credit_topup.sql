-- Allow stripe_payment as a credit_activity kind.
alter table public.credit_activity
  drop constraint credit_activity_kind_check,
  add constraint credit_activity_kind_check
    check (kind in ('manual_top_up', 'stripe_payment'));

-- Idempotency key for Stripe Checkout Sessions. Replayed webhooks must not double-credit.
alter table public.credit_activity
  add column stripe_session_id text unique;

-- Webhook-callable credit grant. SECURITY DEFINER bypasses RLS;
-- set_config satisfies the existing app.credit_write trigger guard.
create or replace function public.apply_stripe_credit_topup(
  p_user_id uuid,
  p_amount numeric(12, 2),
  p_session_id text
) returns numeric(12, 2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_amount numeric(12, 2) := round(p_amount, 2);
  v_timestamp timestamptz := timezone('utc', now());
  v_balance numeric(12, 2);
begin
  if p_user_id is null then
    raise exception 'User id is required';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Amount must be greater than zero';
  end if;

  if p_amount <> v_amount then
    raise exception 'Amount must have at most two decimal places';
  end if;

  if p_session_id is null or length(p_session_id) = 0 then
    raise exception 'Session id is required';
  end if;

  -- Idempotency: replayed webhook returns existing balance, no double-credit.
  if exists (select 1 from public.credit_activity where stripe_session_id = p_session_id) then
    select balance into v_balance from public.user_credit_balances where user_id = p_user_id;
    return coalesce(v_balance, 0);
  end if;

  perform set_config('app.credit_write', '1', true);

  insert into public.user_credit_balances (user_id, balance, created_at, updated_at)
  values (p_user_id, 0, v_timestamp, v_timestamp)
  on conflict (user_id) do nothing;

  update public.user_credit_balances
  set balance = balance + v_amount,
      updated_at = v_timestamp
  where user_id = p_user_id
  returning balance into v_balance;

  insert into public.credit_activity (user_id, kind, amount, balance_after, created_at, stripe_session_id)
  values (p_user_id, 'stripe_payment', v_amount, v_balance, v_timestamp, p_session_id);

  return v_balance;
end;
$$;

revoke all on function public.apply_stripe_credit_topup(uuid, numeric, text) from public;
grant execute on function public.apply_stripe_credit_topup(uuid, numeric, text) to service_role;
