import type { PaymentCustomer } from '@/lib/payments/types';

/** Checks the checkout form on the server. Returns field errors keyed by field name. */
export function validateCustomer(raw: Record<string, unknown>): { customer?: PaymentCustomer; errors: Record<string, string> } {
  const s = (k: string, max = 120) => String(raw[k] ?? '').trim().slice(0, max);
  const c: PaymentCustomer = {
    firstName: s('firstName', 60),
    lastName: s('lastName', 60),
    email: s('email', 160),
    phone: s('phone', 30),
    address1: s('address1'),
    address2: s('address2') || undefined,
    city: s('city', 80),
    region: s('region', 60) || undefined,
    postcode: s('postcode', 16).toUpperCase(),
    country: s('country') === 'GB' ? 'GB' : 'US',
  };
  const errors: Record<string, string> = {};
  if (!c.firstName) errors.firstName = 'Enter your first name.';
  if (!c.lastName) errors.lastName = 'Enter your last name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email)) errors.email = 'Enter a valid email address.';
  if (!/^[+\d][\d\s()-]{6,}$/.test(c.phone)) errors.phone = 'Enter a phone number so the courier can reach you.';
  if (!c.address1) errors.address1 = 'Enter your street address.';
  if (!c.city) errors.city = 'Enter your town or city.';
  if (c.country === 'US') {
    if (!/^[A-Z]{2}$/.test(c.region ?? '')) errors.region = 'Choose your state.';
    if (!/^\d{5}(-\d{4})?$/.test(c.postcode)) errors.postcode = 'Enter a 5-digit ZIP code.';
  } else if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/.test(c.postcode)) {
    errors.postcode = 'Enter a valid UK postcode.';
  }
  return Object.keys(errors).length ? { errors } : { customer: c, errors };
}
