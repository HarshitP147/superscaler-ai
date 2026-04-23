'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold">Theme Switcher</h1>
      
      <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-800">
        <span className="text-2xl">{isDark ? '🌙' : '☀️'}</span>
        
        <button
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          className="relative inline-flex h-8 w-16 items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          <span
            className="inline-block h-6 w-6 transform rounded-full bg-white dark:bg-gray-300 transition-transform"
            style={{
              transform: isDark ? 'translateX(1.75rem)' : 'translateX(0.25rem)',
            }}
          />
        </button>
        
        <span className="font-medium min-w-20">{isDark ? 'Dark' : 'Light'}</span>
      </div>
    </div>
  );
}
