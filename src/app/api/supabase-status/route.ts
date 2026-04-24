import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@/util/supabase/server"

function detectEnvironment(url: string): 'local' | 'remote' | 'unknown' {
  if (url.includes('127.0.0.1') || url.includes('localhost')) return 'local'
  if (url.includes('.supabase.co')) return 'remote'
  return 'unknown'
}

function extractProjectRef(url: string): string | undefined {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/)
  return match?.[1]
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  if (!url) {
    return NextResponse.json({
      connected: false,
      environment: 'unknown',
      url: '',
      error: 'NEXT_PUBLIC_SUPABASE_URL not set',
    })
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const environment = detectEnvironment(url)
  const projectRef = extractProjectRef(url)

  try {
    const { error } = await supabase.auth.getUser()

    // network/config errors have a status < 200 or message about fetch failure
    if (error && error.message?.toLowerCase().includes('fetch')) {
      return NextResponse.json({
        connected: false,
        environment,
        url,
        projectRef,
        error: error.message,
      })
    }

    return NextResponse.json({
      connected: true,
      environment,
      url,
      projectRef,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({
      connected: false,
      environment,
      url,
      projectRef,
      error: message,
    })
  }
}
