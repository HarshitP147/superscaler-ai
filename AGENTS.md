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

## Features Implemented
1. ✅ Daisy UI theme system (forest + luxury)
2. ✅ Theme persistence (localStorage)
3. ✅ Theme switcher UI component
4. ✅ Responsive theme provider
5. ✅ Hydration-safe component mounting
