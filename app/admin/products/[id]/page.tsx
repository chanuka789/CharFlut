'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TABS = ['General', 'Pricing', 'Inventory', 'Shipping', 'Attributes', 'Linked', 'SEO', 'Advanced']

const CATEGORIES = ['Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Accessories', 'Sports']

interface FormData {
  name: string
  slug: string
  shortDesc: string
  description: string
  price: string
  salePrice: string
  sku: string
  stock: string
  weight: string
  colors: string[]
  tags: string[]
  categoryId: string
  published: boolean
  featured: boolean
  isNew: boolean
  isBest: boolean
  metaTitle: string
  metaDesc: string
}

const DEFAULT_FORM: FormData = {
  name: '',
  slug: '',
  shortDesc: '',
  description: '',
  price: '',
  salePrice: '',
  sku: '',
  stock: '0',
  weight: '',
  colors: [],
  tags: [],
  categoryId: '',
  published: false,
  featured: false,
  isNew: false,
  isBest: false,
  metaTitle: '',
  metaDesc: '',
}

export default function ProductEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'
  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [colorInput, setColorInput] = useState('#')

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/products/${params.id}`)
        .then(r => r.json())
        .then(data => {
          if (data) {
            setForm({
              name: data.name || '',
              slug: data.slug || '',
              shortDesc: data.shortDesc || '',
              description: data.description || '',
              price: String(data.price || ''),
              salePrice: String(data.salePrice || ''),
              sku: data.sku || '',
              stock: String(data.stock || 0),
              weight: '',
              colors: data.colors || [],
              tags: data.tags || [],
              categoryId: data.categoryId || '',
              published: data.published || false,
              featured: data.featured || false,
              isNew: data.isNew || false,
              isBest: data.isBest || false,
              metaTitle: '',
              metaDesc: '',
            })
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [params.id, isNew])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, name: val, slug: isNew ? slugify(val) : f.slug }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        shortDesc: form.shortDesc,
        description: form.description,
        price: parseFloat(form.price) || 0,
        salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
        sku: form.sku,
        stock: parseInt(form.stock) || 0,
        colors: form.colors,
        tags: form.tags,
        categoryId: form.categoryId || null,
        published: form.published,
        featured: form.featured,
        isNew: form.isNew,
        isBest: form.isBest,
      }

      const url = isNew ? '/api/products' : `/api/products/${params.id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        showToast(isNew ? 'Product created!' : 'Product saved!')
        if (isNew) {
          const data = await res.json()
          router.push(`/admin/products/${data.id}`)
        }
      } else {
        showToast('Save failed. Please try again.')
      }
    } catch {
      showToast('Error saving product')
    } finally {
      setSaving(false)
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      if (!form.tags.includes(tagInput.trim())) {
        setForm(f => ({ ...f, tags: [...f.tags, tagInput.trim()] }))
      }
      setTagInput('')
    }
  }

  const removeTag = (tag: string) => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))

  const addColor = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && colorInput.match(/^#[0-9a-fA-F]{6}$/)) {
      if (!form.colors.includes(colorInput)) {
        setForm(f => ({ ...f, colors: [...f.colors, colorInput] }))
      }
      setColorInput('#')
    }
  }

  const removeColor = (color: string) => setForm(f => ({ ...f, colors: f.colors.filter(c => c !== color) }))

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        Loading...
      </div>
    )
  }

  return (
    <>
      <style>{`
        .editor-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
        .editor-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; overflow-x: auto; }
        .editor-tab {
          padding: 10px 18px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-muted);
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          font-family: inherit;
        }
        .editor-tab:hover { color: var(--text-primary); }
        .editor-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        .publish-widget { padding: 16px 0; }
        .publish-status { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        @media (max-width: 1024px) { .editor-layout { grid-template-columns: 1fr; } }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Link href="/admin/products" style={{ color: 'var(--text-muted)', fontSize: 13 }}>Products</Link>
            <span style={{ color: 'var(--text-muted)' }}>›</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{isNew ? 'New Product' : form.name || 'Edit Product'}</span>
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 700 }}>{isNew ? 'Add New Product' : 'Edit Product'}</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!isNew && (
            <Link href={`/products/${form.slug}`} target="_blank" className="btn-g btn-sm">
              View
            </Link>
          )}
          <button className="btn-p" onClick={handleSave} disabled={saving}>
            {saving ? '...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Left: tabs */}
        <div>
          <div className="editor-tabs">
            {TABS.map((tab, i) => (
              <button
                key={tab}
                className={`editor-tab${activeTab === i ? ' active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* General tab */}
          {activeTab === 0 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Product Name *</label>
                <input
                  className="f-input"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Wireless Headphones Pro"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Slug (URL)</label>
                <input
                  className="f-input"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="wireless-headphones-pro"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Short Description</label>
                <input
                  className="f-input"
                  value={form.shortDesc}
                  onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))}
                  placeholder="Brief product summary (for cards)"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Full Description</label>
                <textarea
                  className="f-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detailed product description..."
                  rows={6}
                />
              </div>
              <div className="f-group">
                <label className="f-label">Category</label>
                <select
                  className="f-select"
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">— Select Category —</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label">Tags (Enter to add)</label>
                <div className="tag-input-wrap">
                  {form.tags.map(tag => (
                    <span key={tag} className="chip chip-yellow">
                      {tag}
                      <button className="chip-close" onClick={() => removeTag(tag)}>×</button>
                    </span>
                  ))}
                  <input
                    className="tag-input-inner"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={addTag}
                    placeholder={form.tags.length === 0 ? 'Add tags...' : 'More tags...'}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing tab */}
          {activeTab === 1 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-row">
                <div className="f-group">
                  <label className="f-label">Regular Price ($) *</label>
                  <input
                    className="f-input"
                    type="number"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="f-group">
                  <label className="f-label">Sale Price ($)</label>
                  <input
                    className="f-input"
                    type="number"
                    step="0.01"
                    value={form.salePrice}
                    onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))}
                    placeholder="0.00 (optional)"
                  />
                </div>
              </div>
              {form.salePrice && form.price && parseFloat(form.salePrice) < parseFloat(form.price) && (
                <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>
                  ✓ Discount: {((1 - parseFloat(form.salePrice) / parseFloat(form.price)) * 100).toFixed(0)}% off
                </div>
              )}
              <div className="f-group">
                <label className="f-label">SKU (Stock Keeping Unit)</label>
                <input
                  className="f-input"
                  value={form.sku}
                  onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                  placeholder="e.g. WHP-BLK-001"
                />
              </div>
            </div>
          )}

          {/* Inventory tab */}
          {activeTab === 2 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Stock Quantity</label>
                <input
                  className="f-input"
                  type="number"
                  value={form.stock}
                  onChange={e => setForm(f => ({ ...f, stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                {parseInt(form.stock) > 10 ? '✓ In stock' : parseInt(form.stock) > 0 ? '⚡ Low stock' : '✗ Out of stock'}
              </div>
            </div>
          )}

          {/* Attributes tab */}
          {activeTab === 4 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Colors (Enter hex code)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {form.colors.map(color => (
                    <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: '2px solid var(--border)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{color}</span>
                      <button className="chip-close" onClick={() => removeColor(color)}>×</button>
                    </div>
                  ))}
                </div>
                <input
                  className="f-input"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={addColor}
                  placeholder="#1a1a1a — press Enter to add"
                  maxLength={7}
                />
              </div>
            </div>
          )}

          {/* SEO tab */}
          {activeTab === 6 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Meta Title</label>
                <input
                  className="f-input"
                  value={form.metaTitle}
                  onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                  placeholder={form.name || 'SEO title'}
                  maxLength={60}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{form.metaTitle.length}/60 characters</div>
              </div>
              <div className="f-group">
                <label className="f-label">Meta Description</label>
                <textarea
                  className="f-textarea"
                  value={form.metaDesc}
                  onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))}
                  placeholder={form.shortDesc || 'SEO description'}
                  maxLength={160}
                  rows={3}
                />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{form.metaDesc.length}/160 characters</div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {[3, 5, 7].includes(activeTab) && (
            <div className="panel" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🚧</div>
              <p>Configure {TABS[activeTab]} settings here</p>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Publish widget */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Publish</div>
            <div className="publish-status">
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Status</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: form.published ? 'var(--success)' : 'var(--text-muted)' }}>
                {form.published ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="publish-widget">
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-name">Published</span>
                  <span className="toggle-desc">Visible to customers</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                  <div className="toggle-track" style={form.published ? { background: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.4)' } : undefined} />
                  <div className="toggle-thumb" style={{ transform: form.published ? 'translateX(16px)' : undefined, background: form.published ? 'var(--success)' : undefined }} />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-name">Featured</span>
                  <span className="toggle-desc">Show on homepage</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} />
                  <div className="toggle-track" style={form.featured ? { background: 'rgba(255,211,44,0.25)', borderColor: 'rgba(255,211,44,0.4)' } : undefined} />
                  <div className="toggle-thumb" style={{ transform: form.featured ? 'translateX(16px)' : undefined, background: form.featured ? 'var(--accent)' : undefined }} />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-name">New Badge</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.isNew} onChange={e => setForm(f => ({ ...f, isNew: e.target.checked }))} />
                  <div className="toggle-track" style={form.isNew ? { background: 'rgba(96,165,250,0.2)', borderColor: 'rgba(96,165,250,0.4)' } : undefined} />
                  <div className="toggle-thumb" style={{ transform: form.isNew ? 'translateX(16px)' : undefined, background: form.isNew ? 'var(--info)' : undefined }} />
                </label>
              </div>
              <div className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-name">Bestseller Badge</span>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form.isBest} onChange={e => setForm(f => ({ ...f, isBest: e.target.checked }))} />
                  <div className="toggle-track" style={form.isBest ? { background: 'rgba(255,211,44,0.25)', borderColor: 'rgba(255,211,44,0.4)' } : undefined} />
                  <div className="toggle-thumb" style={{ transform: form.isBest ? 'translateX(16px)' : undefined, background: form.isBest ? 'var(--accent)' : undefined }} />
                </label>
              </div>
            </div>
            <button className="btn-p" style={{ width: '100%', marginTop: 8 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : form.published ? 'Update' : 'Publish'}
            </button>
          </div>

          {/* Featured image */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Featured Image</div>
            <div style={{ aspect: '1', height: 180, borderRadius: 12, background: 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))', border: '2px dashed var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 12 }}>
              <span style={{ fontSize: 32 }}>🖼️</span>
              <span>Click to upload</span>
            </div>
          </div>

          {/* Gallery */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Gallery Images</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>
                  +
                </div>
              ))}
            </div>
          </div>
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
