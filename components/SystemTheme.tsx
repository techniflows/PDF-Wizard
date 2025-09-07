'use client';

import { useEffect } from 'react';

export default function SystemTheme() {
  useEffect(() => {
    // Remove any manually saved theme preference - use system only
    localStorage.removeItem('theme');
    
    const applySystemTheme = (e?: MediaQueryListEvent) => {
      const prefersDark = e ? e.matches : window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(prefersDark ? 'dark' : 'light');
    };

    // Apply initial theme based on system preference
    applySystemTheme();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => applySystemTheme(e);
    
    // Use the newer addEventListener if available, fallback to addListener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  // No visible component - this is just for system theme detection
  return null;
}