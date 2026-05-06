import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { CreditsDashboard } from '@/sections/CreditsDashboard'
import { createClient } from '@/util/supabase/server'
import { getCreditsOverview } from '@/util/credits'

export default async function SettingsCreditsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const overview = await getCreditsOverview(supabase, user.id)

  return (
    <Suspense fallback={null}>
      <CreditsDashboard overview={overview} />
    </Suspense>
  )
}
