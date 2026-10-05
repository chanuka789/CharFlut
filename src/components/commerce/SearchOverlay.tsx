import { useStore } from '@nanostores/react';
import { useMemo, useState } from 'react';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';
import { formatMoney } from '@/lib/money';
import { $currency, $panel, closePanel } from '@/lib/stores';
import type { MiniProduct } from './CartDrawer';
import { useDialog } from './useDialog';

const POPULAR = ['Oversized tee', 'Hoodie', 'Monogram', 'Sunburst', 'Black'];

/** Full-screen search (plan 04): instant results, popular searches, "no results" state with best sellers. */
export default function SearchOverlay({ index, bestSellers }: { index: (MiniProduct & { keywords: string })[]; bestSellers: string[] }) {
  const open = useStore($panel) === 'search';
  const cur = useStore($currency);
  const [q, setQ] = useState('');
  const ref = useDialog<HTMLDivElement>(open);

  const results = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return index.filter((p) => terms.every((t) => p.keywords.includes(t))).slice(0, 8);
  }, [q, index]);
  const fallback = index.filter((p) => bestSellers.includes(p.slug)).slice(0, 4);
  const list = q.trim() ? results : fallback;

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
      aria-hidden={!open}
      inert={!open}
      className="fixed inset-0 z-[95] overflow-y-auto bg-bg transition-[opacity,transform] duration-500"
      style={{
        opacity: open ? 1 : 0,
        transform: open ? 'none' : 'translateY(-16px)',
        pointerEvents: open ? 'auto' : 'none',
        transitionTimingFunction: 'var(--ease-out)',
      }}
      data-lenis-prevent
    >
      <div className="cf-container py-5 sm:py-8">
        <div className="flex items-center gap-3 border-b-2 border-ink pb-3">
          <IconR name="search" size={28} />
          <form
            className="flex-1"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              if (q.trim()) window.location.href = `/search?q=${encodeURIComponent(q.trim())}`;
            }}
          >
            <label htmlFor="cf-search" className="sr-only">
              Search products
            </label>
            <input
              id="cf-search"
              data-autofocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search tees, hoodies, prints"
              autoComplete="off"
              enterKeyHint="search"
              className="w-full bg-transparent font-display text-[clamp(1.5rem,5vw,3.5rem)] font-black uppercase tracking-tight outline-none placeholder:text-line"
            />
          </form>
          <button type="button" className="icon-btn" onClick={closePanel} aria-label="Close search">
            <IconR name="close" size={26} />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="t-label mr-2 text-muted">Popular</span>
          {POPULAR.map((p) => (
            <button key={p} type="button" className="chip" onClick={() => setQ(p)}>
              {p}
            </button>
          ))}
        </div>

        <p className="t-label mb-5 mt-10 text-muted" aria-live="polite">
          {q.trim() ? (results.length ? `${results.length} results` : `No results for “${q}”. Try these best sellers.`) : 'Best sellers'}
        </p>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
          {(q.trim() && !results.length ? fallback : list).map((p) => (
            <li key={p.slug}>
              <a href={`/shop/${p.category}/${p.slug}`} className="group block" onClick={closePanel}>
                <div className="aspect-[4/5] rounded-[var(--radius-md)] bg-surface p-[9%] transition-transform duration-500 group-hover:scale-[0.98]">
                  <Garment category={p.category} color={p.color} ink={p.ink} design={p.design} className="h-full w-full" />
                </div>
                <p className="mt-3 font-display text-[0.95rem] font-extrabold uppercase">{p.title}</p>
                <p className="text-sm text-muted">{formatMoney(p.price[cur], cur)}</p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
