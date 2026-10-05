import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import IconR from '@/components/ui/IconR';
import { $cartCount, $wishlist, openPanel } from '@/lib/stores';

/** Search, account, wishlist, cart and (mobile) menu buttons. */
export default function HeaderActions() {
  const count = useStore($cartCount);
  const wish = useStore($wishlist);
  // Counts come from localStorage, so render them only after hydration to avoid a mismatch.
  const [ready, setReady] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => setReady(true), []);
  useEffect(() => {
    if (!ready) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 450);
    return () => clearTimeout(t);
  }, [count]);

  return (
    <div className="flex items-center gap-0.5 sm:gap-1">
      <button type="button" className="icon-btn" onClick={() => openPanel('search')} aria-label="Search">
        <IconR name="search" />
      </button>
      <a href="/account" className="icon-btn hidden sm:inline-grid" aria-label="Account">
        <IconR name="user" />
      </a>
      <a href="/account/wishlist" className="icon-btn hidden sm:inline-grid" aria-label={`Wishlist, ${ready ? wish.length : 0} items`}>
        <IconR name="heart" />
        {ready && wish.length > 0 && <span className="count">{wish.length}</span>}
      </a>
      <button
        type="button"
        className="icon-btn"
        onClick={() => openPanel('cart')}
        aria-label={`Cart, ${ready ? count : 0} items`}
        data-cart-icon
        style={{ transform: bump ? 'scale(1.18)' : undefined, transition: 'transform 300ms var(--ease-out)' }}
      >
        <IconR name="bag" />
        {ready && count > 0 && <span className="count">{count}</span>}
      </button>
      <button type="button" className="icon-btn lg:hidden" onClick={() => openPanel('menu')} aria-label="Open menu">
        <IconR name="menu" />
      </button>
    </div>
  );
}
