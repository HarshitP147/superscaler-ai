<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Setup & Architecture

## UI Framework
- **Framework**: Daisy UI (not ShadCN)
- **CSS**: Tailwind CSS
- For Daisy UI documentation, use Context7 MCP: `/websites/daisyui`

## Theme System
- **Themes**: Forest (default) and Luxury
- **Configuration**: `src/app/globals.css` - Daisy UI plugin config
- **Persistence**: localStorage stores user's theme choice
- **Default Theme**: Forest

## Components

### ThemeProvider (`src/components/ThemeProvider.tsx`)
- Client component that initializes theme on mount
- Reads saved theme from localStorage or defaults to 'forest'
- Sets `data-theme` attribute on `<html>` element
- Wraps entire app in `layout.tsx`

### ThemeSwitcher (`src/components/ThemeSwitcher.tsx`)
- Client component for toggling between themes
- Displays current theme with emoji (🌲 forest, ✨ luxury)
- Updates localStorage and DOM on theme change
- Used on home page at center of viewport

## Supabase Integration

### Client Setup (`src/lib/supabase/client.ts`)
- Browser client singleton using `createBrowserClient` from `@supabase/ssr`
- Module-level memoization without manual `useMemo`
- Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars
- Throws at call time if env vars missing (not at build time)

### Server Setup (`src/lib/supabase/server.ts`)
- Server client factory using `createServerClient` from `@supabase/ssr`
- Handles request/response cookie sync (proxy pattern)
- Used in Route Handlers and Server Components
- Takes `NextRequest` and `NextResponse` parameters
- Automatically manages session refresh via `auth.getUser()`

### API Routes

#### Supabase Status Endpoint (`src/app/api/supabase-status/route.ts`)
- `GET /api/supabase-status` — health check endpoint
- Uses server client for session management + cookie sync
- Detects environment: 'local' (localhost/127.0.0.1) vs 'remote' (.supabase.co)
- Fetches `{SUPABASE_URL}/rest/v1/` to verify connectivity
- Returns JSON with connection status, environment, display URL, project ref, region, errors
- No cache: `Cache-Control: no-store`
- Response type:
  ```ts
  {
    connected: boolean
    environment: 'local' | 'remote' | 'unknown'
    url: string          // truncated display URL
    projectRef?: string  // remote only
    region?: string      // from NEXT_PUBLIC_SUPABASE_REGION
    error?: string
  }
  ```

### Status Indicator Component (`src/components/SupabaseStatus.tsx`)
- Client component showing Supabase connection status
- Renders DaisyUI card with status bulb dot
- Fetches `/api/supabase-status` on mount
- States:
  - Yellow pulsing dot + "Checking..." → loading
  - Green pulsing dot + "Connected" → connected to Supabase
  - Red dot + "Disconnected" + error message → connection failed
- Displays environment label (Local/Remote), truncated URL, project ref, region
- Adapts to both forest and luxury themes via DaisyUI semantic colors
- Cancellation flag prevents stale state updates on unmount

### Environment Variables

Required in `.env.local`:
```
# Server-side only (not bundled to browser)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Browser client
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key-from-supabase-status>

# Optional region label
# NEXT_PUBLIC_SUPABASE_REGION=us-east-1
```

Local Supabase: `supabase start` runs on localhost:54321 (Project URL in `supabase status` output)
Remote Supabase: Use `https://{ref}.supabase.co` from dashboard

## Features Implemented
1. ✅ Daisy UI theme system (forest + luxury)
2. ✅ Theme persistence (localStorage)
3. ✅ Theme switcher UI component
4. ✅ Responsive theme provider
5. ✅ Hydration-safe component mounting
6. ✅ Supabase browser client factory (SSR-safe)
7. ✅ Supabase server client factory (proxy pattern)
8. ✅ Supabase connection status monitoring
9. ✅ Local vs remote environment detection
10. ✅ Session refresh via server client + cookie sync
