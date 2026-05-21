'use client'

import { useState, useEffect } from 'react'

interface Collection {
  id: string
  name: string
  slug: string
  tagline?: string | null
  description?: string | null
  gradient?: string | null
  published: boolean
  featured: boolean
  _count?: { products: number }
}

const GRADIENTS = [
  'linear-gradient(135deg, rgba(255,211,44,0.2) 0%, rgba(124,58,237,0.15) 100%)',
  'linear-gradient(135deg, rgba(0,194,255,0.2) 0%, rgba(124,58,237,0.15) 100%)',
  'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(0,194,255,0.15) 100%)',
  'linear-gradient(135deg, rgba(244,114,182,0.2) 0%, rgba(249,168,212,0.15) 100%)',
  'linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(52,211,153,0.15) 100%)',
  'linear-gradient(135deg, rgba(251,191,36,0.2) 0%, rgba(245,158,11,0.15) 100%)',
]

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({
    name: '', slug: '', tagline: '', description: '', published: true, featured: false,
    gradient: GRADIENTS[0], curator: '', tag: '',
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const slugify = (str: string) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  useEffect(() => {
    fetch('/api/collections?limit=100')
      .then(r => r.json())
      .then(data => setCollections(data.collections || []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false))
  }, [])

  const openCreate = () => {
    setForm({ name: '', slug: '', tagline: '', description: '', published: true, featured: false, gradient: GRADIENTS[0], curator: '', tag: '' })
    setEditId(null)
    setShowModal(true)
  }

  const openEdit = (col: Collection) => {
    setForm({
      name: col.name,
      slug: col.slug,
      tagline: col.tagline || '',
      description: col.description || '',
      published: col.published,
      featured: col.featured,
      gradient: col.gradient || GRADIENTS[0],
      curator: '',
      tag: '',
    })
    setEditId(col.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    try {
      const body = { ...form }
      const url = editId ? `/api/collections/${editId}` : '/api/collections'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        const saved = await res.json()
        if (editId) {
          setCollections(prev => prev.map(c => c.id === editId ? { ...c, ...saved } : c))
        } else {
          setCollections(prev => [...prev, saved])
        }
        setShowModal(false)
        showToast(editId ? 'Collection updated!' : 'Collection created!')
      } else {
        showToast('Save failed')
      }
    } catch {
      showToast('Error saving collection')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this collection?')) return
    await fetch(`/api/collections/${id}`, { method: 'DELETE' })
    setCollections(prev => prev.filter(c => c.id !== id))
    showToast('Collection deleted')
  }

  return (
    <>
      <style>{`
        .collections-admin-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .coll-admin-card { border-radius: 20px; overflow: hidden; }
        .coll-card-header { height: 120px; display: flex; align-items: center; justify-content: center; font-size: 48px; }
        .coll-card-body { padding: 16px; }
        .gradient-picker { display: flex; gap: 6px; flex-wrap: wrap; }
        .grad-option { width: 28px; height: 28px; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: border-color 0.15s; }
        .grad-option.active { border-color: var(--accent); }
        @media (max-width: 1200px) { .collections-admin-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .collections-admin-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Collections</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{collections.length} collections</p>
        </div>
        <button className="btn-p" onClick={openCreate}>+ New Collection</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-muted)' }}>Loading...</div>
      ) : (
        <div className="collections-admin-grid">
          {collections.map((col, i) => (
            <div key={col.id} className="coll-admin-card panel">
              <div
                className="coll-card-header"
                style={{ background: col.gradient || GRADIENTS[i % GRADIENTS.length] }}
              >
                {['✦', '★', '◆', '●', '⚡', '🌟'][i % 6]}
              </div>
              <div className="coll-card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{col.name}</div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {col.published ? <span className="pill-g pill-green">Live</span> : <span className="pill-g pill-gray">Draft</span>}
                    {col.featured && <span className="pill-g pill-yellow">Featured</span>}
                  </div>
                </div>
                {col.tagline && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{col.tagline}</p>}
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
                  {col._count?.products || 0} products
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-g btn-sm" style={{ flex: 1 }} onClick={() => openEdit(col)}>Edit</button>
                  <button className="btn-d btn-sm" onClick={() => handleDelete(col.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}

          <button
            className="panel"
            onClick={openCreate}
            style={{ padding: 24, cursor: 'pointer', background: 'transparent', border: '2px dashed var(--border)', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 20, fontSize: 14, fontFamily: 'inherit', minHeight: 200 }}
          >
            <span style={{ fontSize: 40 }}>+</span>
            New Collection
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="panel-header">
              <span className="panel-title">{editId ? 'Edit Collection' : 'New Collection'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
            </div>
            <div className="panel-body">
              <div className="f-group">
                <label className="f-label">Collection Name *</label>
                <input
                  className="f-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: editId ? f.slug : slugify(e.target.value) }))}
                  placeholder="e.g. Summer Essentials"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Slug (URL)</label>
                <input
                  className="f-input"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
                  placeholder="summer-essentials"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Tagline</label>
                <input
                  className="f-input"
                  value={form.tagline}
                  onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
                  placeholder="Short catchy tagline"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Description</label>
                <textarea
                  className="f-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Collection description..."
                  rows={3}
                />
              </div>
              <div className="f-group">
                <label className="f-label">Curator</label>
                <input
                  className="f-input"
                  value={form.curator}
                  onChange={e => setForm(f => ({ ...f, curator: e.target.value }))}
                  placeholder="e.g. CharFlut Team"
                />
              </div>
              <div className="f-group">
                <label className="f-label">Background Gradient</label>
                <div className="gradient-picker">
                  {GRADIENTS.map((grad, i) => (
                    <div
                      key={i}
                      className={`grad-option${form.gradient === grad ? ' active' : ''}`}
                      style={{ background: grad }}
                      onClick={() => setForm(f => ({ ...f, gradient: grad }))}
                    />
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
                  Published
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
                  Featured
                </label>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn-p" style={{ flex: 1 }} onClick={handleSave}>{editId ? 'Save Changes' : 'Create Collection'}</button>
                <button className="btn-g" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
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
