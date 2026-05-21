'use client'

import Link from 'next/link'

const RECENT_ORDERS = [
  { id: '#CF-1001', customer: 'Alex Johnson', product: 'Wireless Headphones', total: 299.00, status: 'Delivered', date: 'May 20' },
  { id: '#CF-1002', customer: 'Sam Rivera', product: 'Smart Watch Pro', total: 599.00, status: 'Processing', date: 'May 20' },
  { id: '#CF-1003', customer: 'Jordan Lee', product: 'Leather Bag', total: 459.00, status: 'Shipped', date: 'May 19' },
  { id: '#CF-1004', customer: 'Taylor Kim', product: 'Yoga Mat Premium', total: 89.00, status: 'Pending', date: 'May 19' },
  { id: '#CF-1005', customer: 'Morgan Chen', product: 'Desk Lamp', total: 189.00, status: 'Delivered', date: 'May 18' },
]

const LOW_STOCK = [
  { name: 'Smart Watch Pro (Gold)', stock: 2, sku: 'SWP-GLD' },
  { name: 'Designer Sunglasses', stock: 4, sku: 'DS-001' },
  { name: 'Yoga Mat Premium (Purple)', stock: 3, sku: 'YMP-PRP' },
]

const STATUS_CLASSES: Record<string, string> = {
  Delivered: 'pill-green',
  Shipped: 'pill-blue',
  Processing: 'pill-yellow',
  Pending: 'pill-gray',
}

export default function AdminDashboard() {
  return (
    <>
      <style>{`
        .admin-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
        .sparkline { height: 36px; display: flex; align-items: flex-end; gap: 2px; }
        .spark-bar { flex: 1; border-radius: 2px 2px 0 0; background: rgba(255,211,44,0.3); transition: background 0.2s; }
        .spark-bar:hover { background: rgba(255,211,44,0.6); }
        .admin-grid { display: grid; grid-template-columns: 1fr 320px; gap: 24px; }
        @media (max-width: 1200px) {
          .admin-kpis { grid-template-columns: repeat(2, 1fr); }
          .admin-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Dashboard Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Welcome back! Here's what's happening today.</p>
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
          { label: 'Revenue (May)', value: '$48,291', delta: '+18.4%', up: true, spark: [35, 42, 38, 55, 60, 45, 72, 80, 65, 90] },
          { label: 'Orders', value: '1,247', delta: '+12.3%', up: true, spark: [30, 45, 35, 50, 48, 55, 62, 58, 70, 75] },
          { label: 'Customers', value: '4,831', delta: '+8.7%', up: true, spark: [60, 65, 62, 68, 72, 70, 75, 78, 80, 85] },
          { label: 'Conversion Rate', value: '3.42%', delta: '-0.3%', up: false, spark: [45, 48, 52, 49, 45, 50, 48, 44, 46, 43] },
        ].map((kpi, i) => (
          <div key={i} className="kpi-card panel">
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            <div className={`kpi-delta ${kpi.up ? 'up' : 'down'}`}>
              {kpi.up ? '↑' : '↓'} {kpi.delta} vs last month
            </div>
            <div className="sparkline" style={{ marginTop: 12 }}>
              {kpi.spark.map((h, j) => (
                <div key={j} className="spark-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="admin-grid">
        {/* Recent orders */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Recent Orders</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="pill-g pill-yellow">{RECENT_ORDERS.filter(o => o.status === 'Pending').length} pending</span>
              <button className="btn-g btn-xs">View All</button>
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
                {RECENT_ORDERS.map(order => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                    <td>{order.customer}</td>
                    <td style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{order.product}</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`pill-g ${STATUS_CLASSES[order.status] || 'pill-gray'}`}>{order.status}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{order.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Low Stock Alerts</span>
            <span className="pill-g pill-red">{LOW_STOCK.length}</span>
          </div>
          <div className="panel-body">
            {LOW_STOCK.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < LOW_STOCK.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.sku}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: item.stock <= 3 ? 'var(--danger)' : 'var(--warning)' }}>{item.stock}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>in stock</div>
                </div>
              </div>
            ))}
            <Link href="/admin/products" className="btn-g" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              Manage Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Quick stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24 }}>
        {[
          { label: 'Total Products', value: '1,247', icon: '📦', link: '/admin/products' },
          { label: 'Collections', value: '8', icon: '🗂️', link: '/admin/collections' },
          { label: 'Active Promotions', value: '3', icon: '🏷️', link: '/admin' },
        ].map((stat, i) => (
          <Link key={i} href={stat.link} className="panel" style={{ padding: 20, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 16, transition: 'transform 0.2s var(--spring)' }}>
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
