'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  stock: number
  published: boolean
  featured: boolean
  isNew: boolean
  isBest: boolean
  category?: { name: string } | null
  createdAt: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [permanentDelete, setPermanentDelete] = useState(false)
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState('')
  const perPage = 15

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products?limit=100`)
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
    fetchProducts()
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase())
  )

  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage)

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map(p => p.id)))
    }
  }

  const handleDelete = async (id: string) => {
    const message = permanentDelete
      ? 'Permanently delete this product? This cannot be undone.'
      : 'Move this product to trash?'
    if (!confirm(message)) return
    try {
      const res = await fetch(`/api/products/${id}${permanentDelete ? '?permanent=true' : ''}`, { method: 'DELETE' })
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== id))
        showToast(permanentDelete ? 'Product permanently deleted' : 'Product moved to trash')
      }
    } catch {
      showToast('Failed to delete product')
    }
  }

  const handleBulkDelete = async () => {
    const message = permanentDelete
      ? `Permanently delete ${selected.size} products? This cannot be undone.`
      : `Move ${selected.size} products to trash?`
    if (!confirm(message)) return
    for (const id of Array.from(selected)) {
      await fetch(`/api/products/${id}${permanentDelete ? '?permanent=true' : ''}`, { method: 'DELETE' })
    }
    setProducts(prev => prev.filter(p => !selected.has(p.id)))
    setSelected(new Set())
    showToast(permanentDelete ? `${selected.size} products permanently deleted` : `${selected.size} products moved to trash`)
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
        .product-status { display: flex; align-items: center; gap: 6px; }
        .status-dot { width: 7px; height: 7px; border-radius: 50%; }
        .status-dot.published { background: var(--success); }
        .status-dot.draft { background: var(--text-muted); }
        .row-actions { display: flex; gap: 6px; opacity: 0; transition: opacity 0.15s; }
        .admin-table tr:hover .row-actions { opacity: 1; }
      `}} />

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Products</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{products.length} total products</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <input
              type="checkbox"
              checked={permanentDelete}
              onChange={e => setPermanentDelete(e.target.checked)}
              style={{ accentColor: 'var(--danger)' }}
            />
            Permanent delete
          </label>
          <Link href="/admin/products/trash" className="btn-g btn-sm">Trash</Link>
          {selected.size > 0 && (
            <button className="btn-d btn-sm" onClick={handleBulkDelete}>
              {permanentDelete ? 'Delete forever' : 'Move to trash'} {selected.size}
            </button>
          )}
          <Link href="/admin/products/new" className="btn-p">+ Add Product</Link>
        </div>
      </div>

      <div className="panel">
        {/* Table header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              className="f-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search products..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
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
                    checked={selected.size === paginated.length && paginated.length > 0}
                    onChange={selectAll}
                    style={{ accentColor: 'var(--accent)' }}
                  />
                </th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Tags</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    Loading products...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48 }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                    <p style={{ color: 'var(--text-muted)' }}>No products found</p>
                    <Link href="/admin/products/new" className="btn-p btn-sm" style={{ marginTop: 16 }}>Add First Product</Link>
                  </td>
                </tr>
              ) : (
                paginated.map(product => (
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
                    <td>{product.category?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>${(product.salePrice || product.price).toFixed(2)}</div>
                      {product.salePrice && <div style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--text-muted)' }}>${product.price.toFixed(2)}</div>}
                    </td>
                    <td>
                      <span style={{ color: product.stock === 0 ? 'var(--danger)' : product.stock < 5 ? 'var(--warning)' : 'var(--success)', fontWeight: 600 }}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <div className="product-status">
                        <div className={`status-dot${product.published ? ' published' : ' draft'}`} />
                        {product.published ? 'Published' : 'Draft'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {product.isBest && <span className="pill-g pill-yellow">Best</span>}
                        {product.isNew && <span className="pill-g pill-blue">New</span>}
                        {product.featured && <span className="pill-g pill-green">Featured</span>}
                        {product.salePrice && <span className="pill-g pill-red">Sale</span>}
                      </div>
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link href={`/admin/products/${product.id}`} className="btn-g btn-xs">Edit</Link>
                        <button className="btn-d btn-xs" onClick={() => handleDelete(product.id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-g btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                <button
                  key={i + 1}
                  className={`btn-g btn-sm${page === i + 1 ? '' : ''}`}
                  style={page === i + 1 ? { background: 'rgba(255,211,44,0.12)', borderColor: 'var(--accent)', color: 'var(--accent)' } : undefined}
                  onClick={() => setPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button className="btn-g btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            </div>
          </div>
        )}
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
