import type { IconName } from '@/components/ui/icons';

/** Admin modules (plan 05). `phase` shows what is live now; `roles` limits who sees it. */
export type AdminRole = 'owner' | 'manager' | 'support';
export type AdminNavItem = { label: string; href: string; icon: IconName; phase: 1 | 2 | 3; roles: AdminRole[]; group: 'Sell' | 'Catalog' | 'Grow' | 'Store' };

const ALL: AdminRole[] = ['owner', 'manager', 'support'];
const MGR: AdminRole[] = ['owner', 'manager'];
const OWN: AdminRole[] = ['owner'];

export const adminNav: AdminNavItem[] = [
  { label: 'Overview', href: '/admin', icon: 'home', phase: 1, roles: ALL, group: 'Sell' },
  { label: 'Orders', href: '/admin/orders', icon: 'box', phase: 1, roles: ALL, group: 'Sell' },
  { label: 'Payments', href: '/admin/payments', icon: 'card', phase: 2, roles: MGR, group: 'Sell' },
  { label: 'Refunds', href: '/admin/refunds', icon: 'return', phase: 2, roles: ALL, group: 'Sell' },
  { label: 'Inbox', href: '/admin/inbox', icon: 'inbox', phase: 3, roles: ALL, group: 'Sell' },
  { label: 'Products', href: '/admin/products', icon: 'tag', phase: 1, roles: MGR, group: 'Catalog' },
  { label: 'Pricing', href: '/admin/pricing', icon: 'percent', phase: 1, roles: MGR, group: 'Catalog' },
  { label: 'Drops', href: '/admin/drops', icon: 'sparkle', phase: 2, roles: MGR, group: 'Catalog' },
  { label: 'Providers', href: '/admin/providers', icon: 'plug', phase: 1, roles: MGR, group: 'Catalog' },
  { label: 'Customers', href: '/admin/customers', icon: 'users', phase: 2, roles: MGR, group: 'Grow' },
  { label: 'Discounts', href: '/admin/discounts', icon: 'percent', phase: 2, roles: MGR, group: 'Grow' },
  { label: 'Content', href: '/admin/content', icon: 'layers', phase: 3, roles: MGR, group: 'Grow' },
  { label: 'Emails', href: '/admin/emails', icon: 'mail', phase: 3, roles: MGR, group: 'Grow' },
  { label: 'Reports', href: '/admin/reports', icon: 'chart', phase: 3, roles: MGR, group: 'Grow' },
  { label: 'Settings', href: '/admin/settings', icon: 'settings', phase: 1, roles: OWN, group: 'Store' },
  { label: 'Audit log', href: '/admin/audit-log', icon: 'log', phase: 3, roles: OWN, group: 'Store' },
];

/** Bottom bar on phones: the four most-used screens; everything else lives under "More". */
export const adminMobileTabs = ['/admin', '/admin/orders', '/admin/products', '/admin/providers'];
