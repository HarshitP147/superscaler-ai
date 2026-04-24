import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type SupabaseStatusResponse = {
  connected: boolean
  environment: 'local' | 'remote' | 'unknown'
  url: string
  projectRef?: string
  region?: string
  error?: string
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<SupabaseStatusResponse>> {
  const response = NextResponse.next()
  const supabase = createSupabaseServerClient(request, response)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    return NextResponse.json(
      {
        connected: false,
        environment: 'unknown',
        url: 'not configured',
        error: 'NEXT_PUBLIC_SUPABASE_URL env var is not set',
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  }

  let environment: 'local' | 'remote' | 'unknown' = 'unknown'
  let displayUrl = supabaseUrl
  let projectRef: string | undefined

  if (supabaseUrl.includes('localhost') || supabaseUrl.includes('127.0.0.1')) {
    environment = 'local'
    displayUrl = supabaseUrl.replace(/^https?:\/\//, '')
  } else {
    const remoteMatch = supabaseUrl.match(/^https:\/\/([^.]+)\.supabase\.co/)
    if (remoteMatch) {
      environment = 'remote'
      projectRef = remoteMatch[1]
      const ref = projectRef
      const truncatedRef =
        ref.length > 16 ? ref.slice(0, 11) + '...' + ref.slice(-3) : ref
      displayUrl = `${truncatedRef}.supabase.co`
    } else {
      displayUrl =
        supabaseUrl.length > 40 ? supabaseUrl.slice(0, 37) + '...' : supabaseUrl
    }
  }

  const region = process.env.NEXT_PUBLIC_SUPABASE_REGION

  // Refresh session via server client (cookie sync happens automatically)
  await supabase.auth.getUser()

  // Build response payload
  const buildResponse = (
    connected: boolean,
    error?: string
  ): SupabaseStatusResponse => ({
    connected,
    environment,
    url: displayUrl,
    ...(projectRef && { projectRef }),
    ...(region && { region }),
    ...(error && { error }),
  })

  try {
    const healthRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      next: { revalidate: 0 },
    })

    if (!healthRes.ok) {
      const payload = buildResponse(
        false,
        `Health endpoint returned HTTP ${healthRes.status}`
      )
      response.headers.set('Cache-Control', 'no-store')
      return NextResponse.json(payload, { status: 200, headers: response.headers })
    }

    const payload = buildResponse(true)
    response.headers.set('Cache-Control', 'no-store')
    return NextResponse.json(payload, { status: 200, headers: response.headers })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown network error'
    const payload = buildResponse(false, message)
    response.headers.set('Cache-Control', 'no-store')
    return NextResponse.json(payload, { status: 200, headers: response.headers })
  }
}
