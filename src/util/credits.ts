import type { SupabaseClient } from '@supabase/supabase-js'

const CREDIT_DECIMAL_PLACES = 2
const CREDIT_LOCALE = 'en-US'

export const CREDIT_PACK_AMOUNTS = [10, 25, 50, 100] as const
export const MIN_CREDIT_TOP_UP = 5
export const MAX_CUSTOM_CREDIT_AMOUNT = 10000
export const CREDIT_ACTIVITY_LIMIT = 8

type CreditBalanceRow = {
  balance: number | string
}

type CreditActivityRow = {
  id: string
  kind: string
  amount: number | string
  balance_after: number | string
  created_at: string
}

export type CreditActivityItem = {
  id: string
  kind: 'manual_top_up'
  amount: number
  balanceAfter: number
  createdAt: string
}

export type CreditsOverview = {
  balance: number
  activity: CreditActivityItem[]
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return Number(value)
  return 0
}

export function formatCredits(amount: number) {
  return amount.toLocaleString(CREDIT_LOCALE, {
    minimumFractionDigits: CREDIT_DECIMAL_PLACES,
    maximumFractionDigits: CREDIT_DECIMAL_PLACES,
  })
}

export function formatCreditTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(CREDIT_LOCALE, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

export function formatCreditActivityKind(kind: CreditActivityItem['kind']) {
  switch (kind) {
    case 'manual_top_up':
      return 'Manual top-up'
    default:
      return kind
  }
}

export function parseCreditAmount(rawValue: string) {
  const value = rawValue.trim()

  if (!/^(?:\d+|\d*\.\d{1,2})$/.test(value)) {
    return null
  }

  const amount = Number(value)
  if (!Number.isFinite(amount) || amount < MIN_CREDIT_TOP_UP || amount > MAX_CUSTOM_CREDIT_AMOUNT) {
    return null
  }

  return Math.round(amount * 100) / 100
}

export async function getUserCreditBalance(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('user_credit_balances')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle<CreditBalanceRow>()

  if (error) {
    throw error
  }

  return toNumber(data?.balance)
}

export async function getCreditsOverview(supabase: SupabaseClient, userId: string): Promise<CreditsOverview> {
  const [balanceResult, activityResult] = await Promise.all([
    supabase
      .from('user_credit_balances')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle<CreditBalanceRow>(),
    supabase
      .from('credit_activity')
      .select('id, kind, amount, balance_after, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(CREDIT_ACTIVITY_LIMIT)
      .returns<CreditActivityRow[]>(),
  ])

  if (balanceResult.error) {
    throw balanceResult.error
  }

  if (activityResult.error) {
    throw activityResult.error
  }

  return {
    balance: toNumber(balanceResult.data?.balance),
    activity: (activityResult.data ?? []).map((item) => ({
      id: item.id,
      kind: 'manual_top_up',
      amount: toNumber(item.amount),
      balanceAfter: toNumber(item.balance_after),
      createdAt: item.created_at,
    })),
  }
}
