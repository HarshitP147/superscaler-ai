'use client';

import { useTheme } from '@/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-foreground/20 bg-background hover:bg-foreground/5 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <>
          <span className="text-xl">🌙</span>
          <span>Dark Mode</span>
        </>
      ) : (
        <>
          <span className="text-xl">☀️</span>
          <span>Light Mode</span>
        </>
      )}
    </button>
  );
}
