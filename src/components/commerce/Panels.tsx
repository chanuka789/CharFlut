import { useStore } from '@nanostores/react';
import { useEffect } from 'react';
import { $panel, $toasts, closePanel } from '@/lib/stores';
import CartDrawer, { type MiniProduct } from './CartDrawer';
import MobileMenu from './MobileMenu';
import SearchOverlay from './SearchOverlay';

type Props = {
  index: (MiniProduct & { keywords: string })[];
  bestSellers: string[];
  menuLinks: { label: string; href: string }[];
  menuSecondary: { label: string; href: string }[];
};

/** All global overlays in one island, persisted across page transitions. */
export default function Panels({ index, bestSellers, menuLinks, menuSecondary }: Props) {
  const toasts = useStore($toasts);
  const panel = useStore($panel);

  // Close any panel when navigating
  useEffect(() => {
    const onNav = () => closePanel();
    document.addEventListener('astro:before-preparation', onNav);
    return () => document.removeEventListener('astro:before-preparation', onNav);
  }, []);

  return (
    <>
      <CartDrawer suggestions={index.filter((p) => bestSellers.includes(p.slug))} />
      <SearchOverlay index={index} bestSellers={bestSellers} />
      <MobileMenu links={menuLinks} secondary={menuSecondary} />
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[120] flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto rounded-full bg-ink px-5 py-3 text-sm font-semibold text-bg shadow-[var(--shadow-2)] animate-[cf-toast_400ms_var(--ease-out)]">
            {t.message}
          </div>
        ))}
      </div>
      <span hidden data-panel={panel ?? ''} />
    </>
  );
}
