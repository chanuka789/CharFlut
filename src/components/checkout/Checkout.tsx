/**
 * Checkout (plan 04): 1 Contact and shipping, 2 Shipping method, 3 Review and pay -> WebXPay redirect.
 * Totals always come from the server (/api/checkout/quote). Errors show next to each field.
 */
import { useStore } from '@nanostores/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Garment from '@/components/product/Garment';
import IconR from '@/components/ui/IconR';
import { formatMoney } from '@/lib/money';
import { US_STATES } from '@/lib/regions';
import { $cart } from '@/lib/stores';
import type { Quote } from '@/lib/server/checkout';

type Step = 1 | 2 | 3;
type Form = {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  region: string;
  postcode: string;
  country: 'US' | 'GB';
  phone: string;
  marketing: boolean;
};

const DRAFT_KEY = 'cf.checkout.v1';

export default function Checkout({ initialCountry, etas }: { initialCountry: 'US' | 'GB'; etas: Record<'US' | 'GB', Record<'standard' | 'express', string>> }) {
  const cart = useStore($cart);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<Form>({
    email: '',
    firstName: '',
    lastName: '',
    address1: '',
    address2: '',
    city: '',
    region: '',
    postcode: '',
    country: initialCountry,
    phone: '',
    marketing: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<'standard' | 'express'>('standard');
  const [code, setCode] = useState('');
  const [appliedCode, setAppliedCode] = useState('');
  const [terms, setTerms] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const [summaryOpen, setSummaryOpen] = useState(false);
  const top = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReady(true);
    try {
      const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
      if (saved) setForm((f) => ({ ...f, ...saved }));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {
      /* ignore */
    }
  }, [form]);

  const lines = useMemo(() => cart.map((l) => ({ productId: l.productId, colorId: l.colorId, size: l.size, quantity: l.quantity })), [cart]);

  // Server quote whenever the cart, country, method or code changes
  useEffect(() => {
    if (!ready || !lines.length) return;
    const ctrl = new AbortController();
    fetch('/api/checkout/quote', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ lines, country: form.country, shippingMethod: method, discountCode: appliedCode || undefined }),
      signal: ctrl.signal,
    })
      .then((r) => r.json() as Promise<Quote>)
      .then(setQuote)
      .catch(() => {});
    return () => ctrl.abort();
  }, [ready, lines, form.country, method, appliedCode]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k as string]) setErrors((e) => ({ ...e, [k]: '' }));
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email)) e.email = 'Enter a valid email address.';
    if (!form.firstName.trim()) e.firstName = 'Enter your first name.';
    if (!form.lastName.trim()) e.lastName = 'Enter your last name.';
    if (!form.address1.trim()) e.address1 = 'Enter your street address.';
    if (!form.city.trim()) e.city = 'Enter your town or city.';
    if (form.country === 'US' && !form.region) e.region = 'Choose your state.';
    if (form.country === 'US' && !/^\d{5}(-\d{4})?$/.test(form.postcode.trim())) e.postcode = 'Enter a 5-digit ZIP code.';
    if (form.country === 'GB' && !/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(form.postcode.trim())) e.postcode = 'Enter a valid UK postcode.';
    if (!/^[+\d][\d\s()-]{6,}$/.test(form.phone.trim())) e.phone = 'Enter a phone number so the courier can reach you.';
    setErrors(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return false;
    }
    return true;
  };

  const go = (s: Step) => {
    setStep(s);
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const pay = async () => {
    if (!terms) {
      setErrors((e) => ({ ...e, terms: 'Please accept the terms to continue.' }));
      return;
    }
    setBusy(true);
    setBanner('');
    try {
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ lines, customer: form, shippingMethod: method, discountCode: appliedCode || undefined, acceptTerms: terms }),
      });
      const body = (await res.json()) as {
        error?: string;
        fields?: Record<string, string>;
        payment?: { kind: 'redirect-form'; action: string; fields: Record<string, string> };
      };
      if (!res.ok || !body.payment) {
        if (body.fields) {
          setErrors(body.fields);
          if (Object.keys(body.fields).some((k) => k !== 'acceptTerms')) setStep(1);
        }
        setBanner(body.error ?? 'Something went wrong. Please try again.');
        setBusy(false);
        return;
      }
      // Post the encrypted form to WebXPay. Card details are entered on WebXPay, never here.
      const f = document.createElement('form');
      f.method = 'POST';
      f.action = body.payment.action;
      for (const [k, v] of Object.entries(body.payment.fields)) {
        const i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = v;
        f.appendChild(i);
      }
      document.body.appendChild(f);
      f.submit();
    } catch {
      setBanner('We could not reach the payment page. Check your connection and try again.');
      setBusy(false);
    }
  };

  if (!ready) return <div className="skeleton h-[60vh]" aria-busy="true" />;
  if (!cart.length)
    return (
      <div className="panel mx-auto mt-10 max-w-lg py-16 text-center">
        <h1 className="t-h2">Your cart is empty</h1>
        <a href="/shop" className="btn btn-dark mt-6">
          <span>Back to the shop</span>
        </a>
      </div>
    );

  const cur = quote?.currency ?? (form.country === 'GB' ? 'GBP' : 'USD');
  const money = (n: number) => formatMoney(n, cur);
  const eta = etas[form.country];

  const Summary = (
    <div className="panel">
      <ul className="divide-y divide-line">
        {cart.map((l) => (
          <li key={l.productId + l.variantKey} className="flex gap-4 py-4 first:pt-0">
            <div className="relative w-16 shrink-0 rounded-[var(--radius-sm)] bg-bg p-1.5">
              <Garment category={l.category} color={l.colorHex} ink={l.inkHex} design={l.design} />
              <span className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-ink text-xs font-bold text-bg">{l.quantity}</span>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">{l.title}</p>
              <p className="text-muted">
                {l.colorName} · {l.size}
              </p>
            </div>
            <p className="t-price text-sm">{money(l.unitPrice[cur] * l.quantity)}</p>
          </li>
        ))}
      </ul>
      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <Row label="Subtotal" value={quote ? money(quote.subtotal) : '…'} />
        {quote && quote.discount > 0 && <Row label={`Discount (${quote.discountCode})`} value={`−${money(quote.discount)}`} />}
        <Row label={`Shipping (${method})`} value={quote ? (quote.shipping === 0 ? 'Free' : money(quote.shipping)) : '…'} />
        {quote && <Row label={quote.taxIncluded ? 'VAT included' : 'Sales tax'} value={quote.taxIncluded ? money(quote.tax) : money(quote.tax)} muted={quote.taxIncluded} />}
      </dl>
      <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-semibold">Total</span>
        <span className="t-price text-xl">
          <span className="mr-1.5 text-xs font-normal text-muted">{cur}</span>
          {quote ? money(quote.total) : '…'}
        </span>
      </div>
    </div>
  );

  return (
    <div ref={top} className="grid gap-8 py-8 lg:grid-cols-12 lg:gap-12 lg:py-12">
      {/* Mobile summary toggle */}
      <div className="lg:hidden">
        <button type="button" className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-line px-4 py-3.5 text-sm font-semibold" aria-expanded={summaryOpen} onClick={() => setSummaryOpen(!summaryOpen)}>
          <span className="flex items-center gap-2">
            <IconR name="bag" size={18} /> {summaryOpen ? 'Hide' : 'Show'} order summary
            <IconR name="chevron-down" size={16} className={summaryOpen ? 'rotate-180' : ''} />
          </span>
          <span className="t-price">{quote ? money(quote.total) : '…'}</span>
        </button>
        {summaryOpen && <div className="mt-3">{Summary}</div>}
      </div>

      <div className="lg:col-span-7">
        {/* Steps */}
        <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="Checkout steps">
          {(['Details', 'Shipping', 'Pay'] as const).map((label, i) => {
            const n = (i + 1) as Step;
            const state = n < step ? 'done' : n === step ? 'current' : 'todo';
            return (
              <li key={label} className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={n > step}
                  onClick={() => n < step && go(n)}
                  aria-current={state === 'current' ? 'step' : undefined}
                  className={`flex items-center gap-2 font-semibold ${state === 'todo' ? 'text-muted' : ''}`}
                >
                  <span className={`grid size-7 place-items-center rounded-full text-xs ${state === 'todo' ? 'border border-line' : 'bg-ink text-bg'}`}>{state === 'done' ? <IconR name="check" size={14} /> : n}</span>
                  {label}
                </button>
                {i < 2 && <span className="h-px w-6 bg-line sm:w-10" aria-hidden="true" />}
              </li>
            );
          })}
        </ol>

        {banner && (
          <div role="alert" className="mb-6 flex gap-3 rounded-[var(--radius-md)] border border-danger/40 bg-danger/5 p-4 text-sm">
            <IconR name="alert" size={20} className="shrink-0 text-danger" /> {banner}
          </div>
        )}

        {step === 1 && (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              if (validateStep1()) go(2);
            }}
            className="grid gap-5"
          >
            <h1 className="t-h2">Contact and shipping</h1>
            <Input label="Email" name="email" type="email" autoComplete="email" value={form.email} error={errors.email} onChange={(v) => set('email', v)} hint="For your receipt and tracking updates." />
            <label className="check">
              <input type="checkbox" checked={form.marketing} onChange={(e) => set('marketing', e.target.checked)} />
              <span>Email me about new drops (10% off your next order). Optional.</span>
            </label>
            <div className="field">
              <label htmlFor="f-country" className="field-label">
                Country
              </label>
              <select id="f-country" className="input" value={form.country} onChange={(e) => (set('country', e.target.value as 'US' | 'GB'), set('region', ''))} autoComplete="country">
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
              </select>
              <p className="field-hint">We ship to the US and UK only. Prices are in {form.country === 'GB' ? 'GBP' : 'USD'}.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Input label="First name" name="firstName" autoComplete="given-name" value={form.firstName} error={errors.firstName} onChange={(v) => set('firstName', v)} />
              <Input label="Last name" name="lastName" autoComplete="family-name" value={form.lastName} error={errors.lastName} onChange={(v) => set('lastName', v)} />
            </div>
            <Input label="Address" name="address1" autoComplete="address-line1" value={form.address1} error={errors.address1} onChange={(v) => set('address1', v)} />
            <Input label="Apartment, suite, etc." name="address2" autoComplete="address-line2" value={form.address2} onChange={(v) => set('address2', v)} optional />
            <div className="grid gap-5 sm:grid-cols-3">
              <Input label={form.country === 'GB' ? 'Town or city' : 'City'} name="city" autoComplete="address-level2" value={form.city} error={errors.city} onChange={(v) => set('city', v)} />
              {form.country === 'US' ? (
                <div className="field">
                  <label htmlFor="f-region" className="field-label">
                    State
                  </label>
                  <select id="f-region" className="input" value={form.region} onChange={(e) => set('region', e.target.value)} autoComplete="address-level1" aria-invalid={!!errors.region} aria-describedby={errors.region ? 'f-region-err' : undefined}>
                    <option value="">Choose</option>
                    {US_STATES.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {errors.region && (
                    <p id="f-region-err" className="field-error">
                      {errors.region}
                    </p>
                  )}
                </div>
              ) : (
                <Input label="County" name="region" autoComplete="address-level1" value={form.region} onChange={(v) => set('region', v)} optional />
              )}
              <Input label={form.country === 'GB' ? 'Postcode' : 'ZIP code'} name="postcode" autoComplete="postal-code" value={form.postcode} error={errors.postcode} onChange={(v) => set('postcode', v)} />
            </div>
            <Input label="Phone" name="phone" type="tel" autoComplete="tel" value={form.phone} error={errors.phone} onChange={(v) => set('phone', v)} hint="Only used by the courier for delivery." />
            <button type="submit" className="btn btn-dark btn-lg mt-2 sm:w-fit">
              <span>Continue to shipping</span>
              <IconR name="arrow-right" size={20} className="btn-arrow" />
            </button>
          </form>
        )}

        {step === 2 && (
          <div className="grid gap-5">
            <h1 className="t-h2">Shipping method</h1>
            <Recap form={form} onEdit={() => go(1)} />
            <fieldset className="grid gap-3">
              <legend className="sr-only">Shipping method</legend>
              {(['standard', 'express'] as const).map((m) => (
                <label key={m} className={`flex cursor-pointer items-center gap-4 rounded-[var(--radius-md)] border-[1.5px] p-4 transition-colors ${method === m ? 'border-ink' : 'border-line hover:border-stone'}`}>
                  <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="size-5 accent-[var(--color-ink)]" />
                  <span className="flex-1">
                    <span className="block font-semibold capitalize">{m}</span>
                    <span className="block text-sm text-muted">Arrives {eta[m]} (printing included)</span>
                  </span>
                  <span className="t-price">{quote && method === m ? (quote.shipping === 0 ? 'Free' : money(quote.shipping)) : m === 'standard' ? 'From ' + money(cur === 'GBP' ? 499 : 599) : money(cur === 'GBP' ? 1199 : 1499)}</span>
                </label>
              ))}
            </fieldset>
            <button type="button" className="btn btn-dark btn-lg mt-2 sm:w-fit" onClick={() => go(3)}>
              <span>Continue to review</span>
              <IconR name="arrow-right" size={20} className="btn-arrow" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-6">
            <h1 className="t-h2">Review and pay</h1>
            <Recap form={form} onEdit={() => go(1)} method={method} onEditMethod={() => go(2)} />
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setAppliedCode(code.trim());
              }}
            >
              <label htmlFor="f-code" className="sr-only">
                Discount code
              </label>
              <input id="f-code" className="input flex-1" placeholder="Discount code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
              <button type="submit" className="btn btn-outline">
                <span>Apply</span>
              </button>
            </form>
            {quote?.errors.map((er) => (
              <p key={er} className="field-error -mt-3" role="alert">
                {er}
              </p>
            ))}
            {quote?.discountCode && <p className="-mt-3 text-sm font-semibold">Code {quote.discountCode} applied.</p>}
            <label className="check">
              <input type="checkbox" checked={terms} onChange={(e) => (setTerms(e.target.checked), setErrors((x) => ({ ...x, terms: '' })))} aria-invalid={!!errors.terms} />
              <span>
                I agree to the <a href="/legal/terms" target="_blank" className="underline">terms</a> and understand each item is printed to order.
              </span>
            </label>
            {errors.terms && (
              <p className="field-error -mt-3" role="alert">
                {errors.terms}
              </p>
            )}
            <button type="button" className="btn btn-primary btn-lg btn-block" onClick={pay} disabled={busy || !quote || quote.errors.length > 0} aria-busy={busy}>
              <IconR name="lock" size={18} />
              <span>{busy ? 'Opening secure payment…' : `Pay ${quote ? money(quote.total) : ''} with card`}</span>
            </button>
            <p className="flex items-start gap-2 text-sm text-muted">
              <IconR name="card" size={18} className="shrink-0" />
              You will enter your card on WebXPay's secure page (Visa and Mastercard), then come back here. CharFlut never sees your card number.
            </p>
          </div>
        )}
      </div>

      <aside className="hidden lg:col-span-5 lg:block">
        <div className="sticky top-6">
          <h2 className="t-label mb-4 text-muted">Order summary</h2>
          {Summary}
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className={`flex justify-between ${muted ? 'text-muted' : ''}`}>
      <dt>{label}</dt>
      <dd className="t-price">{value}</dd>
    </div>
  );
}

function Recap({ form, onEdit, method, onEditMethod }: { form: Form; onEdit: () => void; method?: string; onEditMethod?: () => void }) {
  return (
    <div className="divide-y divide-line rounded-[var(--radius-md)] border border-line text-sm">
      <div className="flex gap-4 p-4">
        <span className="w-20 shrink-0 text-muted">Contact</span>
        <span className="min-w-0 flex-1 truncate">{form.email}</span>
        <button type="button" className="font-semibold underline underline-offset-4" onClick={onEdit}>
          Change
        </button>
      </div>
      <div className="flex gap-4 p-4">
        <span className="w-20 shrink-0 text-muted">Ship to</span>
        <span className="min-w-0 flex-1">
          {form.address1}
          {form.address2 ? `, ${form.address2}` : ''}, {form.city} {form.region} {form.postcode}, {form.country === 'GB' ? 'UK' : 'US'}
        </span>
        <button type="button" className="font-semibold underline underline-offset-4" onClick={onEdit}>
          Change
        </button>
      </div>
      {method && (
        <div className="flex gap-4 p-4">
          <span className="w-20 shrink-0 text-muted">Method</span>
          <span className="flex-1 capitalize">{method}</span>
          <button type="button" className="font-semibold underline underline-offset-4" onClick={onEditMethod}>
            Change
          </button>
        </div>
      )}
    </div>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  type = 'text',
  autoComplete,
  optional,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  hint?: string;
  type?: string;
  autoComplete?: string;
  optional?: boolean;
}) {
  const id = `f-${name}`;
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label}
        {optional && <span className="font-normal text-muted"> (optional)</span>}
      </label>
      <input id={id} name={name} type={type} className="input" value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={describedBy} />
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
