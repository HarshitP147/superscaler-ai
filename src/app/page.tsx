import { cookies } from 'next/headers'
import { Hero } from '@/sections/Hero'
import { UploadPlaceholder } from '@/sections/UploadPlaceholder'
import { createClient } from '@/util/supabase/server'

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user ? <UploadPlaceholder /> : <Hero />
}
