'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe-server'
import { createClient } from '@/util/supabase/server'
import { formatCredits, parseCreditAmount } from '@/util/credits'

export type CreditActionState = {
  tone: 'success' | 'error' | null
  message: string
}

export type CheckoutSessionResult =
  | { clientSecret: string }
  | { error: string }

function getActionAmount(formData: FormData) {
  const presetAmount = formData.get('amount')
  if (typeof presetAmount === 'string' && presetAmount.trim()) {
    return parseCreditAmount(presetAmount)
  }

  const customAmount = formData.get('customAmount')
  if (typeof customAmount === 'string' && customAmount.trim()) {
    return parseCreditAmount(customAmount)
  }

  return null
}

export async function addCreditsAction(
  _previousState: CreditActionState,
  formData: FormData,
): Promise<CreditActionState> {
  const amount = getActionAmount(formData)
  if (!amount) {
    return {
      tone: 'error',
      message: 'Enter a valid amount before adding credits.',
    }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { error } = await supabase.rpc('apply_manual_credit_topup', {
    p_amount: amount,
  })

  if (error) {
    return {
      tone: 'error',
      message: 'Credits could not be updated. Try again.',
    }
  }

  revalidatePath('/settings')
  revalidatePath('/settings/credits')
  revalidatePath('/credits')
  revalidatePath('/', 'layout')

  return {
    tone: 'success',
    message: `${formatCredits(amount)} credits added to your balance.`,
  }
}

export async function createCheckoutSessionAction(
  rawAmount: number | string,
): Promise<CheckoutSessionResult> {
  const amount = parseCreditAmount(String(rawAmount))
  if (!amount) {
    return { error: 'Enter a valid amount before continuing.' }
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Sign in required to add credits.' }
  }

  const headerList = await headers()
  const origin =
    headerList.get('origin') ??
    `https://${headerList.get('host') ?? 'localhost:3000'}`

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded_page',
    mode: 'payment',
    redirect_on_completion: 'if_required',
    return_url: `${origin}/settings/credits?stripe_session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: 'Account credits' },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: {
      user_id: user.id,
      amount_credits: amount.toFixed(2),
    },
  })

  if (!session.client_secret) {
    return { error: 'Stripe did not return a client secret.' }
  }

  return { clientSecret: session.client_secret }
}
