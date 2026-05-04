# Design System

## UI Stack

| Layer | Library | Version |
|---|---|---|
| Component framework | DaisyUI | 5.5.19 |
| CSS engine | Tailwind CSS | v4 (no config file — configured via CSS) |
| Runtime | Next.js | 16.2.4 |

DaisyUI docs via Context7 MCP: `/websites/daisyui`

---

## Fonts

Both fonts loaded via `next/font/google` in `src/app/layout.tsx`. Available as CSS variables on `<html>`.

| Font | Variable | Use |
|---|---|---|
| Geist Sans | `--font-geist-sans` | Body / UI text |
| Geist Mono | `--font-geist-mono` | Code / monospace |

`antialiased` applied globally on `<html>`.

---

## Theming

Three DaisyUI themes available: **nightgrass** (default, dark), **forest**, **dark**.

Theme switching enabled via `ThemeContext` — persists selection to `localStorage` under key `"theme"` and updates `data-theme` attribute on `<html>` dynamically.

### How It Works

1. **ThemeContext** (`src/context/ThemeContext.tsx`): Client-side hook that manages theme state + localStorage persistence
2. **ThemeProvider** (`src/app/layout.tsx`): Wraps app, reads stored theme on mount, applies to DOM
3. **useTheme hook**: Consumed by UI components to get/set theme (e.g., AppSettingsPanel theme dropdown)
4. **Initial render**: Server-side `data-theme="nightgrass"` on `<html>` prevents flash; client-side hydration overrides with stored preference

### Theme Implementation Files

| File | Role |
|---|---|
| `src/app/globals.css` | Theme definitions: nightgrass, forest, dark (DaisyUI v5 plugin syntax, OKLCH tokens) |
| `src/context/ThemeContext.tsx` | React context + useTheme hook. Reads/writes localStorage, updates DOM data-theme |
| `src/app/layout.tsx` | ThemeProvider wraps app. Server-side default data-theme="nightgrass" for SSR |
| `src/sections/AppSettingsPanel.tsx` | Theme dropdown UI (Settings > App tab). Uses useTheme() to get/set theme |

---

## Color Tokens (OKLCH) — nightgrass

All colors use OKLCH color space. Semantic tokens follow DaisyUI conventions.

| Token | Value | Role |
|---|---|---|
| `--color-base-100` | `oklch(14% 0.004 49.25)` | Page background |
| `--color-base-200` | `oklch(21% 0.006 56.043)` | Card / elevated surfaces |
| `--color-base-300` | `oklch(26% 0.007 34.298)` | Borders / dividers |
| `--color-base-content` | `oklch(97% 0.001 106.424)` | Body text |
| `--color-primary` | `oklch(62% 0.194 149.214)` | Green — CTA, highlights |
| `--color-accent` | `oklch(44% 0.043 257.281)` | Muted blue |
| `--color-neutral` | `oklch(44% 0.011 73.639)` | Neutral surfaces |

---

## Shape & Spacing Tokens

| Token | Value | Role |
|---|---|---|
| `--radius-selector` | `0.5rem` | Buttons, badges |
| `--radius-field` | `1rem` | Inputs, fields |
| `--radius-box` | `2rem` | Cards, containers |
| `--border` | `1px` | Border width |
| `--depth` | `0` | Shadow depth layer |
| `--noise` | `0` | Texture noise |

---

## Current UI Patterns

- Settings uses a clean left-rail / right-pane layout under `/settings`.
- Keep the settings shell unboxed: preserve generous page padding, but avoid wrapping the whole settings surface in a bordered card.
- The credits view is intentionally flatter than the first dashboard iteration:
  - page-level headings and dividers
  - inline action feedback rather than URL-driven notices
  - simple divided activity rows instead of nested cards
- Credits and header balance should always reflect the same persisted server-side balance.
