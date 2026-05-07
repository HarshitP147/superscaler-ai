# Supabase Integration

Supabase powers auth, database, and blob storage via `@supabase/ssr`.

---

## Env vars

Two separate files. **Don't confuse them.**

| File | Read by | Purpose |
|---|---|---|
| `.env.local` (project root) | Next.js (build + runtime) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, Stripe keys |
| `supabase/.env` | Supabase CLI (`env(...)` substitution in `config.toml`) | OAuth client IDs/secrets — e.g. `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` |

**Gotcha:** `env(VAR)` in `supabase/config.toml` only resolves against the Supabase CLI process env. Putting OAuth secrets in project-root `.env.local` does **not** work — they must be in `supabase/.env`. After editing `supabase/.env`, restart: `supabase stop && supabase start`.

**Naming:** the codebase uses Supabase's new key naming (`sb_publishable_*` / `sb_secret_*`). For the local stack, both keys come from `supabase status`. Do **not** reintroduce the legacy `SUPABASE_SERVICE_ROLE_KEY` name.

**Local-only by default:** never run `supabase db push`. Apply migrations with `supabase migration up`. The remote DB stays untouched until the user explicitly approves a push (this is a hard project rule, see `MEMORY.md` in the agent memory store).

Keys in container: inspect with `docker exec supabase_auth_superscaler printenv | grep GOTRUE_EXTERNAL`.

---

## Clients

| File | Use |
|---|---|
| `src/util/supabase/client.ts` | Browser client (`createBrowserClient`). Module-level singleton. Use in client components. |
| `src/util/supabase/server.ts` | Server client factory (`createServerClient`). Pass `await cookies()`. Use in Server Components, Server Actions, Route Handlers. |
| `src/util/supabase/proxy.ts` | `updateSession(request)` — request-scoped server client for Next.js Proxy. Calls `supabase.auth.getClaims()` to refresh tokens. |
| `src/util/supabase/service.ts` | Service-role client (`SUPABASE_SECRET_KEY`, no cookies). Webhook-only. Bypasses RLS. See `docs/integrations/STRIPE.md`. |

---

## Proxy (Next.js 16)

Next.js 16 renamed `middleware.ts` → **`proxy.ts`**. Lives at project root.

`proxy.ts` calls `updateSession(request)`. **Do not run code between** `createServerClient` and `getClaims()` — auth-token refresh is silent and any hiccup logs users out randomly.

Matcher excludes static assets:
```
/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)
```

---

## Auth — Google OAuth (PKCE)

`@supabase/ssr` defaults to PKCE flow.

### Flow

1. Browser calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: <origin>/auth/callback } })`.
2. Google redirects to `/auth/callback?code=...`.
3. `src/app/auth/callback/route.ts` runs `supabase.auth.exchangeCodeForSession(code)` → cookies set → redirect to `next ?? '/'`.
4. `proxy.ts` refreshes session on every request via `getClaims()`.
5. Server Components read user with `await supabase.auth.getUser()`.

### Logout

`<form action="/auth/signout" method="post">` → `src/app/auth/signout/route.ts` → `supabase.auth.signOut()` → 303 redirect to `/`.

### `getClaims()` vs `getUser()`

| Call | Validates | Returns | Use for |
|---|---|---|---|
| `getClaims()` | JWT signature locally | Claims (sub, email, exp…). **No** `user_metadata`. | Proxy token refresh, route guarding |
| `getUser()` | Round-trip to Auth server | Full `User` (incl. `user_metadata.avatar_url`, `full_name`) | Layout / page rendering needing profile data |

`getClaims()` is faster but lacks Google profile fields.

### Local Google OAuth setup

1. Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 client (Web application).
2. Authorized redirect URI: `http://localhost:54321/auth/v1/callback` (matches `GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI`).
3. Paste client ID + secret into `supabase/.env`.
4. `supabase/config.toml` has `[auth.external.google]` with `enabled = true`, `client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"`, `secret = "env(...)"`, `skip_nonce_check = true` (required for local).
5. Restart Supabase.

### Auth routes

| Route | Method | Role |
|---|---|---|
| `/auth/callback` | GET | Exchange OAuth code for session. Redirects to `next ?? '/'`. On error: `/?auth_error=...`. |
| `/auth/signout` | POST | Clear session. Redirect 303 → `/`. |

---

## Status API — `GET /api/supabase-status`

Health check. Calls `supabase.auth.getUser()` to verify connectivity (no session required).

Response:
```ts
{
  connected: boolean
  environment: 'local' | 'remote' | 'unknown'
  url: string
  projectRef?: string
  error?: string
}
```

---

## Running Supabase locally

```bash
supabase start
supabase status
supabase stop
```

Studio: `http://127.0.0.1:54323`. Mailpit: `http://127.0.0.1:54324`.

## Remote

Use `https://{ref}.supabase.co` as `NEXT_PUBLIC_SUPABASE_URL`. Anon/publishable key from Supabase dashboard → Project Settings → API.
