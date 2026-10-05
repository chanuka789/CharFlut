import { useState } from 'react';

/** Simple fit finder (plan 04, Size guide): height + preferred fit -> suggested size. */
const TABLE: [number, string][] = [
  [165, 'S'],
  [175, 'M'],
  [183, 'L'],
  [190, 'XL'],
  [999, '2XL'],
];

export default function FitFinder() {
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [height, setHeight] = useState('');
  const [fit, setFit] = useState<'relaxed' | 'close'>('relaxed');
  const cm = unit === 'cm' ? Number(height) : Number(height) * 2.54;
  let size = cm > 100 ? TABLE.find(([max]) => cm <= max)![1] : '';
  if (size && fit === 'close') {
    const order = ['XS', 'S', 'M', 'L', 'XL', '2XL'];
    size = order[Math.max(0, order.indexOf(size) - 1)];
  }
  return (
    <div className="panel not-prose my-6 grid gap-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="field">
        <label htmlFor="ff-h" className="field-label">
          Your height
        </label>
        <div className="flex gap-2">
          <input id="ff-h" inputMode="numeric" className="input" placeholder={unit === 'cm' ? '178' : '70'} value={height} onChange={(e) => setHeight(e.target.value.replace(/[^\d.]/g, ''))} />
          <select className="input !w-24" value={unit} onChange={(e) => setUnit(e.target.value as 'cm' | 'in')} aria-label="Unit">
            <option value="cm">cm</option>
            <option value="in">in</option>
          </select>
        </div>
      </div>
      <fieldset className="field">
        <legend className="field-label mb-1.5">How do you like it?</legend>
        <div className="flex gap-2">
          {(['relaxed', 'close'] as const).map((f) => (
            <button key={f} type="button" className="chip flex-1 capitalize" aria-pressed={fit === f} onClick={() => setFit(f)}>
              {f}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="min-w-32 text-center" aria-live="polite">
        <span className="block text-sm text-muted">We suggest</span>
        <span className="font-display text-4xl font-black">{size || '—'}</span>
      </p>
    </div>
  );
}
