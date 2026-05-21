'use client'

import { useState } from 'react'

const ADDRESSES = [
  { id: '1', name: 'Home', line1: '123 Main Street', city: 'New York', state: 'NY', zip: '10001', country: 'United States', isDefault: true },
  { id: '2', name: 'Office', line1: '456 Park Avenue', city: 'New York', state: 'NY', zip: '10022', country: 'United States', isDefault: false },
]

export default function AddressesPage() {
  const [addresses, setAddresses] = useState(ADDRESSES)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'United States' })

  const openAdd = () => {
    setForm({ name: '', line1: '', line2: '', city: '', state: '', zip: '', country: 'United States' })
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (addr: typeof ADDRESSES[0]) => {
    setForm({ name: addr.name, line1: addr.line1, line2: '', city: addr.city, state: addr.state || '', zip: addr.zip, country: addr.country })
    setEditingId(addr.id)
    setShowModal(true)
  }

  const handleSave = () => {
    if (editingId) {
      setAddresses(prev => prev.map(a => a.id === editingId ? { ...a, ...form } : a))
    } else {
      setAddresses(prev => [...prev, { id: String(Date.now()), ...form, isDefault: false }])
    }
    setShowModal(false)
  }

  return (
    <>
      <style>{`
        .address-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .address-card { padding: 20px; border-radius: 18px; position: relative; }
        .default-badge { position: absolute; top: 16px; right: 16px; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; background: rgba(255,211,44,0.12); color: var(--accent); border: 1px solid rgba(255,211,44,0.2); }
        .address-name { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
        [data-theme="light"] .address-name { color: #0a0a0b; }
        .address-line { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        .address-actions { display: flex; gap: 8px; margin-top: 16px; }
        @media (max-width: 768px) { .address-grid { grid-template-columns: 1fr; } }
      `}</style>

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Saved Addresses</h1>
        <button className="btn-p" onClick={openAdd}>
          + Add Address
        </button>
      </div>

      <div className="address-grid">
        {addresses.map(addr => (
          <div key={addr.id} className="address-card panel">
            {addr.isDefault && <span className="default-badge">Default</span>}
            <div className="address-name">{addr.name}</div>
            <p className="address-line">
              {addr.line1}<br />
              {addr.city}, {addr.state} {addr.zip}<br />
              {addr.country}
            </p>
            <div className="address-actions">
              <button className="btn-g btn-sm" onClick={() => openEdit(addr)}>Edit</button>
              {!addr.isDefault && (
                <button className="btn-g btn-sm" onClick={() => setAddresses(prev => prev.map(a => ({ ...a, isDefault: a.id === addr.id })))}>
                  Set Default
                </button>
              )}
              <button className="btn-d btn-sm" onClick={() => setAddresses(prev => prev.filter(a => a.id !== addr.id))}>Remove</button>
            </div>
          </div>
        ))}

        <button
          className="panel"
          onClick={openAdd}
          style={{ padding: 24, border: '2px dashed var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 18, fontSize: 14, fontFamily: 'inherit', minHeight: 160 }}
        >
          <span style={{ fontSize: 32 }}>+</span>
          Add New Address
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="panel-header" style={{ borderRadius: '22px 22px 0 0' }}>
              <span className="panel-title">{editingId ? 'Edit Address' : 'New Address'}</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
            </div>
            <div className="panel-body">
              <div className="f-group">
                <label className="f-label">Label (Home, Office, etc.)</label>
                <input className="f-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Home" />
              </div>
              <div className="f-group">
                <label className="f-label">Street Address</label>
                <input className="f-input" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} placeholder="123 Main Street" />
              </div>
              <div className="f-group">
                <label className="f-label">Apt, Suite, etc. (optional)</label>
                <input className="f-input" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} placeholder="Apt 4B" />
              </div>
              <div className="f-row">
                <div className="f-group">
                  <label className="f-label">City</label>
                  <input className="f-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" />
                </div>
                <div className="f-group">
                  <label className="f-label">State</label>
                  <input className="f-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="NY" />
                </div>
              </div>
              <div className="f-row">
                <div className="f-group">
                  <label className="f-label">ZIP Code</label>
                  <input className="f-input" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="10001" />
                </div>
                <div className="f-group">
                  <label className="f-label">Country</label>
                  <select className="f-select" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn-p" style={{ flex: 1 }} onClick={handleSave}>
                  {editingId ? 'Save Changes' : 'Add Address'}
                </button>
                <button className="btn-g" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
