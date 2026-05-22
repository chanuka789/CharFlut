'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  stock: number
  published: boolean
  category?: { name: string } | null
  deletedAt?: string | null
}

export default function AdminProductsTrashPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchTrash = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/products?trash=true&limit=200')
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
      }
    } catch {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrash()
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(p => p.id)))
    }
  }

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'restore' }),
    })

    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      showToast('Product restored')
    } else {
      showToast('Failed to restore product')
    }
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('Permanently delete this product? This cannot be undone.')) return
    const res = await fetch(`/api/products/${id}?permanent=true`, { method: 'DELETE' })

    if (res.ok) {
      setProducts(prev => prev.filter(p => p.id !== id))
      setSelected(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      showToast('Product permanently deleted')
    } else {
      showToast('Failed to permanently delete product')
    }
  }

  const handleBulkPermanentDelete = async () => {
    if (!confirm(`Permanently delete ${selected.size} products? This cannot be undone.`)) return

    for (const id of Array.from(selected)) {
      await fetch(`/api/products/${id}?permanent=true`, { method: 'DELETE' })
    }

    setProducts(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
    showToast('Selected products permanently deleted')
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .admin-table-wrap { overflow-x: auto; }
        .admin-table { width: 100%; border-collapse: collapse; }
        .admin-table th {
          padding: 10px 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-muted);
          text-align: left;
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .admin-table td {
          padding: 13px 14px;
          font-size: 13px;
          color: var(--text-secondary);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          vertical-align: middle;
        }
        .admin-table tr:hover td { background: rgba(255,255,255,0.02); color: var(--text-primary); }
        .admin-table tr:last-child td { border-bottom: none; }
        .row-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.15s; }
        .admin-table tr:hover .row-actions { opacity: 1; }
      `}} />

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Product Trash</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{products.length} deleted products</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selected.size > 0 && (
            <button className="btn-d btn-sm" onClick={handleBulkPermanentDelete}>
              Delete forever {selected.size}
            </button>
          )}
          <Link href="/admin/products" className="btn-g btn-sm">Back to Products</Link>
        </div>
      </div>

      <div className="panel">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="f-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search trash..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{filtered.length} results</span>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={selectAll}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Deleted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Loading trash...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 34, marginBottom: 12 }}>Trash is empty</div>
                    <p style={{ color: 'var(--text-muted)' }}>Deleted products will appear here before permanent removal.</p>
                  </td>
                </tr>
              ) : (
                filtered.map(product => (
                  <tr key={product.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        style={{ accentColor: 'var(--accent)' }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{product.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{product.slug}</div>
                    </td>
                    <td>{product.category?.name || '-'}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>${(product.salePrice || product.price).toFixed(2)}</div>
                    </td>
                    <td>{product.stock}</td>
                    <td>{product.deletedAt ? new Date(product.deletedAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-g btn-xs" onClick={() => handleRestore(product.id)}>Restore</button>
                        <button className="btn-d btn-xs" onClick={() => handlePermanentDelete(product.id)}>Delete forever</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
