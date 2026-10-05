import { useStore } from '@nanostores/react';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';
import { formatMoney } from '@/lib/money';
import { $cart, $currency, $freeShippingProgress, $panel, $subtotal, closePanel, removeLine, updateQuantity } from '@/lib/stores';
import { useDialog } from './useDialog';

export type MiniProduct = {
  slug: string;
  title: string;
  category: 'tees' | 'hoodies';
  design: import('@/lib/types').PrintDesign;
  color: string;
  ink: string;
  price: Record<'USD' | 'GBP', number>;
};

/** Cart drawer (plan 04): items, size and quantity, free-shipping progress, "You may also like", yellow Checkout. */
export default function CartDrawer({ suggestions }: { suggestions: MiniProduct[] }) {
  const panel = useStore($panel);
  const open = panel === 'cart';
  const lines = useStore($cart);
  const cur = useStore($currency);
  const subtotal = useStore($subtotal);
  const progress = useStore($freeShippingProgress);
  const ref = useDialog<HTMLDivElement>(open);
  const inCart = new Set(lines.map((l) => l.slug));
  const recs = suggestions.filter((s) => !inCart.has(s.slug)).slice(0, 2);

  return (
    <>
      <div className="scrim" data-open={open} onClick={closePanel} aria-hidden="true" />
      <div
        ref={ref}
        className="drawer"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
          <h2 className="font-display text-xl font-black uppercase">
            Cart <span className="text-muted">({lines.reduce((n, l) => n + l.quantity, 0)})</span>
          </h2>
          <button type="button" className="icon-btn" onClick={closePanel} aria-label="Close cart">
            <IconR name="close" />
          </button>
        </div>

        {lines.length > 0 && (
          <div className="border-b border-line px-5 py-4 sm:px-6" aria-live="polite">
            <p className="text-sm">
              {progress.remaining > 0 ? (
                <>
                  You are <strong>{formatMoney(progress.remaining, cur)}</strong> away from free shipping.
                </>
              ) : (
                <strong>Free shipping unlocked.</strong>
              )}
            </p>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface">
              <div
                className="h-full rounded-full bg-ink transition-[width] duration-700"
                style={{ width: `${progress.ratio * 100}%`, transitionTimingFunction: 'var(--ease-out)' }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6" data-lenis-prevent>
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 py-16 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-surface">
                <IconR name="bag" size={28} />
              </span>
              <p className="font-display text-xl font-black uppercase">Your cart is empty</p>
              <p className="text-muted">Start with a tee or a hoodie.</p>
              <a href="/shop" className="btn btn-dark mt-2" onClick={closePanel}>
                <span>Shop all</span>
                <IconR name="arrow-right" size={20} className="btn-arrow" />
              </a>
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <li key={l.productId + l.variantKey} className="flex gap-4 py-5">
                  <a href={`/shop/${l.category}/${l.slug}`} className="block w-24 shrink-0 rounded-[var(--radius-md)] bg-surface p-2" onClick={closePanel}>
                    <Garment category={l.category} color={l.colorHex} ink={l.inkHex} design={l.design} />
                  </a>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex justify-between gap-3">
                      <a href={`/shop/${l.category}/${l.slug}`} className="font-display text-[0.95rem] font-extrabold uppercase leading-tight" onClick={closePanel}>
                        {l.title}
                      </a>
                      <span className="t-price shrink-0">{formatMoney(l.unitPrice[cur] * l.quantity, cur)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {l.colorName} · {l.size}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-[var(--radius-md)] border border-line">
                        <button type="button" className="grid size-10 place-items-center" onClick={() => updateQuantity(l.productId, l.variantKey, l.quantity - 1)} aria-label={`Decrease quantity of ${l.title}`}>
                          <IconR name="minus" size={16} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                          {l.quantity}
                        </span>
                        <button type="button" className="grid size-10 place-items-center" onClick={() => updateQuantity(l.productId, l.variantKey, Math.min(10, l.quantity + 1))} aria-label={`Increase quantity of ${l.title}`}>
                          <IconR name="plus" size={16} />
                        </button>
                      </div>
                      <button type="button" className="text-sm text-muted underline underline-offset-4 hover:text-ink" onClick={() => removeLine(l.productId, l.variantKey)}>
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && recs.length > 0 && (
            <div className="border-t border-line py-6">
              <p className="t-label mb-4 text-muted">You may also like</p>
              <div className="grid grid-cols-2 gap-3">
                {recs.map((r) => (
                  <a key={r.slug} href={`/shop/${r.category}/${r.slug}`} className="group" onClick={closePanel}>
                    <div className="rounded-[var(--radius-md)] bg-surface p-3 transition-transform duration-300 group-hover:-translate-y-0.5">
                      <Garment category={r.category} color={r.color} ink={r.ink} design={r.design} />
                    </div>
                    <p className="mt-2 truncate text-sm font-semibold">{r.title}</p>
                    <p className="text-sm text-muted">{formatMoney(r.price[cur], cur)}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {lines.length > 0 && (
          <div className="border-t border-line px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-5 sm:px-6">
            <div className="mb-1 flex justify-between font-semibold">
              <span>Subtotal</span>
              <span className="t-price">{formatMoney(subtotal, cur)}</span>
            </div>
            <p className="mb-4 text-sm text-muted">Shipping and tax are worked out at checkout.</p>
            <a href="/checkout" className="btn btn-primary btn-block btn-lg">
              <IconR name="lock" size={18} />
              <span>Checkout</span>
            </a>
            <a href="/cart" className="mt-3 block text-center text-sm font-semibold underline underline-offset-4" onClick={closePanel}>
              View full cart
            </a>
          </div>
        )}
      </div>
    </>
  );
}
