<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notable Next.js 16 deltas:
- **`middleware.ts` → `proxy.ts`** (function exported is `proxy`, file at project root). Lives at root.
- `cookies()`, `headers()`, `params`, `searchParams` are async — `await` before use.
<!-- END:nextjs-agent-rules -->

# Agent Knowledge Index

**Stack**: Next.js 16 App Router · DaisyUI v5 + Tailwind CSS v4 · Supabase (Auth, Postgres, Blob) · Google OAuth 2.0 (PKCE)

For DaisyUI docs use Context7 MCP: `/websites/daisyui`

---

## Lookup Table

| When working on… | Read |
|---|---|
| System architecture, data flow, infra | `docs/architecture/ARCH.md` |
| Project structure, where new files go, server-vs-client | `docs/architecture/STRUCTURE.md` |
| Supabase clients, env vars (incl. `supabase/.env` gotcha), proxy, auth flow, Google OAuth, signout, status API | `docs/integrations/SUPABASE.md` |
| Design system, themes, colors, theme toggle | `docs/DESIGN.md` |

---

## Quick facts

- Auth: Google OAuth via Supabase, PKCE flow. Routes: `/auth/callback` (GET), `/auth/signout` (POST).
- Session refresh: `proxy.ts` (root) → `src/util/supabase/proxy.ts::updateSession` → `getClaims()`.
- User profile (avatar, name): `getUser()` in Server Components. `getClaims()` does **not** include `user_metadata`.
- Env-var gotcha: OAuth secrets go in `supabase/.env` (read by Supabase CLI), **not** project-root `.env` (read by Next.js).
- Themes: `nightgrass` (dark, default), `pastelfish` (light). Toggle lives inside `UserMenu` dropdown.
- Folder layout: `src/{app,components,sections,layout,ui,util}/` as siblings. See `docs/architecture/STRUCTURE.md`.
