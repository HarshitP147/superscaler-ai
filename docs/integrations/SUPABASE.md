# Supabase Integration

This project uses Supabase for auth, database, and blob storage via the `@supabase/ssr` package.

---

## Client Setup — `src/util/supabase/client.ts`

Browser client singleton using `createBrowserClient`. Module-level memoized — no manual `useMemo` needed.

Required env vars:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321       # local
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Throws at call time (not build time) if env vars are missing.

---

## Server Setup — `src/util/supabase/server.ts`

Server client factory using `createServerClient`. Takes `cookies()` from `next/headers`. Handles cookie sync for session refresh automatically.

Use in Route Handlers and Server Components:
```ts
const cookieStore = await cookies()
const supabase = createClient(cookieStore)
```

---

## Status API — `GET /api/supabase-status`

Health check endpoint. Calls `supabase.auth.getUser()` to verify connectivity (no session required).

Response shape:
```ts
{
  connected: boolean
  environment: 'local' | 'remote' | 'unknown'
  url: string
  projectRef?: string   // remote only — extracted from *.supabase.co URL
  error?: string
}
```

Environment detection:
- `local` → URL contains `127.0.0.1` or `localhost`
- `remote` → URL contains `.supabase.co`

---

## SupabaseStatus Component — `src/components/SupabaseStatus.tsx`

Client component. Fetches `/api/supabase-status` on mount. Three visual states:
- **Yellow pulsing** → checking
- **Green pulsing** → connected
- **Red** → failed (shows error message)

---

## Running Supabase Locally

```bash
supabase start      # starts on localhost:54321
supabase status     # shows project URL + anon key
supabase stop
```

## Remote

Use `https://{ref}.supabase.co` as `NEXT_PUBLIC_SUPABASE_URL`. Get anon key from Supabase dashboard → Project Settings → API.
