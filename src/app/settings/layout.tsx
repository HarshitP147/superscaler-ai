import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { SettingsShell } from '@/layout/SettingsShell'
import { createClient } from '@/util/supabase/server'

type SettingsLayoutProps = {
  children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return <SettingsShell>{children}</SettingsShell>
}
