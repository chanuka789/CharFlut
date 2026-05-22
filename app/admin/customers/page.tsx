'use client'

import { useState, useEffect } from 'react'

interface Customer {
  id: string
  name: string | null
  email: string
  createdAt: string
  _count: { orders: number }
  orders: { total: number }[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  useEffect(() => {
    fetch('/api/admin/customers')
      .then(r => r.json())
      .then(data => setCustomers(data.customers || []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = customers.filter(c => {
    const q = search.toLowerCase()
    return !q || c.email.toLowerCase().includes(q) || (c.name || '').toLowerCase().includes(q)
  })

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cust-table { width: 100%; border-collapse: collapse; }
        .cust-table th { padding: 10px 14px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); text-align: left; border-bottom: 1px solid var(--border); }
        .cust-table td { padding: 12px 14px; font-size: 13px; color: var(--text-secondary); border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
        .cust-table tr:hover td { background: rgba(255,255,255,0.02); }
        .cust-table tr:last-child td { border-bottom: none; }
        .avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,211,44,0.15); border: 1px solid rgba(255,211,44,0.3); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; color: var(--accent); }
      ` }} />

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Customers</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{customers.length} registered customers</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="panel" style={{ padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{customers.length}</div>
          </div>
          <div className="panel" style={{ padding: '10px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>With Orders</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--success)' }}>
              {customers.filter(c => c._count.orders > 0).length}
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input className="f-input" style={{ paddingLeft: 36 }} placeholder="Search customers…" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} results</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="cust-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading customers…</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
                    <p style={{ color: 'var(--text-muted)' }}>No customers found</p>
                  </td>
                </tr>
              ) : (
                paginated.map(customer => {
                  const initials = (customer.name || customer.email).substring(0, 2).toUpperCase()
                  const spent = customer.orders.reduce((s, o) => s + o.total, 0)
                  return (
                    <tr key={customer.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="avatar">{initials}</div>
                          <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{customer.name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{customer.email}</td>
                      <td>
                        <span className={`pill-g ${customer._count.orders > 0 ? 'pill-green' : 'pill-gray'}`}>
                          {customer._count.orders}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: spent > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        ${spent.toFixed(2)}
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>{fmtDate(customer.createdAt)}</td>
                    </tr>
                  )
                })
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
    </>
  )
}
