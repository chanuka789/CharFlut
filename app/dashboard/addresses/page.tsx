'use client'

import { useState, useEffect } from 'react'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    isDefault: false
  })
  const [toast, setToast] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const fetchAddresses = async () => {
    try {
      const res = await fetch('/api/addresses')
      if (res.ok) {
        const data = await res.json()
        setAddresses(data.addresses || [])
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const openAdd = () => {
    setForm({
      name: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      zip: '',
      country: 'United States',
      isDefault: addresses.length === 0 // If it's the first address, make default
    })
    setEditingId(null)
    setErrorMsg('')
    setShowModal(true)
  }

  const openEdit = (addr: any) => {
    setForm({
      name: addr.name,
      line1: addr.line1,
      line2: addr.line2 || '',
      city: addr.city,
      state: addr.state || '',
      zip: addr.zip,
      country: addr.country,
      isDefault: addr.isDefault
    })
    setEditingId(addr.id)
    setErrorMsg('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.line1 || !form.city || !form.zip || !form.country) {
      setErrorMsg('Please fill in all required fields.')
      return
    }

    try {
      const payload: any = {
        name: form.name,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        zip: form.zip,
        country: form.country,
        isDefault: form.isDefault
      }

      if (editingId) {
        payload.id = editingId
      }

      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        showToast(editingId ? 'Address updated successfully!' : 'Address added successfully!')
        setShowModal(false)
        fetchAddresses()
      } else {
        const errData = await res.json()
        setErrorMsg(errData.error || 'Failed to save address.')
      }
    } catch (err) {
      setErrorMsg('A network error occurred. Please try again.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" address?`)) return
    try {
      const res = await fetch(`/api/addresses?id=${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        showToast('Address deleted successfully.')
        fetchAddresses()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSetDefault = async (addr: any) => {
    try {
      const res = await fetch('/api/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: addr.id,
          name: addr.name,
          line1: addr.line1,
          line2: addr.line2,
          city: addr.city,
          state: addr.state,
          zip: addr.zip,
          country: addr.country,
          isDefault: true
        })
      })
      if (res.ok) {
        showToast(`Set "${addr.name}" as default address.`)
        fetchAddresses()
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .address-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .address-card { padding: 20px; border-radius: 18px; position: relative; display: flex; flex-direction: column; justify-content: space-between; min-height: 170px; }
        .default-badge { position: absolute; top: 16px; right: 16px; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 700; background: rgba(255,211,44,0.12); color: var(--accent); border: 1px solid rgba(255,211,44,0.2); }
        .address-name { font-size: 16px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
        [data-theme="light"] .address-name { color: #0a0a0b; }
        .address-line { font-size: 13px; color: var(--text-secondary); line-height: 1.6; flex: 1; }
        .address-actions { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
        
        /* Pulse Animation */
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
          background: rgba(255,255,255,0.06);
          border-radius: 18px;
        }
        [data-theme="light"] .skeleton {
          background: rgba(0,0,0,0.04);
        }
        @media (max-width: 768px) { .address-grid { grid-template-columns: 1fr; } }
      ` }} />

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Saved Addresses</h1>
        <button className="btn-p" onClick={openAdd}>
          + Add Address
        </button>
      </div>

      <div className="address-grid">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180 }} />
          ))
        ) : (
          <>
            {addresses.map(addr => (
              <div key={addr.id} className="address-card panel">
                <div>
                  {addr.isDefault && <span className="default-badge">Default</span>}
                  <div className="address-name">{addr.name}</div>
                  <p className="address-line">
                    {addr.line1}
                    {addr.line2 && <><br />{addr.line2}</>}
                    <br />
                    {addr.city}, {addr.state ? `${addr.state} ` : ''}{addr.zip}
                    <br />
                    {addr.country}
                  </p>
                </div>
                <div className="address-actions">
                  <button className="btn-g btn-sm" onClick={() => openEdit(addr)}>Edit</button>
                  {!addr.isDefault && (
                    <button className="btn-g btn-sm" onClick={() => handleSetDefault(addr)}>
                      Set Default
                    </button>
                  )}
                  <button className="btn-d btn-sm" onClick={() => handleDelete(addr.id, addr.name)}>Remove</button>
                </div>
              </div>
            ))}

            <button
              className="panel"
              onClick={openAdd}
              style={{ padding: 24, border: '2px dashed var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 18, fontSize: 14, fontFamily: 'inherit', minHeight: 170 }}
            >
              <span style={{ fontSize: 32 }}>+</span>
              Add New Address
            </button>
          </>
        )}
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
              {errorMsg && (
                <div style={{ padding: '8px 12px', background: 'rgba(255,92,92,0.1)', border: '1px solid rgba(255,92,92,0.2)', borderRadius: 8, color: 'var(--danger)', fontSize: 12, marginBottom: 16 }}>
                  {errorMsg}
                </div>
              )}
              <div className="f-group">
                <label className="f-label">Label (Home, Office, etc.) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="f-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Home" required />
              </div>
              <div className="f-group">
                <label className="f-label">Street Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="f-input" value={form.line1} onChange={e => setForm(f => ({ ...f, line1: e.target.value }))} placeholder="123 Main Street" required />
              </div>
              <div className="f-group">
                <label className="f-label">Apt, Suite, etc. (optional)</label>
                <input className="f-input" value={form.line2} onChange={e => setForm(f => ({ ...f, line2: e.target.value }))} placeholder="Apt 4B" />
              </div>
              <div className="f-row">
                <div className="f-group" style={{ flex: 1 }}>
                  <label className="f-label">City <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="f-input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="New York" required />
                </div>
                <div className="f-group" style={{ flex: 1 }}>
                  <label className="f-label">State</label>
                  <input className="f-input" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="NY" />
                </div>
              </div>
              <div className="f-row">
                <div className="f-group" style={{ flex: 1 }}>
                  <label className="f-label">ZIP Code <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input className="f-input" value={form.zip} onChange={e => setForm(f => ({ ...f, zip: e.target.value }))} placeholder="10001" required />
                </div>
                <div className="f-group" style={{ flex: 1 }}>
                  <label className="f-label">Country <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <select className="f-select" value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))}>
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
              <div className="f-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                <input type="checkbox" id="isDefault" checked={form.isDefault} disabled={editingId ? addresses.find(a => a.id === editingId)?.isDefault : false} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
                <label htmlFor="isDefault" style={{ fontSize: 13, userSelect: 'none' }}>Set as default shipping address</label>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button className="btn-p" style={{ flex: 1 }} onClick={handleSave}>
                  {editingId ? 'Save Changes' : 'Add Address'}
                </button>
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
