import React, { useEffect, useState } from 'react';

const THEME_KEY = 'ffa_theme';

function getSavedTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (e) {
    // ignore
  }
  // default to system preference
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
}

function applyTheme(theme) {
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => getSavedTheme());

  useEffect(() => {
    applyTheme(theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  // If user toggles, flip between light/dark
  const handleToggle = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));

  return (
    <button type="button" className="btn theme-toggle" onClick={handleToggle} aria-label="Toggle theme">
      {theme === 'dark' ? (
        <><i className="fas fa-sun" aria-hidden></i><span className="ms-1">Light</span></>
      ) : (
        <><i className="fas fa-moon" aria-hidden></i><span className="ms-1">Dark</span></>
      )}
    </button>
  );
}
