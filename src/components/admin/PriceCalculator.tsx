import { useState } from 'react';
import { autoPrice, marginOf } from '@/lib/pricing';
import { formatMoney } from '@/lib/money';

/** Live calculator that uses the same pricing functions as the sync job. */
export default function PriceCalculator() {
  const [cost, setCost] = useState('13.90');
  const [ship, setShip] = useState('4.50');
  const [margin, setMargin] = useState('45');
  const c = Math.round(parseFloat(cost || '0') * 100);
  const s = Math.round(parseFloat(ship || '0') * 100);
  const m = Math.min(90, Math.max(0, parseFloat(margin || '0'))) / 100;
  let price = 0;
  try {
    price = autoPrice({ cost: c, shippingShare: s, targetMargin: m });
  } catch {
    price = 0;
  }
  const real = marginOf(price, c, 0.0485, s);
  const field = (label: string, v: string, set: (v: string) => void, suffix: string) => (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="relative">
        <input className="input pr-10" inputMode="decimal" value={v} onChange={(e) => set(e.target.value.replace(/[^\d.]/g, ''))} />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted">{suffix}</span>
      </span>
    </label>
  );
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {field('Provider cost', cost, setCost, '$')}
        {field('Shipping share', ship, setShip, '$')}
        {field('Target margin', margin, setMargin, '%')}
      </div>
      <div className="flex items-end justify-between rounded-[var(--radius-md)] bg-[#141414] p-4" aria-live="polite">
        <div>
          <p className="t-label text-muted">Suggested price</p>
          <p className="font-display text-4xl font-black">{price ? formatMoney(price, 'USD') : '—'}</p>
        </div>
        <p className="text-sm text-muted">Real margin {price ? Math.round(real * 100) : 0}%</p>
      </div>
    </div>
  );
}
