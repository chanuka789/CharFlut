import { useStore } from '@nanostores/react';
import { useEffect, useState } from 'react';
import Garment from './Garment';
import { formatMoney } from '@/lib/money';
import { $currency } from '@/lib/stores';
import { products } from '@/data/catalog';

const KEY = 'cf.recent.v1';

/** "Recently viewed" rail (plan 04, Product #5). Stored in this browser only. */
export default function RecentlyViewed({ current }: { current: string }) {
  const cur = useStore($currency);
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    let list: string[] = [];
    try {
      list = JSON.parse(localStorage.getItem(KEY) || '[]');
    } catch {
      /* ignore */
    }
    setSlugs(list.filter((s) => s !== current).slice(0, 6));
    try {
      localStorage.setItem(KEY, JSON.stringify([current, ...list.filter((s) => s !== current)].slice(0, 12)));
    } catch {
      /* ignore */
    }
  }, [current]);

  const items = slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as typeof products;
  if (!items.length) return null;

  return (
    <section className="bg-surface py-[calc(var(--section-y)/2)]" aria-labelledby="recent-title">
      <div className="cf-container">
        <h2 id="recent-title" className="t-h3 mb-6 uppercase">
          Recently viewed
        </h2>
        <ul className="no-scrollbar -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)]" data-lenis-prevent-touch>
          {items.map((p) => (
            <li key={p.slug} className="w-40 shrink-0 sm:w-52">
              <a href={`/shop/${p.category}/${p.slug}`} className="group block">
                <div className="aspect-[4/5] rounded-[var(--radius-md)] bg-bg p-[9%] transition-transform duration-500 group-hover:-translate-y-1">
                  <Garment category={p.category} color={p.colors[0].hex} ink={p.colors[0].ink} design={p.design} className="h-full w-full" />
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{p.title}</p>
                <p className="text-sm text-muted">{formatMoney(p.price[cur], cur)}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
