'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { MeshBackground } from '@/components/MeshBackground'

const NAV_SECTIONS = [
  {
    label: 'Store',
    items: [
      {
        id: 'dashboard', label: 'Dashboard', href: '/admin',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
      },
      {
        id: 'products', label: 'Products', href: '/admin/products',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
      },
      {
        id: 'trash', label: 'Trash', href: '/admin/products/trash',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6 18.2 19.1A2 2 0 0 1 16.2 21H7.8A2 2 0 0 1 5.8 19.1L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
      },
      {
        id: 'collections', label: 'Collections', href: '/admin/collections',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
      },
      {
        id: 'orders', label: 'Orders', href: '/admin/orders',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
      },
      {
        id: 'customers', label: 'Customers', href: '/admin/customers',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      },
    ]
  },
  {
    label: 'System',
    items: [
      {
        id: 'settings', label: 'Settings', href: '/admin/settings',
        icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      },
    ]
  }
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'ADMIN') {
      router.push('/')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') return null

  const initials = session.user.name ? session.user.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'A'

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <MeshBackground />
      <div className="admin-layout">
        {/* Sidebar */}
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
          <div className="sidebar-header">
            <div className="sidebar-logo-mark">CF</div>
            <span className="sidebar-logo-text">CharFlut Admin</span>
          </div>

          <nav className="sidebar-nav">
            {NAV_SECTIONS.map(section => (
              <div key={section.label}>
                <div className="nav-section-label">{section.label}</div>
                {section.items.map(item => {
                  const isActive = item.id === 'products'
                    ? pathname === item.href || (pathname.startsWith('/admin/products/') && !pathname.startsWith('/admin/products/trash'))
                    : pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      className={`nav-item${isActive ? ' active' : ''}`}
                    >
                      {item.icon}
                      <span className="nav-item-label">{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <button
                className="nav-item"
                style={{ color: 'var(--danger)', width: '100%' }}
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                <span className="nav-item-label">Logout</span>
              </button>
            </div>
          </nav>

          <div className="sidebar-footer">
            <button className="sidebar-toggle" onClick={() => setCollapsed(c => !c)}>
              {collapsed ? (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
              ) : (
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
              )}
            </button>
          </div>
        </aside>

        {/* Main area */}
        <div className="admin-main">
          {/* Top bar */}
          <div className="topbar">
            <div className="topbar-breadcrumbs">
              <span>Admin</span>
              <span className="sep">›</span>
              <span className="active">
                {pathname === '/admin' ? 'Dashboard' :
                 pathname.startsWith('/admin/products') ? 'Products' :
                 pathname.startsWith('/admin/collections') ? 'Collections' : 'Admin'}
              </span>
            </div>

            <div className="topbar-search">
              <svg className="topbar-search-icon" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search everything..." />
            </div>

            <div className="topbar-actions">
              <Link href="/" target="_blank" className="topbar-view-store">
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                View Store
              </Link>
              <div className="topbar-avatar">{initials}</div>
            </div>
          </div>

          <div className="admin-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
