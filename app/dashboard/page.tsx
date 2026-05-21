'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'

const MOCK_ORDERS = [
  { id: '#CF-001', date: 'May 18, 2026', status: 'Delivered', total: 429.98, items: 2 },
  { id: '#CF-002', date: 'May 10, 2026', status: 'Shipped', total: 299.00, items: 1 },
  { id: '#CF-003', date: 'Apr 28, 2026', status: 'Processing', total: 189.99, items: 3 },
]

const STATUS_CLASSES: Record<string, string> = {
  Delivered: 'pill-green',
  Shipped: 'pill-blue',
  Processing: 'pill-yellow',
  Pending: 'pill-gray',
  Cancelled: 'pill-red',
}

export default function DashboardOverview() {
  const { data: session } = useSession()

  return (
    <>
      <style>{`
        .kpi-grid-dash { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .quick-actions { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 28px; }
        .quick-action {
          padding: 20px;
          border-radius: 16px;
          text-align: center;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s var(--spring);
        }
        .quick-action:hover { transform: translateY(-2px); }
        .quick-action-icon { font-size: 28px; margin-bottom: 8px; }
        .quick-action-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        [data-theme="light"] .quick-action-label { color: rgba(0,0,0,0.65); }
        .points-bar {
          padding: 20px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 28px;
        }
        .points-bar-progress {
          flex: 1;
          height: 8px;
          background: rgba(255,255,255,0.08);
          border-radius: 4px;
          overflow: hidden;
        }
        .points-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-hover));
          border-radius: 4px;
          transition: width 0.6s var(--spring);
        }

        @media (max-width: 1024px) {
          .kpi-grid-dash { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .quick-actions { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-primary)' }}>
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}! 👋
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 4 }}>
            Here's what's happening with your account
          </p>
        </div>
        <Link href="/shop" className="btn-p">
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          Continue Shopping
        </Link>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid-dash">
        {[
          { label: 'Total Orders', value: '12', delta: '+2 this month', up: true },
          { label: 'Total Spent', value: '$2,847', delta: '+$429 this month', up: true },
          { label: 'Wishlist Items', value: '24', delta: '5 on sale now', up: false },
          { label: 'Loyalty Points', value: '1,240', delta: '260 pts to gold', up: true },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card panel">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-delta ${kpi.up ? 'up' : ''}`}>
              {kpi.up ? (
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <polyline points="18 15 12 9 6 15"/>
                </svg>
              ) : (
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 12l2 2 4-4"/>
                </svg>
              )}
              {kpi.delta}
            </div>
          </div>
        ))}
      </div>

      {/* Loyalty points */}
      <div className="points-bar glass">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>Gold Member Status</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>1,240 / 1,500 points needed</div>
        </div>
        <div className="points-bar-progress">
          <div className="points-bar-fill" style={{ width: '82%' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-primary)' }}>1,240</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>points</div>
        </div>
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
      <div className="quick-actions">
        {[
          { icon: '📦', label: 'Track Order', href: '/dashboard/orders' },
          { icon: '🏠', label: 'Manage Addresses', href: '/dashboard/addresses' },
          { icon: '💳', label: 'Payment Methods', href: '/dashboard/payment' },
          { icon: '❤️', label: 'View Wishlist', href: '/dashboard/wishlist' },
          { icon: '⚙️', label: 'Account Settings', href: '/dashboard/settings' },
          { icon: '🛍️', label: 'Browse Shop', href: '/shop' },
        ].map((action, i) => (
          <Link key={i} href={action.href} className="quick-action panel">
            <div className="quick-action-icon">{action.icon}</div>
            <div className="quick-action-label">{action.label}</div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="panel">
        <div className="panel-header">
          <span className="panel-title">Recent Orders</span>
          <Link href="/dashboard/orders" className="btn-g btn-sm">View All</Link>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dtable">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_ORDERS.map(order => (
                <tr key={order.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                  <td>{order.date}</td>
                  <td>{order.items} item{order.items !== 1 ? 's' : ''}</td>
                  <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                  <td>
                    <span className={`pill-g ${STATUS_CLASSES[order.status] || 'pill-gray'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <Link href="/dashboard/orders" className="btn-g btn-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
