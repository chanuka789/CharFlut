import { useStore } from '@nanostores/react';
import { useEffect, useRef, useState } from 'react';
import IconR from '@/components/ui/IconR';
import { formatMoney } from '@/lib/money';
import { $wishlist, addToCart, openPanel, toast, toggleWish } from '@/lib/stores';
import type { Product, Size } from '@/lib/types';

type Props = { product: Pick<Product, 'id' | 'slug' | 'title' | 'category' | 'design' | 'colors' | 'sizes' | 'price' | 'compareAt' | 'fit'> };

/**
 * Product info and actions (plan 04, Product #2): price in visitor currency, colour swatches (3D changes live),
 * sizes, quantity, yellow Add to cart, wishlist heart, sticky add-to-cart bar on mobile.
 */
export default function BuyBox({ product: p }: Props) {
  const wish = useStore($wishlist);
  const [color, setColor] = useState(p.colors[0]);
  const [size, setSize] = useState<Size | null>(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const mainBtn = useRef<HTMLButtonElement>(null);
  const sizeGroup = useRef<HTMLDivElement>(null);

  const pickColor = (id: string) => {
    const c = p.colors.find((x) => x.id === id)!;
    setColor(c);
    document.dispatchEvent(new CustomEvent('cf:color', { detail: id }));
  };

  // Sticky bar on phones once the main button scrolls out of view
  useEffect(() => {
    if (!mainBtn.current) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(mainBtn.current);
    return () => io.disconnect();
  }, []);

  const add = () => {
    if (!size) {
      setError('Choose a size first.');
      sizeGroup.current?.querySelector<HTMLButtonElement>('button')?.focus();
      sizeGroup.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setError('');
    addToCart(
      {
        productId: p.id,
        slug: p.slug,
        variantKey: `${color.id}:${size}`,
        title: p.title,
        colorId: color.id,
        colorName: color.name,
        colorHex: color.hex,
        inkHex: color.ink,
        design: p.design,
        category: p.category,
        size,
        unitPrice: p.price,
      },
      qty,
    );
    flyToCart();
    setAdded(true);
    toast(`${p.title} added to cart`);
    setTimeout(() => setAdded(false), 1800);
    setTimeout(() => openPanel('cart'), 650);
  };

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Wishlist lives in localStorage, so only reflect it after hydration.
  const wished = mounted && wish.includes(p.slug);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="t-label mb-3 text-muted">
            {p.category === 'tees' ? 'Tee' : 'Hoodie'} · {p.fit === 'oversized' ? 'Oversized fit' : 'Regular fit'}
          </p>
          <h1 className="t-h1 !text-[clamp(2rem,1.4rem+2.4vw,3.5rem)]">{p.title}</h1>
        </div>
        <button
          type="button"
          className="icon-btn mt-1 shrink-0 border border-line"
          aria-pressed={wished}
          aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
          onClick={() => {
            toggleWish(p.slug);
            toast(wished ? 'Removed from wishlist' : 'Saved to wishlist');
          }}
        >
          <IconR name={wished ? 'heart-fill' : 'heart'} />
        </button>
      </div>
      <p className="t-price mt-4 text-2xl" aria-live="polite">
        {(['USD', 'GBP'] as const).map((c) => (
          <span key={c} data-cur={c}>
            {formatMoney(p.price[c], c)}
            {p.compareAt && <s className="ml-3 text-lg font-normal text-muted">{formatMoney(p.compareAt[c], c)}</s>}
          </span>
        ))}
      </p>
      <p className="mt-1 text-sm text-muted"><span data-cur="GBP">Includes UK VAT.</span>
        <span data-cur="USD">Sales tax worked out at checkout.</span></p>

      {/* Colour */}
      <fieldset className="mt-8">
        <legend className="mb-3 text-sm font-semibold">
          Colour: <span className="font-normal text-muted">{color.name}</span>
        </legend>
        <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="Colour">
          {p.colors.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={c.id === color.id}
              aria-label={c.name}
              title={c.name}
              className="swatch"
              style={{ ['--swatch' as string]: c.hex }}
              onClick={() => pickColor(c.id)}
            />
          ))}
        </div>
      </fieldset>

      {/* Size */}
      <fieldset className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <legend className="text-sm font-semibold">
            Size{size && <span className="font-normal text-muted">: {size}</span>}
          </legend>
          <a href="/help/size-guide" className="flex items-center gap-1.5 text-sm font-semibold underline underline-offset-4" target="_blank">
            <IconR name="ruler" size={16} /> Size guide
          </a>
        </div>
        <div ref={sizeGroup} className="grid grid-cols-3 gap-2 xs:grid-cols-6" role="radiogroup" aria-label="Size" aria-describedby={error ? 'size-err' : undefined}>
          {p.sizes.map((s) => (
            <button key={s} type="button" role="radio" aria-checked={size === s} className="chip" onClick={() => (setSize(s), setError(''))}>
              {s}
            </button>
          ))}
        </div>
        {error && (
          <p id="size-err" className="field-error mt-2" role="alert">
            {error}
          </p>
        )}
        {p.fit === 'oversized' && <p className="mt-3 text-sm text-muted">Oversized fit: take your usual size for a relaxed look, or size down for a closer fit.</p>}
      </fieldset>

      {/* Quantity + add */}
      <div className="mt-8 flex gap-3">
        <div className="flex items-center rounded-[var(--radius-md)] border-[1.5px] border-line" aria-label="Quantity">
          <button type="button" className="grid size-[52px] place-items-center" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Decrease quantity">
            <IconR name="minus" size={18} />
          </button>
          <span className="w-8 text-center font-semibold" aria-live="polite">
            {qty}
          </span>
          <button type="button" className="grid size-[52px] place-items-center" onClick={() => setQty(Math.min(10, qty + 1))} aria-label="Increase quantity">
            <IconR name="plus" size={18} />
          </button>
        </div>
        <button ref={mainBtn} type="button" className="btn btn-primary btn-lg flex-1" onClick={add} data-magnetic>
          <IconR name={added ? 'check' : 'bag'} size={20} />
          <span>{added ? 'Added' : 'Add to cart'}</span>
        </button>
      </div>

      {/* Sticky mobile bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/95 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur transition-transform duration-500 lg:hidden"
        style={{ transform: showSticky ? 'none' : 'translateY(110%)', transitionTimingFunction: 'var(--ease-out)' }}
        aria-hidden={!showSticky}
        inert={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{p.title}</p>
            <p className="text-sm text-muted">
              {(['USD', 'GBP'] as const).map((c) => (
                <span key={c} data-cur={c}>
                  {formatMoney(p.price[c], c)}
                </span>
              ))}{' '}
              · {color.name}
              {size ? ` · ${size}` : ''}
            </p>
          </div>
          <button type="button" className="btn btn-primary" onClick={add}>
            <span>{size ? 'Add to cart' : 'Choose size'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/** Product image flies into the cart icon (plan 02, "Add-to-cart fly"). */
function flyToCart() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const from = document.querySelector<HTMLElement>('[data-fly-source]');
  const to = document.querySelector<HTMLElement>('[data-cart-icon]');
  if (!from || !to) return;
  const a = from.getBoundingClientRect();
  const b = to.getBoundingClientRect();
  const ghost = from.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, {
    position: 'fixed',
    left: `${a.left}px`,
    top: `${a.top}px`,
    width: `${a.width}px`,
    height: `${a.height}px`,
    zIndex: '150',
    pointerEvents: 'none',
    borderRadius: '12px',
    transition: 'transform 750ms cubic-bezier(.6,-0.2,.4,1), opacity 750ms',
  });
  document.body.appendChild(ghost);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  requestAnimationFrame(() => {
    ghost.style.transform = `translate(${dx}px, ${dy}px) scale(0.06)`;
    ghost.style.opacity = '0.3';
  });
  setTimeout(() => ghost.remove(), 800);
}
