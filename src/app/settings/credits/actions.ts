'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/util/supabase/server'
import { formatCredits, parseCreditAmount } from '@/util/credits'

export type CreditActionState = {
  tone: 'success' | 'error' | null
  message: string
}

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
