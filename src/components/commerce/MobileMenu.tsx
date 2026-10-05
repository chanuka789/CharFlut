import { useStore } from '@nanostores/react';
import IconR from '@/components/ui/IconR';
import { $panel, closePanel, setCurrency, $currency } from '@/lib/stores';
import { useDialog } from './useDialog';

/** Full-screen black menu with big Archivo links that slide in one by one (plan 04). */
export default function MobileMenu({ links, secondary }: { links: { label: string; href: string }[]; secondary: { label: string; href: string }[] }) {
  const open = useStore($panel) === 'menu';
  const cur = useStore($currency);
  const ref = useDialog<HTMLDivElement>(open);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      aria-hidden={!open}
      inert={!open}
      data-theme="dark"
      className="fixed inset-0 z-[96] flex flex-col bg-black text-white transition-[clip-path] duration-700"
      style={{
        clipPath: open ? 'circle(150% at 100% 0)' : 'circle(0% at 100% 0)',
        transitionTimingFunction: 'var(--ease-in-out)',
      }}
      data-lenis-prevent
    >
      <div className="cf-container flex h-[calc(var(--header-h)+var(--bar-h))] items-center justify-between">
        <img src="/brand/icon.svg" alt="CharFlut" width={36} height={36} />
        <button type="button" className="icon-btn" onClick={closePanel} aria-label="Close menu">
          <IconR name="close" size={28} />
        </button>
      </div>
      <nav aria-label="Mobile" className="cf-container flex-1 overflow-y-auto pb-8 pt-4">
        <ul>
          {links.map((l, i) => (
            <li key={l.href} className="overflow-hidden border-b border-white/10">
              <a
                href={l.href}
                onClick={closePanel}
                className="flex items-center justify-between py-4 font-display text-[clamp(2.25rem,11vw,4rem)] font-black uppercase leading-none tracking-tight transition-[transform,opacity] duration-700"
                style={{
                  transform: open ? 'none' : 'translateY(100%)',
                  opacity: open ? 1 : 0,
                  transitionDelay: open ? `${120 + i * 60}ms` : '0ms',
                  transitionTimingFunction: 'var(--ease-out)',
                }}
              >
                {l.label}
                <IconR name="arrow-up-right" size={28} className="text-brand" />
              </a>
            </li>
          ))}
        </ul>
        <ul className="mt-8 grid grid-cols-2 gap-3 text-[0.9375rem]">
          {secondary.map((l) => (
            <li key={l.href}>
              <a href={l.href} onClick={closePanel} className="text-white/75 hover:text-white">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="cf-container flex items-center justify-between border-t border-white/10 py-5 pb-[max(20px,env(safe-area-inset-bottom))]">
        <span className="text-sm text-white/75">Currency</span>
        <div className="flex gap-2" role="radiogroup" aria-label="Currency">
          {(['USD', 'GBP'] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={cur === c}
              onClick={() => setCurrency(c)}
              className="h-10 rounded-full border border-white/25 px-4 text-sm font-semibold aria-checked:border-brand aria-checked:bg-brand aria-checked:text-black"
            >
              {c === 'USD' ? '$ USD' : '£ GBP'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
