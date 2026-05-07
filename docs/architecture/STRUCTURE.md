# Project Structure

Sibling top-level dirs under `src/`. Each has a single role.

```
src/
  app/             Routes (Next.js App Router) — pages, layouts, route handlers
  components/      Generic atoms with no clear home (e.g. SupabaseStatus)
  sections/        Large page sections — render a chunk of a route's content
  layout/          Page chrome — header, navigation, account menu
  ui/              Small reusable widgets — badges, atoms with shared use (currently empty)
  util/            Non-React utilities (Supabase client factories, helpers)
  lib/             Server / client adapters for third-party SDKs (e.g. Stripe)
```

`tsconfig.json` maps `@/*` → `./src/*`. Import like `@/sections/Hero`, `@/layout/AppHeader`.

---

## Where new files go

| Building… | Put it in |
|---|---|
| A route, layout, or route handler | `src/app/<route>/...` |
| A "main content" block of a page (Hero, Upload, Pricing, Footer-as-section) | `src/sections/` |
| Header / sidebar / account menu — anything wrapping content | `src/layout/` |
| Reusable widget shared across sections (IconButton, Badge) | `src/ui/` |
| Stateful provider with no UI of its own | `src/components/` |
| Plain TS helpers (Supabase clients, formatters) | `src/util/` |
| Server / client SDK adapters (e.g. Stripe) | `src/lib/` |

Top-level `proxy.ts` is the only Next.js convention file outside `src/` — required by Next.js 16 to live alongside `app/` (or `pages/`).

---

## Server vs client components

- Default to **Server Components** (no `'use client'`). Cheap, fetch directly.
- Mark `'use client'` only when needed: state hooks, effects, browser APIs, event handlers.
- `layout.tsx` and `page.tsx` are server components — use `await cookies()` + `createClient()` + `supabase.auth.getUser()` to read auth.

`AppHeader` is a server component that receives `user` prop. The interactive `UserMenu` inside it is `'use client'`.
`SettingsShell` is a client component because the active settings item is derived from `usePathname()`. `CreditsDashboard` is also client-side because it drives the Stripe Embedded Checkout flow (`createCheckoutSessionAction`, `useTransition`, `useSearchParams`) and renders `<StripeCheckout>` inline. Its parent `src/app/settings/credits/page.tsx` wraps it in `<Suspense>` because Next.js 16 requires a Suspense boundary around any client component reading `useSearchParams()`.

---

## Auth-related files

| File | Role |
|---|---|
| `proxy.ts` (root) | Next.js Proxy — refreshes Supabase session per request |
| `src/util/supabase/proxy.ts` | `updateSession()` helper |
| `src/app/auth/callback/route.ts` | OAuth code → session exchange |
| `src/app/auth/signout/route.ts` | Sign-out POST handler |
| `src/sections/Hero.tsx` | Unauthed `/` — `signInWithOAuth` button |
| `src/sections/UploadPlaceholder.tsx` | Authed `/` — upload UI placeholder |
| `src/layout/AppHeader.tsx` | Top-right header, renders only when user truthy |
| `src/layout/UserMenu.tsx` | Avatar dropdown — settings entry + logout |

---

## Settings-related files

| File | Role |
|---|---|
| `src/layout/SettingsShell.tsx` | Shared left-rail / right-pane settings shell |
| `src/app/settings/layout.tsx` | Auth-gated wrapper for `/settings/*` |
| `src/app/settings/page.tsx` | Default App settings route |
| `src/app/settings/credits/page.tsx` | Credits settings route. Wraps `CreditsDashboard` in `<Suspense>` for `useSearchParams()`. |
| `src/app/settings/credits/actions.ts` | Server actions: `addCreditsAction` (manual dev backdoor) and `createCheckoutSessionAction` (Stripe). |
| `src/sections/AppSettingsPanel.tsx` | Right-pane App settings content |
| `src/sections/CreditsDashboard.tsx` | Right-pane credits UI; orchestrates Stripe Embedded Checkout |
| `src/sections/StripeCheckout.tsx` | Thin client wrapper for `<EmbeddedCheckoutProvider>` + `<EmbeddedCheckout>` |
| `src/app/api/stripe/webhook/route.ts` | Stripe webhook — verifies signature, calls service-role RPC |
| `src/lib/stripe-server.ts` | `import 'server-only'` Stripe Node singleton |
| `src/lib/stripe-client.ts` | Cached `loadStripe()` for browser use |
| `src/util/supabase/service.ts` | Service-role Supabase client (`SUPABASE_SECRET_KEY`) — webhook only |

---

## Credits-related helpers

| File | Role |
|---|---|
| `src/util/credits.ts` | Shared credit validation, formatting, balance fetch, activity fetch. `CreditActivityKind = 'manual_top_up' \| 'stripe_payment'`. |

Credits form feedback is kept in-page via `useTransition()` plus a derived banner. The banner consumes the URL (`?stripe_session_id=...`) when Stripe redirects back, but the value is **derived during render** — never `setState`-ed inside `useEffect` (the `react-hooks/set-state-in-effect` lint rule blocks that pattern). The cleanup effect only calls `router.replace` + `router.refresh`.
