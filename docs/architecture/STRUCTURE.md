# Project Structure

Sibling top-level dirs under `src/`. Each has a single role.

```
src/
  app/             Routes (Next.js App Router) — pages, layouts, route handlers
  components/      Generic atoms with no clear home (e.g. ThemeProvider, SupabaseStatus)
  sections/        Large page sections — render a chunk of a route's content
  layout/          Page chrome — header, navigation, account menu
  ui/              Small reusable widgets — toggles, badges, atoms with shared use
  util/            Non-React utilities (Supabase client factories, helpers)
```

`tsconfig.json` maps `@/*` → `./src/*`. Import like `@/sections/Hero`, `@/layout/AppHeader`, `@/ui/ThemeToggle`.

---

## Where new files go

| Building… | Put it in |
|---|---|
| A route, layout, or route handler | `src/app/<route>/...` |
| A "main content" block of a page (Hero, Upload, Pricing, Footer-as-section) | `src/sections/` |
| Header / sidebar / account menu — anything wrapping content | `src/layout/` |
| Reusable widget shared across sections (ThemeToggle, IconButton) | `src/ui/` |
| Stateful provider with no UI of its own (ThemeProvider) | `src/components/` |
| Plain TS helpers (Supabase clients, formatters) | `src/util/` |

Top-level `proxy.ts` is the only Next.js convention file outside `src/` — required by Next.js 16 to live alongside `app/` (or `pages/`).

---

## Server vs client components

- Default to **Server Components** (no `'use client'`). Cheap, fetch directly.
- Mark `'use client'` only when needed: state hooks, effects, browser APIs, event handlers.
- `layout.tsx` and `page.tsx` are server components — use `await cookies()` + `createClient()` + `supabase.auth.getUser()` to read auth.

`AppHeader` is a server component that receives `user` prop. The interactive `UserMenu` inside it is `'use client'`.

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
| `src/layout/UserMenu.tsx` | Avatar dropdown — theme + logout |
