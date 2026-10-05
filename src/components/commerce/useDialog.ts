import { useEffect, useRef } from 'react';
import { closePanel } from '@/lib/stores';

/** Focus trap, Escape to close and focus return for drawers and overlays (WCAG 2.2). */
export function useDialog<T extends HTMLElement>(open: boolean) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((n) => n.offsetParent !== null);
    const t = setTimeout(() => (el?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0])?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) {
        e.preventDefault();
        f[f.length - 1].focus();
      } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
        e.preventDefault();
        f[0].focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
      prev?.focus?.();
    };
  }, [open]);
  return ref;
}
