'use client'

import { useEffect } from 'react'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const KEY = 'cf_theme'
    const html = document.documentElement

    const detect = () =>
      localStorage.getItem(KEY) ||
      (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')

    const apply = (theme: string, persist = true) => {
      html.dataset.theme = theme
      html.style.colorScheme = theme
      if (persist) localStorage.setItem(KEY, theme)
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }))
    }

    // Apply on first load
    const stored = localStorage.getItem(KEY)
    if (!stored) {
      apply(detect(), false)
    } else {
      html.dataset.theme = stored
      html.style.colorScheme = stored
    }

    // React to OS theme changes (only if no user override)
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const handleMQChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(KEY)) apply(e.matches ? 'light' : 'dark', false)
    }
    mq.addEventListener('change', handleMQChange)

    // Expose global
    ;(window as any).CharFlutTheme = {
      get: () => html.dataset.theme,
      set: apply,
      toggle: () => apply(html.dataset.theme === 'dark' ? 'light' : 'dark'),
    }

    return () => mq.removeEventListener('change', handleMQChange)
  }, [])

  return <>{children}</>
}

export function ThemeScript() {
  const script = `
    (function() {
      try {
        var KEY = 'cf_theme';
        var stored = localStorage.getItem(KEY);
        var theme = stored || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        document.documentElement.dataset.theme = theme;
        document.documentElement.style.colorScheme = theme;
      } catch(e) {}
    })();
  `
  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
