import type { User } from '@supabase/supabase-js'
import { UserMenu } from '@/layout/UserMenu'

export function AppHeader({ user }: { user: User | null }) {
  if (!user) return null

  const meta = (user.user_metadata ?? {}) as {
    avatar_url?: string
    picture?: string
    full_name?: string
    name?: string
  }
  const avatarUrl = meta.avatar_url ?? meta.picture ?? null
  const displayName = meta.full_name ?? meta.name ?? user.email ?? 'Account'
  const initial = (displayName[0] ?? '?').toUpperCase()

  return (
    <header className="fixed top-0 right-0 z-20 p-4">
      <UserMenu avatarUrl={avatarUrl} initial={initial} displayName={displayName} />
    </header>
  )
}
