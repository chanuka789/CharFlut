'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_CLASSES: Record<string, string> = {
  DELIVERED: 'pill-green',
  SHIPPED: 'pill-blue',
  PROCESSING: 'pill-yellow',
  PENDING: 'pill-gray',
  CANCELLED: 'pill-red',
  REFUNDED: 'pill-red',
}

export default function DashboardOverview() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats')
        if (res.ok) {
          const data = await res.json()
          setStats(data)
        }
      } catch (err) {
        console.error('Failed to fetch dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const totalSpent = stats?.totalSpent || 0
  const points = stats?.loyaltyPoints || 0
  const targetPoints = 1500
  const progressPct = Math.min(100, Math.round((points / targetPoints) * 100))

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
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
        [data-theme="light"] .points-bar-progress {
          background: rgba(0,0,0,0.06);
        }
        .points-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--accent), var(--accent-hover));
          border-radius: 4px;
          transition: width 0.6s var(--spring);
        }
        
        /* Skeleton Animation */
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
          background: rgba(255,255,255,0.06);
          border-radius: 8px;
        }
        [data-theme="light"] .skeleton {
          background: rgba(0,0,0,0.04);
        }

        @media (max-width: 1024px) {
          .kpi-grid-dash { grid-template-columns: repeat(2, 1fr); }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .kpi-grid-dash { grid-template-columns: 1fr; }
          .points-bar { flex-direction: column; align-items: stretch; text-align: center; gap: 14px; }
          .points-bar-progress { width: 100%; height: 6px; }
          .quick-actions { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 360px) {
          .quick-actions { grid-template-columns: 1fr; }
        }
      `}} />

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
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="panel" style={{ padding: 24, minHeight: 120 }}>
                <div className="skeleton" style={{ width: '60%', height: 12, marginBottom: 16 }} />
                <div className="skeleton" style={{ width: '40%', height: 28 }} />
              </div>
            ))
          : [
              { label: 'Total Orders', value: stats?.totalOrders ?? 0, desc: 'Placed all-time' },
              { label: 'Total Spent', value: `$${totalSpent.toFixed(2)}`, desc: 'Secure checkout volume' },
              { label: 'Wishlist Items', value: stats?.wishlistCount ?? 0, desc: 'Items saved for later' },
              { label: 'Loyalty Points', value: points.toLocaleString(), desc: `${targetPoints - points > 0 ? targetPoints - points : 0} pts to next status` },
            ].map((kpi, i) => (
              <div key={i} className="kpi-card panel">
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                  {kpi.desc}
                </div>
              </div>
            ))}
      </div>

      {/* Loyalty points */}
      <div className="points-bar glass">
        {loading ? (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="skeleton" style={{ width: '30%', height: 12 }} />
            <div className="skeleton" style={{ width: '100%', height: 8 }} />
          </div>
        ) : (
          <>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>
                {points >= targetPoints ? '💎 Platinum Member Status' : 'Gold Member Status'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {points >= targetPoints
                  ? 'Awesome! You have unlocked maximum benefits.'
                  : `${points} / ${targetPoints} points needed for Platinum`}
              </div>
            </div>
            <div className="points-bar-progress">
              <div className="points-bar-fill" style={{ width: `${progressPct}%` }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-primary)' }}>{points}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>points</div>
            </div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
      <div className="quick-actions">
        {[
          { icon: '📦', label: 'Order History', href: '/dashboard/orders' },
          { icon: '🏠', label: 'Manage Addresses', href: '/dashboard/addresses' },
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
          {loading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ width: '100%', height: 20 }} />
              <div className="skeleton" style={{ width: '100%', height: 20 }} />
            </div>
          ) : !stats?.recentOrders || stats.recentOrders.length === 0 ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
              <p style={{ fontSize: 14 }}>No orders placed yet.</p>
              <Link href="/shop" className="btn-p btn-sm" style={{ marginTop: 12 }}>Shop Our Products</Link>
            </div>
          ) : (
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
                {stats.recentOrders.map((order: any) => {
                  const qty = order.items.reduce((sum: number, i: any) => sum + i.quantity, 0)
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td>{dateStr}</td>
                      <td>{qty} item{qty !== 1 ? 's' : ''}</td>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>
                        ${order.total.toFixed(2)}
                      </td>
                      <td>
                        <span className={`pill-g ${STATUS_CLASSES[order.status] || 'pill-gray'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td>
                        <Link href="/dashboard/orders" className="btn-g btn-xs">View</Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}
