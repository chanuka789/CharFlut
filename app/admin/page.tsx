'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface RecentOrder {
  id: string
  total: number
  status: string
  createdAt: string
  user: { name: string | null; email: string }
  items: { product: { name: string } }[]
}

interface LowStockItem {
  id: string
  name: string
  stock: number
  sku: string | null
}

interface Stats {
  revenue: { current: number; growth: string | null }
  orders: { current: number; growth: string | null }
  customers: { current: number; growth: string | null }
  totalProducts: number
  totalCollections: number
  recentOrders: RecentOrder[]
  lowStock: LowStockItem[]
}

const STATUS_CLASSES: Record<string, string> = {
  DELIVERED: 'pill-green',
  SHIPPED: 'pill-blue',
  PROCESSING: 'pill-yellow',
  PENDING: 'pill-gray',
  CANCELLED: 'pill-red',
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtGrowth(growth: string | null) {
  if (growth === null) return { label: 'No data', up: true }
  const num = parseFloat(growth)
  return { label: `${num >= 0 ? '+' : ''}${growth}% vs last month`, up: num >= 0 }
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => {
        if (!data.error) setStats(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .admin-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        .kpi-skeleton { height: 18px; border-radius: 6px; background: rgba(255,255,255,0.06); animation: pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media (max-width: 1200px) {
          .admin-kpis { grid-template-columns: repeat(2, 1fr); }
          .admin-grid { grid-template-columns: 1fr; }
        }
      ` }} />

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} snapshot
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link href="/admin/products" className="btn-g">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Products
          </Link>
          <Link href="/admin/products/new" className="btn-p">+ New Product</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="admin-kpis">
        {[
          {
            label: `Revenue (${new Date().toLocaleDateString('en-US', { month: 'short' })})`,
            value: loading ? null : `$${(stats?.revenue.current || 0).toFixed(2)}`,
            growth: loading ? null : stats?.revenue.growth ?? null,
          },
          {
            label: 'Orders (this month)',
            value: loading ? null : String(stats?.orders.current || 0),
            growth: loading ? null : stats?.orders.growth ?? null,
          },
          {
            label: 'New Customers',
            value: loading ? null : String(stats?.customers.current || 0),
            growth: loading ? null : stats?.customers.growth ?? null,
          },
          {
            label: 'Total Products',
            value: loading ? null : String(stats?.totalProducts || 0),
            growth: null,
          },
        ].map((kpi, i) => {
          const g = fmtGrowth(kpi.growth)
          return (
            <div key={i} className="kpi-card panel">
              <div className="kpi-label">{kpi.label}</div>
              {kpi.value === null ? (
                <>
                  <div className="kpi-skeleton" style={{ width: '60%', height: 28, margin: '8px 0' }} />
                  <div className="kpi-skeleton" style={{ width: '80%', height: 14, marginTop: 4 }} />
                </>
              ) : (
                <>
                  <div className="kpi-value">{kpi.value}</div>
                  {kpi.growth !== null && (
                    <div className={`kpi-delta ${g.up ? 'up' : 'down'}`}>
                      {g.up ? '↑' : '↓'} {g.label}
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="admin-grid">
        {/* Recent orders */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Orders</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {stats && (
                <span className="pill-g pill-yellow">
                  {stats.recentOrders.filter(o => o.status === 'PENDING').length} pending
                </span>
              )}
              <Link href="/admin/orders" className="btn-g btn-xs">View All</Link>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dtable">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      Loading...
                    </td>
                  </tr>
                ) : !stats || stats.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                      No orders yet
                    </td>
                  </tr>
                ) : (
                  stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}>
                        {order.id.substring(0, 8)}…
                      </td>
                      <td>{order.user.name || order.user.email}</td>
                      <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.items[0]?.product.name || '—'}
                      </td>
                      <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                      <td>
                        <span className={`pill-g ${STATUS_CLASSES[order.status] || 'pill-gray'}`}>
                          {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{fmtDate(order.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Low Stock Alerts</span>
            {stats && <span className="pill-g pill-red">{stats.lowStock.length}</span>}
          </div>
          <div className="panel-body">
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>Loading...</div>
            ) : !stats || stats.lowStock.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: 24 }}>
                All products well-stocked
              </div>
            ) : (
              stats.lowStock.map((item, i) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < stats.lowStock.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</div>
                    {item.sku && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: item.stock <= 2 ? 'var(--danger)' : 'var(--warning)' }}>{item.stock}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>in stock</div>
                  </div>
                </div>
              ))
            )}
            <Link href="/admin/products" className="btn-g" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              Manage Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {[
          { label: 'Total Products', value: loading ? '…' : String(stats?.totalProducts || 0), icon: '📦', link: '/admin/products' },
          { label: 'Collections', value: loading ? '…' : String(stats?.totalCollections || 0), icon: '🗂️', link: '/admin/collections' },
          { label: 'Orders', value: loading ? '…' : String(stats?.orders.current || 0), icon: '🛒', link: '/admin/orders' },
        ].map((stat, i) => (
          <Link key={i} href={stat.link} className="panel" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 32 }}>{stat.icon}</span>
            <div>
              <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
