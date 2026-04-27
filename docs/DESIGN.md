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

Configured in `src/app/globals.css` using DaisyUI v5 plugin syntax.  
Theme applied via `data-theme` attribute on `<html>`. Persisted in `localStorage` key `"theme"`.

### Available Themes

| Name | Scheme | Default | Notes |
|---|---|---|---|
| `nightgrass` | dark | ✅ | Deep dark + green primary |
| `pastelfish` | light | — | Near-white base + blue-toned neutrals |

### Theme Implementation Files

| File | Role |
|---|---|
| `src/app/globals.css` | Theme definitions (OKLCH tokens, radius, border, depth, noise) |
| `src/components/ThemeProvider.tsx` | Reads `localStorage` on mount, sets `data-theme` on `<html>` |
| `src/components/ThemeSwitcher.tsx` | Dropdown UI — lists all themes, applies on select |

---

## Color Tokens (OKLCH)

All colors use OKLCH color space. Semantic tokens follow DaisyUI conventions.

### nightgrass

| Token | Value | Role |
|---|---|---|
| `--color-base-100` | `oklch(14% 0.004 49.25)` | Page background |
| `--color-base-200` | `oklch(21% 0.006 56.043)` | Card / elevated surfaces |
| `--color-base-300` | `oklch(26% 0.007 34.298)` | Borders / dividers |
| `--color-base-content` | `oklch(97% 0.001 106.424)` | Body text |
| `--color-primary` | `oklch(62% 0.194 149.214)` | Green — CTA, highlights |
| `--color-accent` | `oklch(44% 0.043 257.281)` | Muted blue |
| `--color-neutral` | `oklch(44% 0.011 73.639)` | Neutral surfaces |

### pastelfish

| Token | Value | Role |
|---|---|---|
| `--color-base-100` | `oklch(98% 0.002 247.839)` | Page background (near white) |
| `--color-base-200` | `oklch(96% 0.003 264.542)` | Card / elevated surfaces |
| `--color-base-content` | `oklch(21% 0.034 264.665)` | Body text (dark) |
| `--color-primary` | `oklch(64% 0.2 131.684)` | Green — matches nightgrass primary |
| `--color-accent` | `oklch(68% 0.162 75.834)` | Warm amber |

---

## Shape & Spacing Tokens

| Token | nightgrass | pastelfish | Role |
|---|---|---|---|
| `--radius-selector` | `0.5rem` | `0.25rem` | Buttons, badges |
| `--radius-field` | `1rem` | `1rem` | Inputs, fields |
| `--radius-box` | `2rem` | `0.5rem` | Cards, containers |
| `--border` | `1px` | `1px` | Border width |
| `--depth` | `0` | `1` | Shadow depth layer |
| `--noise` | `0` | `0` | Texture noise |

nightgrass uses larger radius (rounder). pastelfish is more angular.

---

## Adding a New Theme

1. Add to DaisyUI plugin list in `globals.css`:
   ```css
   @plugin "daisyui" {
     themes: nightgrass --default, pastelfish, <newtheme>;
   }
   ```
2. Define token block in `globals.css`:
   ```css
   @plugin "daisyui/theme" {
     name: "<newtheme>";
     ...
   }
   ```
3. Add to `THEMES` const and `ICONS` map in `src/components/ThemeSwitcher.tsx`
