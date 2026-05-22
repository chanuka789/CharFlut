'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STATUS_CLASSES: Record<string, string> = {
  DELIVERED: 'pill-green',
  SHIPPED: 'pill-blue',
  PROCESSING: 'pill-yellow',
  PENDING: 'pill-gray',
  CANCELLED: 'pill-red',
  REFUNDED: 'pill-red',
}

const getTimeline = (order: any) => {
  const dateStr = (date: Date | string) => new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  if (order.status === 'CANCELLED') {
    return [
      { label: 'Order Placed', date: dateStr(order.createdAt), done: true },
      { label: 'Cancelled', date: dateStr(order.updatedAt || order.createdAt), done: true, isDanger: true }
    ]
  }
  if (order.status === 'REFUNDED') {
    return [
      { label: 'Order Placed', date: dateStr(order.createdAt), done: true },
      { label: 'Refunded', date: dateStr(order.updatedAt || order.createdAt), done: true, isDanger: true }
    ]
  }

  const isProcessing = order.status === 'PROCESSING' || order.status === 'SHIPPED' || order.status === 'DELIVERED'
  const isShipped = order.status === 'SHIPPED' || order.status === 'DELIVERED'
  const isDelivered = order.status === 'DELIVERED'

  return [
    {
      label: 'Order Placed',
      date: dateStr(order.createdAt),
      done: true
    },
    {
      label: 'Processing',
      date: isProcessing ? dateStr(order.createdAt) : 'Pending',
      done: isProcessing
    },
    {
      label: 'Shipped',
      date: isShipped ? dateStr(order.createdAt) : 'Pending',
      done: isShipped
    },
    {
      label: 'Delivered',
      date: isDelivered ? dateStr(order.createdAt) : 'Pending',
      done: isDelivered
    }
  ]
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch('/api/orders')
        if (res.ok) {
          const data = await res.json()
          setOrders(data.orders || [])
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  const selectedOrder = orders.find(o => o.id === selected)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .orders-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
        .order-timeline { display: flex; flex-direction: column; gap: 0; }
        .timeline-item { display: flex; gap: 16px; position: relative; }
        .timeline-item:not(:last-child)::after {
          content: '';
          position: absolute;
          left: 10px;
          top: 24px;
          bottom: -8px;
          width: 2px;
          background: var(--border);
        }
        .timeline-item.done::after { background: var(--success); }
        .timeline-item.danger::after { background: var(--danger); }
        .timeline-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: var(--bg-void);
          flex-shrink: 0;
          margin-top: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timeline-item.done .timeline-dot {
          border-color: var(--success);
          background: rgba(52,211,153,0.1);
        }
        .timeline-item.danger .timeline-dot {
          border-color: var(--danger);
          background: rgba(255,92,92,0.1);
        }
        .timeline-content { padding-bottom: 20px; }
        .timeline-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        [data-theme="light"] .timeline-label { color: #0a0a0b; }
        .timeline-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .order-row { cursor: pointer; transition: background 0.2s; }
        .order-row:hover { background: rgba(255,255,255,0.02) !important; }
        [data-theme="light"] .order-row:hover { background: rgba(0,0,0,0.02) !important; }
        
        /* Pulse Animation */
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
        @media (max-width: 1024px) { .orders-layout { grid-template-columns: 1fr; } }
      `}} />

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Orders</h1>
      </div>

      <div className="orders-layout">
        {/* Orders table */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Order History</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {loading ? '...' : `${orders.length} orders`}
            </span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="skeleton" style={{ width: '100%', height: 20 }} />
                <div className="skeleton" style={{ width: '100%', height: 20 }} />
                <div className="skeleton" style={{ width: '100%', height: 20 }} />
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <p style={{ fontSize: 14 }}>No orders placed yet.</p>
                <Link href="/shop" className="btn-p btn-sm" style={{ marginTop: 12, display: 'inline-block' }}>Shop Products</Link>
              </div>
            ) : (
              <table className="dtable">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Date</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    const dateStr = new Date(order.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                    const qty = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
                    return (
                      <tr
                        key={order.id}
                        className="order-row"
                        onClick={() => setSelected(selected === order.id ? null : order.id)}
                        style={{ background: selected === order.id ? 'rgba(255,211,44,0.06)' : undefined }}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          #{order.id.slice(-8).toUpperCase()}
                        </td>
                        <td>{dateStr}</td>
                        <td>{qty} item{qty !== 1 ? 's' : ''}</td>
                        <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                        <td>
                          <span className={`pill-g ${STATUS_CLASSES[order.status] || 'pill-gray'}`}>
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Order detail panel */}
        {selectedOrder ? (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Order #{selectedOrder.id.slice(-8).toUpperCase()}</span>
              <span className={`pill-g ${STATUS_CLASSES[selectedOrder.status] || 'pill-gray'}`}>
                {selectedOrder.status}
              </span>
            </div>
            <div className="panel-body">
              {/* Items */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Items</div>
                {selectedOrder.items.map((item: any, i: number) => {
                  const img = item.product?.images?.[0]?.url
                  return (
                    <div key={item.id || i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      {img ? (
                        <img src={img} alt={item.product?.name} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: 24, width: 40, textAlign: 'center' }}>🛍️</span>
                      )}
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.product?.name || 'Deleted Product'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-primary)' }}>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>Delivery Status</div>
                <div className="order-timeline">
                  {getTimeline(selectedOrder).map((step: any, i: number) => (
                    <div key={i} className={`timeline-item${step.done ? ' done' : ''}${step.isDanger ? ' danger' : ''}`}>
                      <div className="timeline-dot">
                        {step.done && (
                          <svg width="10" height="10" fill="none" stroke={step.isDanger ? 'var(--danger)' : 'var(--success)'} strokeWidth="3" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-label">{step.label}</div>
                        <div className="timeline-date">{step.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Ship To</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedOrder.address}</p>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                <button className="btn-p btn-sm" style={{ flex: 1 }}>Track Package</button>
                <button className="btn-g btn-sm">Download Invoice</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <p style={{ fontSize: 14 }}>Click an order to see details</p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
