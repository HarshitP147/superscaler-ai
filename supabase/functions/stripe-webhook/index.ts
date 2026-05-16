// Stripe webhook -> credit top-up.
// Stripe POSTs `checkout.session.completed` here; we verify the signature and
// call the SECURITY DEFINER RPC `apply_stripe_credit_topup` (idempotent on
// the Checkout Session id). This is the ONLY path that grants credits — the
// browser `onComplete` handler just re-reads the DB.
//
// Local:  supabase functions serve stripe-webhook --no-verify-jwt --env-file .env.local
//         stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook
// JWT verification is disabled (see config.toml) because Stripe sends no Supabase JWT.

import Stripe from 'npm:stripe@^18'
import { createClient } from 'npm:@supabase/supabase-js@^2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // Deno has no synchronous crypto; Stripe needs the SubtleCrypto provider
  // together with the async `constructEventAsync`.
  httpClient: Stripe.createFetchHttpClient(),
})
const cryptoProvider = Stripe.createSubtleCryptoProvider()

const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

// `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the
// Edge runtime (local and hosted). Service role bypasses RLS; the RPC's
// own set_config('app.credit_write',...) satisfies the trigger guards.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return Response.json({ error: 'missing stripe-signature' }, { status: 400 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    return Response.json({ error: `signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return Response.json({ ok: true, ignored: event.type })
  }

  const session = event.data.object as Stripe.Checkout.Session
  if (session.payment_status !== 'paid') {
    return Response.json({ ok: true, status: session.payment_status })
  }

  const userId = session.metadata?.user_id
  const amountStr = session.metadata?.amount_credits
  if (!userId || !amountStr) {
    return Response.json({ error: 'missing metadata on session' }, { status: 400 })
  }

  const amount = Number(amountStr)
  if (!Number.isFinite(amount) || amount <= 0) {
    return Response.json({ error: 'invalid amount metadata' }, { status: 400 })
  }

  const { error } = await supabase.rpc('apply_stripe_credit_topup', {
    p_user_id: userId,
    p_amount: amount,
    p_session_id: session.id,
  })

  if (error) {
    console.error('apply_stripe_credit_topup failed', { sessionId: session.id, error })
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ ok: true })
})
