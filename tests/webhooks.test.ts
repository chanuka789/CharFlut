import { describe, expect, it } from 'vitest';
import { secretMatches } from '@/lib/server/webhooks';
import { addWorkingDays } from '@/lib/delivery';

describe('webhook secret path', () => {
  it('matches only the exact secret', () => {
    expect(secretMatches('abc123', 'abc123')).toBe(true);
    expect(secretMatches('abc124', 'abc123')).toBe(false);
    expect(secretMatches('abc', 'abc123')).toBe(false);
    expect(secretMatches(undefined, 'abc123')).toBe(false);
    expect(secretMatches('abc123', undefined)).toBe(false);
  });
});

describe('delivery estimate', () => {
  it('skips weekends', () => {
    const fri = new Date('2026-10-02T12:00:00Z'); // Friday
    expect(addWorkingDays(fri, 1).getUTCDay()).toBe(1); // Monday
  });
});
