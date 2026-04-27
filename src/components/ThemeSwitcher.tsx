'use client';
import { useState, useEffect } from 'react';

const THEMES = ['nightgrass', 'pastelfish'] as const;
type Theme = typeof THEMES[number];

const ICONS: Record<Theme, string> = {
  nightgrass: '🌾',
  pastelfish: '🐟',
};

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>('nightgrass');

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('theme') ?? 'nightgrass') as Theme;
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const applyTheme = (next: Theme) => {
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  if (!mounted) return null;

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-lg btn-primary gap-2">
        {ICONS[theme]} {theme.charAt(0).toUpperCase() + theme.slice(1)}
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content menu bg-base-200 rounded-box z-10 w-40 p-2 shadow-lg mt-1"
      >
        {THEMES.map((t) => (
          <li key={t}>
            <button
              onClick={() => applyTheme(t)}
              className={t === theme ? 'active' : ''}
            >
              {ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
