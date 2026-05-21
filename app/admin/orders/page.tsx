'use client'

import { useState, useEffect } from 'react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  product: { name: string }
}

interface Order {
  id: string
  total: number
  status: string
  createdAt: string
  address: string | null
  user: { name: string | null; email: string }
  items: OrderItem[]
}

const STATUS_CLASSES: Record<string, string> = {
  DELIVERED: 'pill-green',
  SHIPPED: 'pill-blue',
  PROCESSING: 'pill-yellow',
  PENDING: 'pill-gray',
  CANCELLED: 'pill-red',
  REFUNDED: 'pill-gray',
}

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<Order | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = orders.filter(o => {
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      o.user.email.toLowerCase().includes(q) ||
      (o.user.name || '').toLowerCase().includes(q)
    const matchesStatus = !statusFilter || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const updateStatus = async (orderId: string, status: string) => {
    setUpdatingId(orderId)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
        if (selected?.id === orderId) setSelected(s => s ? { ...s, status } : null)
        showToast('Status updated')
      } else {
        showToast('Update failed')
      }
    } catch {
      showToast('Update failed')
    } finally {
      setUpdatingId(null)
    }
  }

  const totals = {
    revenue: orders.reduce((s, o) => s + o.total, 0),
    pending: orders.filter(o => o.status === 'PENDING').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
  }

  return (
    <>
      <style>{`
        .orders-table { width: 100%; border-collapse: collapse; }
        .orders-table th { padding: 10px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border); white-space: nowrap; }
        .orders-table td { padding: 12px 14px; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .orders-table tr:hover td { background: rgba(255,255,255,0.02); cursor: pointer; }
        .orders-table tr:last-child td { border-bottom: none; }
        .order-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: flex-start; justify-content: flex-end; }
        .order-detail-panel { width: 420px; height: 100vh; background: var(--bg-glass); backdrop-filter: blur(20px); border-left: 1px solid var(--border); padding: 32px 24px; overflow-y: auto; }
      `}</style>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Orders</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{orders.length} total orders</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="kpi-card panel" style={{ padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Revenue</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-primary)' }}>${totals.revenue.toFixed(2)}</div>
          </div>
          <div className="kpi-card panel" style={{ padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Pending</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--warning)' }}>{totals.pending}</div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="f-input" style={{ paddingLeft: 36 }} placeholder="Search by ID, customer…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select className="f-select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0) + s.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} results</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading orders…</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>🛒</div>
                    <p style={{ color: 'var(--text-muted)' }}>No orders yet</p>
                  </td>
                </tr>
              ) : (
                paginated.map(order => (
                  <tr key={order.id} onClick={() => setSelected(order)}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)', fontWeight: 600 }}>
                      {order.id.substring(0, 8)}…
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{order.user.name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{order.user.email}</div>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>${order.total.toFixed(2)}</td>
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

        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-g btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹ Prev</button>
              <button className="btn-g btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next ›</button>
            </div>
          </div>
        )}
      </div>

      {/* Order detail panel */}
      {selected && (
        <div className="order-detail-overlay" onClick={() => setSelected(null)}>
          <div className="order-detail-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Order Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
            </div>

            <div style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>{selected.id}</div>

            <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Customer</div>
              <div style={{ fontWeight: 600 }}>{selected.user.name || 'Unknown'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{selected.user.email}</div>
            </div>

            {selected.address && (
              <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Shipping Address</div>
                <div style={{ fontSize: 13, lineHeight: 1.6 }}>{selected.address}</div>
              </div>
            )}

            <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Items</div>
              {selected.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>×{item.quantity}</div>
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>${(item.price * item.quantity).toFixed(2)}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700, fontSize: 15 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>${selected.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Update Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    className={`btn-g btn-sm ${selected.status === s ? 'active' : ''}`}
                    style={{
                      justifyContent: 'flex-start',
                      background: selected.status === s ? 'rgba(255,211,44,0.12)' : undefined,
                      borderColor: selected.status === s ? 'var(--accent)' : undefined,
                      color: selected.status === s ? 'var(--accent)' : undefined,
                      opacity: updatingId === selected.id ? 0.6 : 1,
                    }}
                    onClick={() => updateStatus(selected.id, s)}
                    disabled={updatingId === selected.id}
                  >
                    <span className={`pill-g ${STATUS_CLASSES[s]} pill-xs`} style={{ width: 8, height: 8, borderRadius: '50%', padding: 0 }} />
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                    {selected.status === s && ' ✓'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
              Placed {fmtDate(selected.createdAt)}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-success">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}
    </>
  )
}
