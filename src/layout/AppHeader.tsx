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
  const credits = 0

  return (
    <header className="sticky top-0 z-20 w-full border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <span className="text-lg font-semibold tracking-tight">Superscaler AI</span>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            <span className="font-semibold text-primary">{credits.toLocaleString()}</span>
            <span className="ml-1 text-base-content/70">credits</span>
          </span>
          <UserMenu avatarUrl={avatarUrl} initial={initial} displayName={displayName} />
        </div>
      </div>
    </header>
  )
}
