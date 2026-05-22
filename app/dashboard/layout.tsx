'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

const NAV_ITEMS = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/dashboard',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'orders',
    label: 'Orders',
    href: '/dashboard/orders',
    badge: '3',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
  },
  {
    id: 'addresses',
    label: 'Addresses',
    href: '/dashboard/addresses',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
  },
  {
    id: 'payment',
    label: 'Payment',
    href: '/dashboard/payment',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
        <line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
  },
  {
    id: 'wishlist',
    label: 'Wishlist',
    href: '/dashboard/wishlist',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
  {
    id: 'settings',
    label: 'Settings',
    href: '/dashboard/settings',
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          Loading...
        </div>
      </div>
    )
  }

  if (!session) return null

  const user = session.user
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '?'

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dash-layout { display: flex; flex: 1; padding-top: 80px; min-height: 100vh; }
        .dash-sidebar {
          width: 260px;
          min-width: 260px;
          height: calc(100vh - 80px);
          position: sticky;
          top: 80px;
          border-right: 1px solid var(--border);
          background: linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          backdrop-filter: blur(32px);
          -webkit-backdrop-filter: blur(32px);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .dash-avatar-block {
          padding: 24px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .dash-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent), #E6B800);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: #000;
          flex-shrink: 0;
        }
        .dash-name { font-size: 15px; font-weight: 700; color: var(--text-primary); }
        [data-theme="light"] .dash-name { color: #0a0a0b; }
        .dash-email { font-size: 11px; color: var(--text-muted); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 150px; }
        .dash-nav { padding: 12px 0; flex: 1; }
        .dash-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 20px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.18s;
          position: relative;
          user-select: none;
          text-decoration: none;
        }
        .dash-nav-item:hover { color: var(--text-primary); background: rgba(255,255,255,0.04); }
        .dash-nav-item.active { color: var(--accent-primary); background: rgba(255,211,44,0.07); }
        .dash-nav-item.active::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: var(--accent-primary);
          border-radius: 0 2px 2px 0;
        }
        .dash-nav-badge {
          margin-left: auto;
          padding: 2px 7px;
          background: rgba(255,211,44,0.12);
          color: var(--accent);
          border-radius: var(--r-pill);
          font-size: 10px;
          font-weight: 700;
        }
        .dash-nav-divider { height: 1px; background: var(--border); margin: 8px 20px; }
        .dash-signout {
          padding: 11px 20px;
          font-size: 13px;
          color: var(--danger);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.18s;
          border: none;
          background: none;
          width: 100%;
          font-family: inherit;
        }
        .dash-signout:hover { background: rgba(255,92,92,0.05); }
        .dash-main { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 32px 40px; }

        @media (max-width: 768px) {
          .dash-layout { flex-direction: column; }
          .dash-sidebar {
            width: 100% !important;
            min-width: 100% !important;
            height: auto !important;
            position: sticky !important;
            top: 80px;
            z-index: 10;
            flex-direction: row !important;
            align-items: center !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            overflow-y: visible !important;
            overflow-x: auto !important;
            scrollbar-width: none; /* Hide scrollbar for clean look */
            -ms-overflow-style: none;
            padding: 8px 16px !important;
          }
          .dash-sidebar::-webkit-scrollbar {
            display: none; /* Hide scrollbar in Safari/Chrome */
          }
          .dash-sidebar .dash-name, .dash-sidebar .dash-email { display: none; }
          .dash-avatar-block {
            padding: 0 !important;
            border-bottom: none !important;
            margin-right: 12px;
            flex-shrink: 0;
          }
          .dash-avatar {
            width: 36px !important;
            height: 36px !important;
            font-size: 13px !important;
          }
          .dash-nav {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            padding: 0 !important;
            gap: 8px !important;
            flex: unset !important;
          }
          .dash-nav-item {
            padding: 8px 14px !important;
            border-radius: 20px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .dash-nav-item::before { display: none !important; }
          .dash-nav-item span:not(.dash-nav-badge) { display: inline !important; }
          .dash-nav-badge {
            margin-left: 2px !important;
            padding: 1px 5px !important;
            font-size: 9px !important;
          }
          .dash-nav-divider { display: none !important; }
          .dash-signout {
            width: auto !important;
            padding: 8px 14px !important;
            border-radius: 20px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            display: flex !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .dash-signout span { display: inline !important; }
          .dash-main { padding: 20px 16px; }
        }
      `}} />

      <div className="dash-layout">
        <aside className="dash-sidebar">
          <div className="dash-avatar-block">
            <div className="dash-avatar">{initials}</div>
            <div>
              <div className="dash-name">{user.name || 'Customer'}</div>
              <div className="dash-email">{user.email}</div>
            </div>
          </div>

          <nav className="dash-nav">
            {NAV_ITEMS.map(item => (
              <Link
                key={item.id}
                href={item.href}
                className={`dash-nav-item${pathname === item.href ? ' active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && <span className="dash-nav-badge">{item.badge}</span>}
              </Link>
            ))}

            <div className="dash-nav-divider" />

            <button className="dash-signout" onClick={() => signOut({ callbackUrl: '/' })}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        <main className="dash-main">
          {children}
        </main>
      </div>
    </>
  )
}
