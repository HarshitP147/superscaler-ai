import { NextResponse, type NextRequest } from 'next/server'
import { revalidatePath } from 'next/cache'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe-server'
import { createServiceClient } from '@/util/supabase/service'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'missing stripe-signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not set' }, { status: 500 })
  }

  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid signature'
    return NextResponse.json({ error: `signature verification failed: ${message}` }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ ok: true, ignored: event.type })
  }

  const session = event.data.object
  if (session.payment_status !== 'paid') {
    return NextResponse.json({ ok: true, status: session.payment_status })
  }

  const userId = session.metadata?.user_id
  const amountStr = session.metadata?.amount_credits
  if (!userId || !amountStr) {
    return NextResponse.json({ error: 'missing metadata on session' }, { status: 400 })
  }

  const amount = Number(amountStr)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'invalid amount metadata' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error } = await supabase.rpc('apply_stripe_credit_topup', {
    p_user_id: userId,
    p_amount: amount,
    p_session_id: session.id,
  })

  if (error) {
    console.error('apply_stripe_credit_topup failed', { sessionId: session.id, error })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  revalidatePath('/settings/credits')
  revalidatePath('/settings')
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true })
}
