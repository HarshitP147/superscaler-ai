'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AppWindow, CreditCard } from 'lucide-react'

type SettingsShellProps = {
  children: React.ReactNode
}

const items = [
  {
    key: 'app',
    label: 'App',
    href: '/settings',
    icon: AppWindow,
  },
  {
    key: 'credits',
    label: 'Credits',
    href: '/settings/credits',
    icon: CreditCard,
  },
] as const

export function SettingsShell({ children }: SettingsShellProps) {
  const pathname = usePathname()

  return (
    <main className="flex-1 px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid min-h-[calc(100vh-9rem)] gap-12 lg:grid-cols-[248px_minmax(0,1fr)]">
          <aside className="lg:pt-10">
            <nav className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon
                const isActive =
                  item.href === '/settings'
                    ? pathname === '/settings'
                    : pathname.startsWith(item.href)

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-3 rounded-[1rem] px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-base-200 text-base-content'
                        : 'text-base-content/65 hover:bg-base-200/70 hover:text-base-content'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-base-content/45'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </aside>

          <section className="min-w-0 lg:pt-6">{children}</section>
        </div>
      </div>
    </main>
  )
}
