'use client';
import { useState, useEffect } from 'react';

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState('forest');

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('theme') || 'forest';
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'forest' ? 'luxury' : 'forest';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    setTheme(next);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-lg btn-primary gap-2"
    >
      {theme === 'forest' ? '🌲' : '✨'} {theme.charAt(0).toUpperCase() + theme.slice(1)}
    </button>
  );
}
