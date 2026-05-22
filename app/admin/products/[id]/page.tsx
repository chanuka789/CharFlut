'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const TABS = ['General', 'Pricing', 'Inventory', 'Attributes', 'SEO']

interface Category {
  id: string
  name: string
  slug: string
}

interface Collection {
  id: string
  name: string
  slug: string
}

interface ProductImage {
  id: string
  url: string
  alt: string | null
  position: number
}

interface FormData {
  name: string
  slug: string
  shortDesc: string
  description: string
  price: string
  salePrice: string
  sku: string
  stock: string
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
  name: '', slug: '', shortDesc: '', description: '',
  price: '', salePrice: '', sku: '', stock: '0',
  colors: [], tags: [], categoryId: '',
  published: false, featured: false, isNew: false, isBest: false,
  metaTitle: '', metaDesc: '',
}

export default function ProductEditorPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNew = params.id === 'new'
  const [activeTab, setActiveTab] = useState(0)
  const [form, setForm] = useState<FormData>(DEFAULT_FORM)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error'>('success')
  const [tagInput, setTagInput] = useState('')
  const [colorInput, setColorInput] = useState('#')
  // pendingImages holds data URLs for unsaved new products
  const [pendingImages, setPendingImages] = useState<{ url: string; featured: boolean }[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [allCollections, setAllCollections] = useState<Collection[]>([])
  const [productCollectionIds, setProductCollectionIds] = useState<Set<string>>(new Set())
  const [images, setImages] = useState<ProductImage[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {})

    fetch('/api/collections?limit=100')
      .then(r => r.json())
      .then(data => setAllCollections((data.collections || []).map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/products/${params.id}`)
        .then(r => r.json())
        .then(data => {
          if (data && !data.error) {
            setForm({
              name: data.name || '',
              slug: data.slug || '',
              shortDesc: data.shortDesc || '',
              description: data.description || '',
              price: String(data.price || ''),
              salePrice: data.salePrice ? String(data.salePrice) : '',
              sku: data.sku || '',
              stock: String(data.stock ?? 0),
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
            setImages(data.images || [])
            const colIds = new Set<string>((data.collections || []).map((cp: any) => cp.collectionId as string))
            setProductCollectionIds(colIds)
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false))
    }
  }, [params.id, isNew])

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg)
    setToastType(type)
    setTimeout(() => setToast(''), 3500)
  }

  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  const handleNameChange = (val: string) => {
    setForm(f => ({ ...f, name: val, slug: isNew ? slugify(val) : f.slug }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('Product name is required', 'error'); return }
    if (!form.slug.trim()) { showToast('Slug is required', 'error'); return }
    if (!form.price || isNaN(parseFloat(form.price))) { showToast('Valid price is required', 'error'); return }

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
        const data = await res.json()
        if (isNew && pendingImages.length > 0) {
          await Promise.all(pendingImages.map((img, i) =>
            fetch(`/api/products/${data.id}/images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: img.url, position: img.featured ? 0 : i + 1 }),
            })
          ))
        }
        showToast(isNew ? 'Product created!' : 'Product saved!')
        if (isNew) {
          router.push(`/admin/products/${data.id}`)
        }
      } else {
        const err = await res.json()
        showToast(err.error || 'Save failed', 'error')
      }
    } catch {
      showToast('Error saving product', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleCollection = async (collectionId: string) => {
    if (isNew) { showToast('Save product first', 'error'); return }
    const inCollection = productCollectionIds.has(collectionId)
    try {
      const res = await fetch(
        `/api/collections/${collectionId}/products${inCollection ? `?productId=${params.id}` : ''}`,
        {
          method: inCollection ? 'DELETE' : 'POST',
          headers: inCollection ? undefined : { 'Content-Type': 'application/json' },
          body: inCollection ? undefined : JSON.stringify({ productId: params.id }),
        }
      )
      if (res.ok) {
        setProductCollectionIds(prev => {
          const next = new Set(prev)
          if (inCollection) next.delete(collectionId)
          else next.add(collectionId)
          return next
        })
      } else {
        showToast('Failed to update collection', 'error')
      }
    } catch {
      showToast('Error updating collection', 'error')
    }
  }

  const uploadImage = async (file: File, asFeatured = false) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error || 'Upload failed', 'error')
        return
      }
      const { url } = await res.json()
      if (!url) { showToast('Upload failed', 'error'); return }

      if (isNew) {
        // Store pending for when product is saved
        if (asFeatured) {
          setPendingImages(prev => [{ url, featured: true }, ...prev.filter(i => !i.featured)])
        } else {
          setPendingImages(prev => [...prev, { url, featured: false }])
        }
        showToast('Image ready — will be saved with the product')
      } else {
        const position = asFeatured ? 0 : images.length
        const imgRes = await fetch(`/api/products/${params.id}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, position }),
        })
        if (imgRes.ok) {
          const newImg = await imgRes.json()
          if (asFeatured) {
            setImages(prev => [newImg, ...prev.filter(i => i.position !== 0)])
          } else {
            setImages(prev => [...prev, newImg])
          }
          showToast('Image uploaded!')
        } else {
          showToast('Failed to save image', 'error')
        }
      }
    } catch {
      showToast('Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleFeaturedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadImage(file, true)
    e.target.value = ''
  }

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(f => uploadImage(f, false))
    e.target.value = ''
  }

  const deleteImage = async (imageId: string) => {
    if (!confirm('Remove this image?')) return
    const res = await fetch(`/api/products/${params.id}/images?imageId=${imageId}`, { method: 'DELETE' })
    if (res.ok) {
      setImages(prev => prev.filter(i => i.id !== imageId))
      showToast('Image removed')
    }
  }

  const addTag = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const tag = tagInput.trim().replace(/,$/, '')
      if (tag && !form.tags.includes(tag)) {
        setForm(f => ({ ...f, tags: [...f.tags, tag] }))
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

  const featuredImage = images.find(i => i.position === 0) || images[0]
  const galleryImages = images.filter(i => i !== featuredImage)
  // For new products, derive display images from pending list
  const pendingFeatured = isNew ? (pendingImages.find(i => i.featured) || pendingImages[0]) : null
  const pendingGallery = isNew ? pendingImages.filter(i => i !== pendingFeatured) : []

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>
        <div style={{ width: 36, height: 36, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        Loading product...
      </div>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .editor-layout { display: grid; grid-template-columns: 1fr 280px; gap: 24px; align-items: start; }
        .editor-tabs { display: flex; gap: 0; border-bottom: 1px solid var(--border); margin-bottom: 24px; overflow-x: auto; }
        .editor-tab {
          padding: 10px 18px; font-size: 13px; font-weight: 500; color: var(--text-muted);
          border-bottom: 2px solid transparent; cursor: pointer; transition: all 0.18s;
          white-space: nowrap; background: none; border-left: none; border-right: none;
          border-top: none; font-family: inherit;
        }
        .editor-tab:hover { color: var(--text-primary); }
        .editor-tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        .publish-status { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
        .img-thumb { position: relative; border-radius: 8px; overflow: hidden; background: rgba(255,255,255,0.04); border: 1px solid var(--border); }
        .img-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .img-thumb-del { position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 50%; background: rgba(239,68,68,0.85); border: none; cursor: pointer; color: #fff; font-size: 14px; display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.15s; line-height: 1; }
        .img-thumb:hover .img-thumb-del { opacity: 1; }
        .upload-zone { border: 2px dashed var(--border); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; cursor: pointer; color: var(--text-muted); font-size: 12px; transition: border-color 0.2s, background 0.2s; }
        .upload-zone:hover { border-color: var(--accent); background: rgba(255,211,44,0.04); }
        @media (max-width: 1024px) { .editor-layout { grid-template-columns: 1fr; } }
      `}} />

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
            <Link href={`/products/${form.slug}`} target="_blank" className="btn-g btn-sm">View</Link>
          )}
          <button className="btn-p" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className="editor-layout">
        {/* Left: tabs */}
        <div>
          <div className="editor-tabs">
            {TABS.map((tab, i) => (
              <button key={tab} className={`editor-tab${activeTab === i ? ' active' : ''}`} onClick={() => setActiveTab(i)}>
                {tab}
              </button>
            ))}
          </div>

          {/* General */}
          {activeTab === 0 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Product Name *</label>
                <input className="f-input" value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="e.g. Wireless Headphones Pro" />
              </div>
              <div className="f-group">
                <label className="f-label">Slug (URL)</label>
                <input className="f-input" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))} placeholder="wireless-headphones-pro" />
              </div>
              <div className="f-group">
                <label className="f-label">Short Description</label>
                <input className="f-input" value={form.shortDesc} onChange={e => setForm(f => ({ ...f, shortDesc: e.target.value }))} placeholder="Brief product summary shown on cards" />
              </div>
              <div className="f-group">
                <label className="f-label">Full Description</label>
                <textarea className="f-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detailed product description..." rows={6} />
              </div>
              <div className="f-group">
                <label className="f-label">Category</label>
                <select className="f-select" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                  <option value="">— No Category —</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="f-group">
                <label className="f-label">Tags (press Enter to add)</label>
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
                    placeholder={form.tags.length === 0 ? 'Add tags…' : ''}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          {activeTab === 1 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-row">
                <div className="f-group">
                  <label className="f-label">Regular Price ($) *</label>
                  <input className="f-input" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </div>
                <div className="f-group">
                  <label className="f-label">Sale Price ($)</label>
                  <input className="f-input" type="number" step="0.01" min="0" value={form.salePrice} onChange={e => setForm(f => ({ ...f, salePrice: e.target.value }))} placeholder="0.00 (optional)" />
                </div>
              </div>
              {form.salePrice && form.price && parseFloat(form.salePrice) < parseFloat(form.price) && (
                <div style={{ padding: '10px 14px', background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 10, fontSize: 13, color: 'var(--success)', marginBottom: 16 }}>
                  ✓ {((1 - parseFloat(form.salePrice) / parseFloat(form.price)) * 100).toFixed(0)}% discount applied
                </div>
              )}
              <div className="f-group">
                <label className="f-label">SKU (Stock Keeping Unit)</label>
                <input className="f-input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. WHP-BLK-001" />
              </div>
            </div>
          )}

          {/* Inventory */}
          {activeTab === 2 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Stock Quantity</label>
                <input className="f-input" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div style={{ padding: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
                {parseInt(form.stock) > 10 ? '✓ In stock' : parseInt(form.stock) > 0 ? '⚡ Low stock (under 10 units)' : '✗ Out of stock'}
              </div>
            </div>
          )}

          {/* Attributes */}
          {activeTab === 3 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Colors (enter hex code, press Enter)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                  {form.colors.map(color => (
                    <div key={color} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6, background: color, border: '2px solid var(--border)' }} />
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{color}</span>
                      <button className="chip-close" onClick={() => removeColor(color)}>×</button>
                    </div>
                  ))}
                </div>
                <input className="f-input" value={colorInput} onChange={e => setColorInput(e.target.value)} onKeyDown={addColor} placeholder="#1a1a1a — press Enter to add" maxLength={7} />
              </div>
            </div>
          )}

          {/* SEO */}
          {activeTab === 4 && (
            <div className="panel" style={{ padding: 24 }}>
              <div className="f-group">
                <label className="f-label">Meta Title</label>
                <input className="f-input" value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} placeholder={form.name || 'SEO title'} maxLength={60} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{form.metaTitle.length}/60</div>
              </div>
              <div className="f-group">
                <label className="f-label">Meta Description</label>
                <textarea className="f-textarea" value={form.metaDesc} onChange={e => setForm(f => ({ ...f, metaDesc: e.target.value }))} placeholder={form.shortDesc || 'SEO description'} maxLength={160} rows={3} />
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{form.metaDesc.length}/160</div>
              </div>
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
            {[
              { key: 'published' as const, label: 'Published', desc: 'Visible to customers', color: 'var(--success)', bg: 'rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.4)' },
              { key: 'featured' as const, label: 'Featured', desc: 'Show on homepage', color: 'var(--accent)', bg: 'rgba(255,211,44,0.25)', border: 'rgba(255,211,44,0.4)' },
              { key: 'isNew' as const, label: 'New Badge', desc: '', color: 'var(--info)', bg: 'rgba(96,165,250,0.2)', border: 'rgba(96,165,250,0.4)' },
              { key: 'isBest' as const, label: 'Bestseller', desc: '', color: 'var(--accent)', bg: 'rgba(255,211,44,0.25)', border: 'rgba(255,211,44,0.4)' },
            ].map(t => (
              <div key={t.key} className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-name">{t.label}</span>
                  {t.desc && <span className="toggle-desc">{t.desc}</span>}
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={form[t.key]} onChange={e => setForm(f => ({ ...f, [t.key]: e.target.checked }))} />
                  <div className="toggle-track" style={form[t.key] ? { background: t.bg, borderColor: t.border } : undefined} />
                  <div className="toggle-thumb" style={{ transform: form[t.key] ? 'translateX(16px)' : undefined, background: form[t.key] ? t.color : undefined }} />
                </label>
              </div>
            ))}
            <button className="btn-p" style={{ width: '100%', marginTop: 12 }} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : form.published ? 'Update' : 'Publish'}
            </button>
          </div>

          {/* Featured image */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Featured Image</div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFeaturedUpload} />
            {(featuredImage || pendingFeatured) ? (
              <div className="img-thumb" style={{ height: 180 }}>
                <img src={featuredImage?.url || pendingFeatured?.url} alt="Featured" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                {featuredImage && (
                  <button className="img-thumb-del" onClick={() => deleteImage(featuredImage.id)}>×</button>
                )}
                {pendingFeatured && !featuredImage && (
                  <button className="img-thumb-del" onClick={() => setPendingImages(prev => prev.filter(i => i !== pendingFeatured))}>×</button>
                )}
              </div>
            ) : (
              <div className="upload-zone" style={{ height: 180 }} onClick={() => fileInputRef.current?.click()}>
                {uploading ? (
                  <div style={{ width: 24, height: 24, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Click to upload</span>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>JPEG, PNG, WebP · max 4MB</span>
                  </>
                )}
              </div>
            )}
            {(featuredImage || pendingFeatured) && (
              <button className="btn-g btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => fileInputRef.current?.click()}>
                Replace image
              </button>
            )}
          </div>

          {/* Gallery */}
          <div className="panel" style={{ padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>
              Gallery ({isNew ? pendingGallery.length : galleryImages.length})
            </div>
            <input ref={galleryInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleGalleryUpload} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(isNew ? pendingGallery : galleryImages).map((img, idx) => (
                <div key={isNew ? idx : (img as ProductImage).id} className="img-thumb" style={{ aspectRatio: '1' }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button
                    className="img-thumb-del"
                    onClick={() => {
                      if (isNew) {
                        setPendingImages(prev => prev.filter(i => i !== img))
                      } else {
                        deleteImage((img as ProductImage).id)
                      }
                    }}
                  >×</button>
                </div>
              ))}
              <div
                className="upload-zone"
                style={{ aspectRatio: '1', fontSize: 20, borderRadius: 8 }}
                onClick={() => galleryInputRef.current?.click()}
              >
                +
              </div>
            </div>
          </div>

          {/* Collections */}
          {allCollections.length > 0 && (
            <div className="panel" style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Collections</div>
              {isNew && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>Save product first to assign collections.</p>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allCollections.map(col => {
                  const checked = productCollectionIds.has(col.id)
                  return (
                    <label key={col.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: isNew ? 'not-allowed' : 'pointer', opacity: isNew ? 0.5 : 1, fontSize: 13 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCollection(col.id)}
                        disabled={isNew}
                        style={{ accentColor: 'var(--accent)', width: 15, height: 15 }}
                      />
                      <span style={{ color: checked ? 'var(--text-primary)' : 'var(--text-muted)' }}>{col.name}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast ${toastType === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toastType === 'success' ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          )}
          {toast}
        </div>
      )}
    </>
  )
}
