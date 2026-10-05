/**
 * CharFlut motion system (plan 02). One script, driven by data attributes so pages stay plain HTML:
 *
 *   data-split            headline lines slide up (SplitText)
 *   data-reveal           fade up when scrolled into view ("fade" = opacity only)
 *   data-stagger          children with data-reveal animate in sequence
 *   data-parallax="0.2"   moves slower/faster than scroll (2–3 layers max per section)
 *   data-hscroll          pinned horizontal rail on desktop, native swipe on touch
 *   data-tilt             light 3D tilt on hover (fine pointers only)
 *   data-magnetic         element pulls toward the cursor
 *   data-cursor="view"    custom cursor grows and shows "View"
 *   data-countdown="ISO"  live countdown
 *
 * Reduced motion: no Lenis, no parallax, no pinning; reveals become simple fades.
 * <body data-motion="calm"> (checkout): no Lenis, no parallax, no cursor effects.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText);

const reduce = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const calm = () => document.body.dataset.motion === 'calm';

let lenis: Lenis | null = null;
let ctx: gsap.Context | null = null;
const cleanups: Array<() => void> = [];

declare global {
  interface Window {
    __cfLenis?: Lenis | null;
  }
}

/* ---------------- Smooth scroll ---------------- */
function startLenis() {
  if (reduce() || calm() || lenis) return;
  lenis = new Lenis({ duration: 1.1, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
  window.__cfLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisRaf);
  gsap.ticker.lagSmoothing(0);
}
function lenisRaf(time: number) {
  lenis?.raf(time * 1000);
}
function stopLenis() {
  if (!lenis) return;
  gsap.ticker.remove(lenisRaf);
  lenis.destroy();
  lenis = null;
  window.__cfLenis = null;
}

/* ---------------- Page init ---------------- */
function init() {
  const motionOn = !reduce();
  document.documentElement.classList.toggle('js-motion', motionOn);
  document.documentElement.dataset.motionReady = '1';

  if (calm()) stopLenis();
  else startLenis();

  ctx = gsap.context(() => {
    splitHeadlines(motionOn);
    reveals(motionOn);
    if (motionOn && !calm()) {
      parallax();
      horizontalRails();
      footerWordmark();
    }
  });

  if (finePointer() && !calm() && motionOn) {
    tilt();
    magnetic();
  }
  headerAutoHide();
  wishlist();
  countdowns();
  currencySwitch();
  filtersInit();

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

function destroy() {
  ctx?.revert();
  ctx = null;
  while (cleanups.length) cleanups.pop()!();
  ScrollTrigger.getAll().forEach((t) => t.kill());
}

/* ---------------- Effects ---------------- */
function splitHeadlines(motionOn: boolean) {
  document.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
    if (!motionOn) {
      gsap.set(el, { visibility: 'visible' });
      return;
    }
    const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line' });
    gsap.set(el, { visibility: 'visible' });
    const inHero = el.closest('[data-hero]');
    gsap.from(split.lines, {
      yPercent: 105,
      duration: inHero ? 1.2 : 0.8,
      ease: 'power3.out',
      stagger: 0.08,
      delay: inHero ? 0.25 : 0,
      scrollTrigger: inHero ? undefined : { trigger: el, start: 'top 88%', once: true },
    });
  });
}

function reveals(motionOn: boolean) {
  const items = gsap.utils.toArray<HTMLElement>('[data-reveal]');
  if (!motionOn) {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }
  ScrollTrigger.batch(items, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        stagger: 0.07,
        overwrite: true,
      }),
  });
}

function parallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
    const speed = parseFloat(el.dataset.parallax || '0.2');
    const trigger = el.closest('section') ?? el;
    gsap.fromTo(
      el,
      { yPercent: -speed * 50 },
      {
        yPercent: speed * 50,
        ease: 'none',
        scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
  // Image zoom-out on scroll for full-bleed media
  document.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
    gsap.fromTo(
      el,
      { scale: 1.18 },
      { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    );
  });
}

function horizontalRails() {
  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach((section) => {
      const track = section.querySelector<HTMLElement>('[data-hscroll-track]');
      if (!track) return;
      const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
      section.classList.add('is-pinned');
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance()}`,
          scrub: 0.6,
          pin: true,
          invalidateOnRefresh: true,
          anticipatePin: 1,
        },
      });
      const bar = section.querySelector<HTMLElement>('[data-hscroll-progress]');
      if (bar)
        gsap.fromTo(
          bar,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${distance()}`, scrub: true },
          },
        );
      return () => section.classList.remove('is-pinned');
    });
  });
  cleanups.push(() => mm.revert());
}

function footerWordmark() {
  const el = document.querySelector<HTMLElement>('[data-wordmark]');
  if (!el) return;
  gsap.fromTo(
    el.querySelectorAll('span'),
    { yPercent: 100 },
    {
      yPercent: 0,
      ease: 'power3.out',
      stagger: 0.04,
      duration: 1,
      scrollTrigger: { trigger: el, start: 'top 95%', once: true },
    },
  );
}

function tilt() {
  document.querySelectorAll<HTMLElement>('[data-tilt]').forEach((el) => {
    const max = 6;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, { rotateY: x * max, rotateX: -y * max, transformPerspective: 900, duration: 0.5, ease: 'power3.out' });
    };
    const leave = () => gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.7, ease: 'power3.out' });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}

function magnetic() {
  document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
    const strength = 0.28;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      gsap.to(el, {
        x: (e.clientX - (r.left + r.width / 2)) * strength,
        y: (e.clientY - (r.top + r.height / 2)) * strength,
        duration: 0.4,
        ease: 'power3.out',
      });
    };
    const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    cleanups.push(() => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    });
  });
}

/* ---------------- Custom cursor (created once, survives page swaps) ---------------- */
function setupCursor() {
  if (!finePointer() || reduce()) return;
  const cursor = document.getElementById('cf-cursor');
  if (!cursor) return;
  document.documentElement.classList.add('has-cursor');
  const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });
  window.addEventListener('pointermove', (e) => {
    xTo(e.clientX);
    yTo(e.clientY);
    if (calm()) {
      cursor.dataset.state = 'hidden';
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button, [role="button"], input, select, textarea, label');
    const kind = target?.dataset.cursor ?? (target ? 'hover' : 'default');
    if (target && /INPUT|SELECT|TEXTAREA/.test(target.tagName)) cursor.dataset.state = 'hidden';
    else cursor.dataset.state = kind;
  });
  document.addEventListener('pointerleave', () => (cursor.dataset.state = 'hidden'));
}

/* ---------------- Header hide on scroll down, show on scroll up ---------------- */
function headerAutoHide() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.dataset.scrolled = y > 24 ? 'true' : 'false';
    if (Math.abs(y - last) < 6) return;
    header.dataset.hidden = y > last && y > 240 ? 'true' : 'false';
    last = y;
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanups.push(() => window.removeEventListener('scroll', onScroll));
}

/* ---------------- Wishlist hearts on static cards ---------------- */
async function wishlist() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-wish]');
  if (!buttons.length) return;
  const { $wishlist, toggleWish, toast } = await import('@/lib/stores');
  const paint = (list: readonly string[]) =>
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(list.includes(b.dataset.wish!))));
  paint($wishlist.get());
  const unsub = $wishlist.listen(paint);
  buttons.forEach((b) => {
    const click = () => {
      const was = $wishlist.get().includes(b.dataset.wish!);
      toggleWish(b.dataset.wish!);
      toast(was ? 'Removed from wishlist' : 'Saved to wishlist');
      gsap.fromTo(b, { scale: 0.8 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
    };
    b.addEventListener('click', click);
    cleanups.push(() => b.removeEventListener('click', click));
  });
  cleanups.push(unsub);
}

/* ---------------- Countdown ---------------- */
function countdowns() {
  document.querySelectorAll<HTMLElement>('[data-countdown]').forEach((el) => {
    const end = new Date(el.dataset.countdown!).getTime();
    const parts = {
      d: el.querySelector('[data-d]'),
      h: el.querySelector('[data-h]'),
      m: el.querySelector('[data-m]'),
      s: el.querySelector('[data-s]'),
    };
    const tick = () => {
      const left = Math.max(0, end - Date.now());
      const pad = (n: number) => String(n).padStart(2, '0');
      if (parts.d) parts.d.textContent = pad(Math.floor(left / 864e5));
      if (parts.h) parts.h.textContent = pad(Math.floor((left / 36e5) % 24));
      if (parts.m) parts.m.textContent = pad(Math.floor((left / 6e4) % 60));
      if (parts.s) parts.s.textContent = pad(Math.floor((left / 1e3) % 60));
      if (left === 0) el.dataset.live = 'true';
    };
    tick();
    const id = window.setInterval(tick, 1000);
    cleanups.push(() => clearInterval(id));
  });
}

/* ---------------- Currency switch ---------------- */
async function currencySwitch() {
  const selects = document.querySelectorAll('[data-currency-switch]') as unknown as NodeListOf<HTMLSelectElement>;
  if (!selects.length) return;
  const { setCurrency } = await import('@/lib/stores');
  const current = document.documentElement.dataset.currency || 'USD';
  selects.forEach((s) => {
    s.value = current;
    const change = () => {
      setCurrency(s.value as 'USD' | 'GBP');
      selects.forEach((o) => (o.value = s.value));
    };
    s.addEventListener('change', change);
    cleanups.push(() => s.removeEventListener('change', change));
  });
}

/* ---------------- Shop filters (client-side on the server-rendered grid) ---------------- */
function filtersInit() {
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const grid = document.querySelector<HTMLElement>('[data-filter-grid]');
  if (!form || !grid) return;
  const count = document.querySelector<HTMLElement>('[data-filter-count]');
  const empty = document.querySelector<HTMLElement>('[data-filter-empty]');
  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-product-card]'));

  const apply = () => {
    const fd = new FormData(form);
    const pick = (k: string) => fd.getAll(k).map(String);
    const cats = pick('category');
    const fits = pick('fit');
    const colors = pick('color');
    const sizes = pick('size');
    const max = Number(fd.get('max') || 0);
    const sort = String(fd.get('sort') || 'new');
    const cur = (document.documentElement.dataset.currency || 'USD').toLowerCase();

    let shown = 0;
    for (const c of cards) {
      const price = Number(c.dataset[`price${cur === 'usd' ? 'Usd' : 'Gbp'}`]);
      const ok =
        (!cats.length || cats.includes(c.dataset.filterCategory!)) &&
        (!fits.length || fits.includes(c.dataset.filterFit!)) &&
        (!colors.length || colors.some((x) => c.dataset.filterColors!.split(' ').includes(x))) &&
        (!sizes.length || sizes.some((x) => c.dataset.filterSizes!.split(' ').includes(x))) &&
        (!max || price <= max * 100);
      c.hidden = !ok;
      if (ok) shown++;
    }
    const sorted = [...cards].sort((a, b) => {
      const pa = Number(a.dataset.priceUsd),
        pb = Number(b.dataset.priceUsd);
      if (sort === 'price-asc') return pa - pb;
      if (sort === 'price-desc') return pb - pa;
      if (sort === 'popular') return Number(b.dataset.popularity) - Number(a.dataset.popularity);
      return b.dataset.created!.localeCompare(a.dataset.created!);
    });
    sorted.forEach((c) => grid.appendChild(c));
    if (count) count.textContent = `${shown} ${shown === 1 ? 'product' : 'products'}`;
    if (empty) empty.hidden = shown > 0;
    const activeCount = cats.length + fits.length + colors.length + sizes.length + (max ? 1 : 0);
    document.querySelectorAll<HTMLElement>('[data-filter-active]').forEach((b) => {
      b.textContent = activeCount ? String(activeCount) : '';
      b.hidden = !activeCount;
    });
    ScrollTrigger.refresh();
  };
  form.addEventListener('change', apply);
  form.addEventListener('reset', () => setTimeout(apply));
  document.addEventListener('cf:currency', apply);
  cleanups.push(() => document.removeEventListener('cf:currency', apply));
  apply();
}

/* ---------------- CF wipe page transition (plan 01, moment 3) ---------------- */
let wiping = false;
function setupWipe() {
  const wipe = document.getElementById('cf-wipe');
  if (!wipe) return;

  document.addEventListener('astro:before-preparation', (ev) => {
    if (reduce() || wiping) return; // skipped on repeat clicks
    const e = ev as Event & { loader: () => Promise<void> };
    const original = e.loader;
    e.loader = async () => {
      wiping = true;
      wipe.dataset.active = 'true';
      await Promise.all([
        gsap
          .timeline()
          .set(wipe, { xPercent: -100, visibility: 'visible' })
          .to(wipe, { xPercent: 0, duration: 0.42, ease: 'power2.inOut' })
          .fromTo(wipe.querySelector('.wipe-mark'), { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25 }, '-=0.15')
          .then(),
        original(),
      ]);
    };
  });

  document.addEventListener('astro:after-swap', () => {
    // Swap happens while the panel covers the screen. Reset scroll for the new page.
    lenis?.scrollTo(0, { immediate: true });
  });

  document.addEventListener('astro:page-load', () => {
    if (wipe.dataset.active !== 'true') return;
    gsap
      .timeline({
        onComplete: () => {
          wipe.dataset.active = 'false';
          wiping = false;
          gsap.set(wipe, { visibility: 'hidden' });
        },
      })
      .to(wipe, { xPercent: 100, duration: 0.42, ease: 'power2.inOut', delay: 0.05 });
  });
}

/* ---------------- Boot ---------------- */
let booted = false;
function boot() {
  if (booted) return;
  booted = true;
  setupCursor();
  setupWipe();
}

document.addEventListener('astro:page-load', () => {
  boot();
  init();
});
document.addEventListener('astro:before-swap', () => {
  destroy();
  if (document.body.dataset.motion === 'calm') stopLenis();
});

// Panels (cart, search, menu) stop the page from scrolling under them.
import('@/lib/stores').then(({ $panel }) => {
  $panel.subscribe((p) => {
    if (p) lenis?.stop();
    else lenis?.start();
    document.documentElement.style.overflow = p ? 'hidden' : '';
  });
});
