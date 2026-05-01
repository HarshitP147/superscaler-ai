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

Single dark theme: **nightgrass**. No theme toggle, no `localStorage`.
`data-theme="nightgrass"` is hardcoded on `<html>` in `src/app/layout.tsx`.

Defined in `src/app/globals.css` via DaisyUI v5 plugin syntax.

### Theme Implementation Files

| File | Role |
|---|---|
| `src/app/globals.css` | Theme definition (OKLCH tokens, radius, border, depth, noise) |
| `src/app/layout.tsx` | Sets `data-theme="nightgrass"` on `<html>` |

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
