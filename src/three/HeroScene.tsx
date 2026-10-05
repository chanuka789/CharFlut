/**
 * Home hero 3D stage: a blank tee floats in space; scrolling sweeps a yellow light line across it and
 * "prints" the artwork (plan 01). This island is tiny: it shows the still poster first, waits for idle,
 * and only then downloads Three.js (HeroCanvas). Pauses when off screen; weak devices and reduced motion
 * keep the still image (plan 02 budgets).
 */
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { canRun3D } from './capability';
import type { PrintPassState } from './types';
import type { CategorySlug, PrintDesign } from '@/lib/types';

const HeroCanvas = lazy(() => import('./HeroCanvas'));

type Props = {
  /** CSS selector of the section whose scroll progress drives the print pass */
  trackSelector: string;
  category?: CategorySlug;
  color?: string;
  ink?: string;
  design?: PrintDesign;
  lightColor?: string;
};

export default function HeroScene({ trackSelector, category = 'tees', color = '#F4F4F1', ink = '#111111', design = 'monogram', lightColor = '#FFC800' }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const state = useRef<PrintPassState>({ progress: 0, velocity: 0 });
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!canRun3D()) return;
    // Wait for idle so LCP (the poster) is never blocked by downloading or starting WebGL.
    const start = () => setEnabled(true);
    const id = 'requestIdleCallback' in window ? window.requestIdleCallback(start, { timeout: 1500 }) : globalThis.setTimeout(start, 600);
    return () => ('cancelIdleCallback' in window ? window.cancelIdleCallback(id as number) : clearTimeout(id as number));
  }, []);

  // Scroll progress + velocity
  useEffect(() => {
    if (!enabled) return;
    const track = document.querySelector<HTMLElement>(trackSelector);
    let lastY = window.scrollY;
    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      const y = window.scrollY;
      state.current.velocity = (y - lastY) / 18;
      lastY = y;
      let p = 0;
      if (track) {
        const r = track.getBoundingClientRect();
        const total = Math.max(1, r.height - window.innerHeight * 0.4);
        p = Math.min(1, Math.max(0, -r.top / total));
      }
      // A short intro sweep hints at the effect before the visitor scrolls.
      const intro = Math.min(0.32, ((performance.now() - t0) / 2600) * 0.32);
      state.current.progress = Math.max(intro, p * 1.15);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [enabled, trackSelector]);

  // Hide the still poster once the live scene has drawn
  useEffect(() => {
    if (!ready) return;
    const poster = wrap.current?.closest('[data-stage]')?.querySelector<HTMLElement>('[data-poster]');
    if (poster) poster.style.opacity = '0';
  }, [ready]);

  // Pause when off screen
  useEffect(() => {
    if (!enabled || !wrap.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '100px' });
    io.observe(wrap.current);
    return () => io.disconnect();
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div ref={wrap} className="absolute inset-0 transition-opacity duration-1000" style={{ opacity: ready ? 1 : 0 }} data-cursor="drag" aria-hidden="true">
      <Suspense fallback={null}>
        <HeroCanvas state={state} visible={visible} onReady={() => setReady(true)} category={category} color={color} ink={ink} design={design} lightColor={lightColor} />
      </Suspense>
    </div>
  );
}
