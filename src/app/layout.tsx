import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import { AppHeader } from '@/layout/AppHeader'
import { createClient } from '@/util/supabase/server'
import { getUserCreditBalance } from '@/util/credits'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Superscaler AI',
  description: 'Upscale images and videos with AI.',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const credits = user ? await getUserCreditBalance(supabase, user.id) : 0

  return (
    <html
      lang="en"
      data-theme="nightgrass"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AppHeader user={user} credits={credits} />
        {children}
      </body>
    </html>
  )
}
