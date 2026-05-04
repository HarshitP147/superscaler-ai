import Link from 'next/link'
import type { User } from '@supabase/supabase-js'
import { UserMenu } from '@/layout/UserMenu'
import { formatCredits } from '@/util/credits'

export function AppHeader({
  user,
  credits,
}: {
  user: User | null
  credits: number
}) {
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
    <header className="sticky top-0 z-20 w-full border-b border-base-300 bg-base-100/80 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Superscaler AI
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex items-baseline gap-1.5 text-sm">
            <span className="font-semibold text-primary">{formatCredits(credits)}</span>
            <span className="text-base-content/70">credits</span>
          </div>
          <UserMenu avatarUrl={avatarUrl} initial={initial} displayName={displayName} />
        </div>
      </div>
    </header>
  )
}
