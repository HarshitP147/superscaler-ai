<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

Notable Next.js 16 deltas:
- **`middleware.ts` → `proxy.ts`** (function exported is `proxy`, file at project root). Lives at root.
- `cookies()`, `headers()`, `params`, `searchParams` are async — `await` before use.
<!-- END:nextjs-agent-rules -->

# Agent Knowledge Index

**Stack**: Next.js 16 App Router · DaisyUI v5 + Tailwind CSS v4 · Supabase (Auth, Postgres, Blob) · Google OAuth 2.0 (PKCE) · Stripe Embedded Checkout (`stripe@22`, `@stripe/react-stripe-js@6`)

For DaisyUI docs use Context7 MCP: `/websites/daisyui`. For Stripe / Supabase / Next.js docs, also prefer Context7 — Stripe Node v21+ renamed `ui_mode` enum values, training data is wrong.

---

## Lookup Table

| When working on… | Read |
|---|---|
| System architecture, data flow, infra | `docs/architecture/ARCH.md` |
| Project structure, where new files go, server-vs-client | `docs/architecture/STRUCTURE.md` |
| Supabase clients, env vars (incl. `supabase/.env` gotcha), proxy, auth flow, Google OAuth, signout, status API | `docs/integrations/SUPABASE.md` |
| Stripe Embedded Checkout, webhook, idempotency, RPC, `stripe listen` flag, `ui_mode: 'embedded_page'` rename | `docs/integrations/STRIPE.md` |
| Design system, colors, theme tokens, theme switching, ThemeContext | `docs/DESIGN.md` |

---

## Quick facts

- Auth: Google OAuth via Supabase, PKCE flow. Routes: `/auth/callback` (GET), `/auth/signout` (POST).
- Settings area: `/settings` is authenticated settings shell with left-rail navigation. App pane includes theme switcher dropdown. Use `useTheme()` hook to access theme state in components.
- Credits: persisted in Supabase Postgres via `user_credit_balances`, `credit_activity`, plus two RPCs — `apply_manual_credit_topup` (security invoker, dev backdoor) and `apply_stripe_credit_topup` (security definer, called by webhook with service role). Header balance and credits settings screen read the same row.
- Payments: Stripe **Embedded Checkout** on `/settings/credits`. Server action creates a Checkout Session with `ui_mode: 'embedded_page'` (renamed from `'embedded'` in stripe-node v21+). Webhook at `POST /api/stripe/webhook` listens for `checkout.session.completed`, idempotent on `stripe_session_id`. See `docs/integrations/STRIPE.md`.
- Local Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook` — without `--forward-to`, events are observed but not delivered (most common cause of "Stripe says success, DB has nothing").
- **Local-only Supabase**: never `supabase db push`. Apply migrations with `supabase migration up`. Remote DB stays untouched until the user explicitly approves a push.
- Service-role env var: `SUPABASE_SECRET_KEY` (matches the `sb_secret_*` / `sb_publishable_*` naming the codebase already uses for `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`). Local value is the `Secret` line in `supabase status`. Do not reintroduce the legacy `SUPABASE_SERVICE_ROLE_KEY` name.
- Session refresh: `proxy.ts` (root) → `src/util/supabase/proxy.ts::updateSession` → `getClaims()`.
- User profile (avatar, name): `getUser()` in Server Components. `getClaims()` does **not** include `user_metadata`.
- Env-var gotcha: OAuth secrets go in `supabase/.env` (read by Supabase CLI), **not** project-root `.env.local` (read by Next.js). Stripe + Supabase keys go in `.env.local`.
- Theme: three DaisyUI themes (nightgrass, forest, dark). Dynamic switching via `ThemeContext` → useTheme hook. Persists to `localStorage` and updates `data-theme` on `<html>`. Settings > App tab has theme dropdown. Server-side default `data-theme="nightgrass"` prevents SSR flash.
- Folder layout: `src/{app,components,sections,layout,ui,util,lib}/` as siblings. `src/lib/` holds server/client adapters for third-party SDKs (e.g. `stripe-server.ts`, `stripe-client.ts`). See `docs/architecture/STRUCTURE.md`.
- Lint rule `react-hooks/set-state-in-effect` is enforced — derive state during render where possible. URL-driven banners read `searchParams` during render, not via `setState` inside `useEffect`.
- Client components that read `useSearchParams()` must be wrapped in `<Suspense>` by their server-component parent (Next.js 16 build check).
