import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/util/supabase/server'

export default async function SettingsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/')

  return (
    <main className="flex-1 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Settings</h1>
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <p className="text-base-content/70">Settings coming soon.</p>
          </div>
        </div>
      </div>
    </main>
  )
}
