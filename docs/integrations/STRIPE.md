# Stripe Integration

Stripe powers paid credit top-ups via **Embedded Checkout** — a Stripe-hosted iframe rendered inline on `/settings/credits`. We do **not** use PaymentIntents + PaymentElement; an earlier attempt with that path got tangled in `elements.submit()` ordering, dollars-vs-cents bugs, and CardElement-vs-PaymentElement compatibility. Embedded Checkout puts Stripe in charge of the form, we just trigger and credit.

GPU service integration is separate and not part of this flow yet.

---

## Architecture (one-liner per hop)

```
[CreditsDashboard] amount → button click
  → server action createCheckoutSessionAction(amount)
    → stripe.checkout.sessions.create({ ui_mode: 'embedded_page', mode: 'payment',
        metadata: { user_id, amount_credits } })
    → returns { clientSecret }
  → <EmbeddedCheckoutProvider><EmbeddedCheckout/></EmbeddedCheckoutProvider> renders inline
  → user pays (Stripe iframe handles card / 3DS / errors)
  → onComplete fires → close widget, router.refresh() after ~1.5s, banner clears at ~4s

  In parallel:
  Stripe → POST <supabase>/functions/v1/stripe-webhook (checkout.session.completed)
    → Supabase Edge Function (Deno) verifies signature (constructEventAsync)
    → service-role Supabase → rpc('apply_stripe_credit_topup',
        { p_user_id, p_amount, p_session_id })
    → balance + activity row written, idempotent on stripe_session_id
  → browser router.refresh() re-reads the row (no revalidatePath; Deno has none)
```

The webhook is a **Supabase Edge Function**, not a Next.js route. It runs next to the database (no Vercel→Supabase hop, no Vercel env to keep in sync) and is the only path that grants credits.

---

## Files

| File | Role |
|---|---|
| `src/lib/stripe-server.ts` | `import 'server-only'` Stripe Node singleton (`STRIPE_SECRET_KEY`). Throws at import if env missing. |
| `src/lib/stripe-client.ts` | `getStripe()` — cached `loadStripe()` promise (`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). |
| `src/sections/StripeCheckout.tsx` | Client wrapper for `<EmbeddedCheckoutProvider>` + `<EmbeddedCheckout>`. Props: `clientSecret`, `onComplete`. |
| `supabase/functions/stripe-webhook/index.ts` | **Supabase Edge Function** (Deno). Verifies signature via `constructEventAsync` + `createSubtleCryptoProvider()`, calls RPC with the service-role client built from auto-injected `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`. |
| `supabase/config.toml` → `[functions.stripe-webhook] verify_jwt = false` | Stripe sends no Supabase JWT; signature is verified inside the function instead. |
| `src/app/settings/credits/actions.ts` | Server actions. `addCreditsAction` is a dev/manual backdoor; `createCheckoutSessionAction` builds the Stripe session. |
| `src/sections/CreditsDashboard.tsx` | Client UI. Calls action, renders `<StripeCheckout>` while `checkoutSecret` set, refreshes server data on completion. |
| `supabase/migrations/20260506180000_add_stripe_credit_topup.sql` | Widens `credit_activity.kind` to allow `'stripe_payment'`, adds `stripe_session_id text UNIQUE`, creates RPC `apply_stripe_credit_topup`. |

`/settings/credits/page.tsx` wraps `CreditsDashboard` in `<Suspense>` because the client component reads `useSearchParams()` (Next 16 requires the boundary).

---

## Database

### New column

`credit_activity.stripe_session_id text UNIQUE` — Stripe Checkout Session id (`cs_test_...` / `cs_live_...`). The unique index is the idempotency key for replayed webhooks.

### Kind enum

`credit_activity.kind` widened to `('manual_top_up', 'stripe_payment')`. The constraint name is `credit_activity_kind_check` (auto-generated; the migration drops + re-adds it explicitly).

### RPC `apply_stripe_credit_topup(p_user_id uuid, p_amount numeric(12,2), p_session_id text) → numeric`

- `SECURITY DEFINER` — runs as the function owner, bypasses RLS. Required because the webhook calls it from a non-authenticated context (no `auth.uid()`).
- `set_config('app.credit_write', '1', true)` inside the body satisfies the existing `enforce_credit_balance_write` / `enforce_credit_activity_insert` triggers (see `20260504162329_add_credits_tables.sql`).
- Idempotency guard: if any `credit_activity` row already has the given `stripe_session_id`, return the existing balance without writing anything. Replayed webhooks are safe.
- Permissions: `REVOKE ALL FROM PUBLIC; GRANT EXECUTE TO service_role`. Authenticated users cannot call it directly — the `addCreditsAction` flow still goes through `apply_manual_credit_topup`.

The earlier `apply_manual_credit_topup` (security invoker, uses `auth.uid()`) is preserved as a dev backdoor and is **not** removed.

---

## Environment variables

| Var | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `.env.local` (public) | `loadStripe()` in the browser |
| `STRIPE_SECRET_KEY` | `.env.local` (server only) | Stripe Node API calls |
| `STRIPE_WEBHOOK_SECRET` | `.env.local`, passed to the function via `supabase functions serve --env-file .env.local` | Verifies webhook signatures inside the Edge Function |
| `STRIPE_SECRET_KEY` | same | Used by the Edge Function to construct the Stripe client for verification |

The Edge Function does **not** read `SUPABASE_SECRET_KEY`. Supabase auto-injects `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` into every function (local serve and hosted), and the function builds its service-role client from those. `SUPABASE_SECRET_KEY` / `createServiceClient` are gone — they only existed for the deleted Next.js route.

For hosted deploy, set the Stripe secrets with `supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=...` (the hosted endpoint's own `whsec_`, not the CLI's).

---

## Stripe-node version pitfall — `ui_mode`

Stripe Node v21+ (we run v22) **renamed** the `ui_mode` enum values:

| Old | New |
|---|---|
| `'embedded'` | `'embedded_page'` |
| `'hosted'` | `'hosted_page'` |
| — | `'elements'` (new — Custom Checkout) |
| — | `'form'` (new) |

The Stripe REST API still accepts the old names, but the Node SDK's TypeScript enum forces the new values. Use `ui_mode: 'embedded_page'`. If you copy older snippets from Stripe docs and TypeScript complains "`'embedded'` is not assignable to `UiMode`", that's why.

---

## Webhook flow

The webhook listens for **`checkout.session.completed`** only. Other events are accepted (200) but ignored.

Verification (Deno — async + SubtleCrypto provider, no sync crypto available):

```ts
const event = await stripe.webhooks.constructEventAsync(
  body, signature, Deno.env.get('STRIPE_WEBHOOK_SECRET')!, undefined, cryptoProvider,
)
```

`await req.text()` is critical — Stripe verifies against the raw body. Don't `req.json()` or `JSON.stringify` in between.

Crediting:

```ts
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)
await supabase.rpc('apply_stripe_credit_topup', {
  p_user_id: session.metadata.user_id,
  p_amount: Number(session.metadata.amount_credits),
  p_session_id: session.id,
})
```

No `revalidatePath` (Deno, not Next). The dashboard calls `router.refresh()` after `onComplete`, so the user's next render reads the updated row.

The webhook returns 400 on signature failure, 400 on missing/invalid metadata, 500 on RPC failure, 200 otherwise.

---

## Local development

### Stripe CLI

Two processes. Serve the function (loads Stripe secrets, reads `verify_jwt=false` from config.toml):

```bash
supabase functions serve stripe-webhook --no-verify-jwt --env-file .env.local
```

Forward Stripe to the **function** endpoint (note port 54321 + `/functions/v1/`):

```bash
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
```

The CLI **must** run with `--forward-to`, otherwise events are observed but not delivered — it prints events to the terminal but never forwards them. If Stripe Dashboard shows payments succeeding but the local DB never gains a `stripe_session_id` row, check this first.

The CLI prints its signing secret on every start. It's stable per CLI auth session, so the value in `.env.local` is fine to reuse across restarts as long as you stay logged into the same Stripe account. If you switch accounts or re-`stripe login`, refresh `.env.local` and restart `npm run dev`.

### Supabase migrations

Local-only. Run:

```bash
supabase migration up
```

**Never** `supabase db push` — that targets the linked remote project. The remote DB stays untouched until the user explicitly approves a push. (See `MEMORY.md` in the agent memory store: "Supabase local-only by default".)

### Test cards (sandbox account in use)

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds, no 3DS |
| `4000 0027 6000 3184` | Requires 3DS authentication |
| `4000 0000 0000 0002` | Decline |
| `4000 0000 0000 9995` | Insufficient funds |

Any future expiry, any CVC, any zip.

---

## Verification checklist

1. `.env.local` has `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
2. `supabase migration up` applied, RPC visible in `\df public.apply_stripe_credit_topup`.
3. `supabase functions serve stripe-webhook --no-verify-jwt --env-file .env.local` running.
4. `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook` running. Confirm signing secret matches `.env.local`. Then `npm run dev`.
5. `/settings/credits` → enter amount → **Add credits** → Embedded Checkout iframe renders below the input.
6. Pay with `4242 4242 4242 4242`.
7. `stripe listen` shows `--> checkout.session.completed [200]`.
8. `credit_activity` gains a row with `kind = 'stripe_payment'` and `stripe_session_id = 'cs_test_...'`.
9. Idempotency: `stripe events resend evt_xxx` — balance must NOT change, response stays 200.

If the Stripe Dashboard shows a successful charge but the local DB has no new row: (a) `stripe listen` running without `--forward-to` (`ps aux | grep 'stripe listen'`), or (b) `supabase functions serve` not running / forwarding to the wrong port (must be `54321/functions/v1/stripe-webhook`, not `3000`).

> History: the webhook was originally a Next.js route (`src/app/api/stripe/webhook/route.ts` + `src/util/supabase/service.ts`). It worked locally but the prod path was brittle (Vercel env sync, no registered Dashboard endpoint, remote migration not pushed). Moved to a Supabase Edge Function — runs next to the DB, single env surface. The Next route and `service.ts` are deleted.

---

## UX notes

- `redirect_on_completion: 'if_required'` keeps card payments inline (`onComplete` fires on the same page) and only redirects when a payment method genuinely needs it (3DS, bank redirects). The success URL pattern includes `{CHECKOUT_SESSION_ID}` so the dashboard can show a banner derived from `?stripe_session_id` if a redirect did happen.
- The success banner clears automatically ~4s after `onComplete` so the post-refresh balance is the only thing remaining on screen.
- `useSearchParams()` in `CreditsDashboard` requires a `<Suspense>` boundary in the parent server component — Next.js 16 build check enforces this.
- The lint rule `react-hooks/set-state-in-effect` blocks setting state from a URL-derived effect. Banner state for the redirect-return path is **derived during render**, not set inside `useEffect`.
