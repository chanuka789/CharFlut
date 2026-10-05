import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';
import { formatMoney } from '@/lib/money';
import { $currency, $wishlist, toggleWish } from '@/lib/stores';
import { products } from '@/data/catalog';

export default function Wishlist() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const slugs = useStore($wishlist);
  const cur = useStore($currency);
  if (!ready) return <div className="skeleton h-72" />;
  const items = slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as typeof products;
  if (!items.length)
    return (
      <div className="panel flex flex-col items-center gap-4 py-16 text-center">
        <IconR name="heart" size={30} />
        <h2 className="t-h3">Nothing saved yet</h2>
        <p className="text-muted">Tap the heart on any piece to save it here.</p>
        <a href="/shop" className="btn btn-dark mt-2">
          <span>Browse the shop</span>
        </a>
      </div>
    );
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4">
      {items.map((p) => (
        <li key={p.slug} className="relative">
          <a href={`/shop/${p.category}/${p.slug}`} className="group block">
            <div className="aspect-[4/5] rounded-[var(--radius-md)] bg-surface p-[9%] transition-transform duration-500 group-hover:scale-[0.98]">
              <Garment category={p.category} color={p.colors[0].hex} ink={p.colors[0].ink} design={p.design} className="h-full w-full" />
            </div>
            <p className="mt-3 font-display text-[0.95rem] font-extrabold uppercase">{p.title}</p>
            <p className="text-sm text-muted">{formatMoney(p.price[cur], cur)}</p>
          </a>
          <button type="button" className="icon-btn absolute right-2 top-2 bg-bg/80" onClick={() => toggleWish(p.slug)} aria-label={`Remove ${p.title} from wishlist`}>
            <IconR name="close" size={18} />
          </button>
        </li>
      ))}
    </ul>
  );
}
