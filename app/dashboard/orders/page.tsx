'use client'

import { useState } from 'react'

const ORDERS = [
  {
    id: '#CF-001',
    date: 'May 18, 2026',
    status: 'Delivered',
    total: 429.98,
    items: [
      { name: 'Minimal Wireless Headphones', price: 299.00, qty: 1, emoji: '⚡' },
      { name: 'Premium Leather Bag', qty: 1, price: 130.98, emoji: '👜' },
    ],
    timeline: [
      { label: 'Order Placed', date: 'May 12, 2026', done: true },
      { label: 'Processing', date: 'May 13, 2026', done: true },
      { label: 'Shipped', date: 'May 15, 2026', done: true },
      { label: 'Delivered', date: 'May 18, 2026', done: true },
    ],
    address: '123 Main St, New York, NY 10001',
  },
  {
    id: '#CF-002',
    date: 'May 10, 2026',
    status: 'Shipped',
    total: 299.00,
    items: [{ name: 'Smart Watch Pro', qty: 1, price: 299.00, emoji: '⌚' }],
    timeline: [
      { label: 'Order Placed', date: 'May 8, 2026', done: true },
      { label: 'Processing', date: 'May 9, 2026', done: true },
      { label: 'Shipped', date: 'May 10, 2026', done: true },
      { label: 'Delivered', date: 'Est. May 22', done: false },
    ],
    address: '456 Oak Ave, Brooklyn, NY 11201',
  },
  {
    id: '#CF-003',
    date: 'Apr 28, 2026',
    status: 'Processing',
    total: 189.99,
    items: [
      { name: 'Minimalist Desk Lamp', qty: 1, price: 89.99, emoji: '💡' },
      { name: 'Organic Cotton Tee', qty: 2, price: 100.00, emoji: '👕' },
    ],
    timeline: [
      { label: 'Order Placed', date: 'Apr 28, 2026', done: true },
      { label: 'Processing', date: 'Apr 28, 2026', done: true },
      { label: 'Shipped', date: 'Pending', done: false },
      { label: 'Delivered', date: 'Est. May 25', done: false },
    ],
    address: '789 Pine St, Manhattan, NY 10012',
  },
]

const STATUS_CLASSES: Record<string, string> = {
  Delivered: 'pill-green',
  Shipped: 'pill-blue',
  Processing: 'pill-yellow',
  Pending: 'pill-gray',
  Cancelled: 'pill-red',
}

export default function OrdersPage() {
  const [selected, setSelected] = useState<string | null>(null)

  const selectedOrder = ORDERS.find(o => o.id === selected)

  return (
    <>
      <style>{`
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
        .timeline-content { padding-bottom: 20px; }
        .timeline-label { font-size: 13px; font-weight: 600; color: var(--text-primary); }
        [data-theme="light"] .timeline-label { color: #0a0a0b; }
        .timeline-date { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .order-row { cursor: pointer; }
        @media (max-width: 1024px) { .orders-layout { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Orders</h1>
      </div>

      <div className="orders-layout">
        {/* Orders table */}
        <div className="panel">
          <div className="panel-header">
            <span className="panel-title">Order History</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ORDERS.length} orders</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
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
                {ORDERS.map(order => (
                  <tr
                    key={order.id}
                    className="order-row"
                    onClick={() => setSelected(selected === order.id ? null : order.id)}
                    style={{ background: selected === order.id ? 'rgba(255,211,44,0.04)' : undefined }}
                  >
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{order.id}</td>
                    <td>{order.date}</td>
                    <td>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</td>
                    <td style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>${order.total.toFixed(2)}</td>
                    <td>
                      <span className={`pill-g ${STATUS_CLASSES[order.status]}`}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order detail panel */}
        {selectedOrder ? (
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Order {selectedOrder.id}</span>
              <span className={`pill-g ${STATUS_CLASSES[selectedOrder.status]}`}>{selectedOrder.status}</span>
            </div>
            <div className="panel-body">
              {/* Items */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 12 }}>Items</div>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < selectedOrder.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <span style={{ fontSize: 28, width: 40, textAlign: 'center' }}>{item.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty: {item.qty}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-primary)' }}>${item.price.toFixed(2)}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, fontWeight: 700 }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--accent-primary)' }}>${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Timeline */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>Delivery Status</div>
                <div className="order-timeline">
                  {selectedOrder.timeline.map((step, i) => (
                    <div key={i} className={`timeline-item${step.done ? ' done' : ''}`}>
                      <div className="timeline-dot">
                        {step.done && (
                          <svg width="10" height="10" fill="none" stroke="var(--success)" strokeWidth="3" viewBox="0 0 24 24">
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
