'use client'

import { useState } from 'react'

const CARDS = [
  { id: '1', brand: 'Visa', last4: '4242', expiry: '12/27', isDefault: true },
  { id: '2', brand: 'Mastercard', last4: '5555', expiry: '08/26', isDefault: false },
]

const BRAND_ICONS: Record<string, string> = { Visa: '💳', Mastercard: '💳', Amex: '💳' }

export default function PaymentPage() {
  const [cards, setCards] = useState(CARDS)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ number: '', name: '', expiry: '', cvc: '' })

  const handleAddCard = () => {
    const last4 = form.number.replace(/\s/g, '').slice(-4)
    setCards(prev => [...prev, { id: String(Date.now()), brand: 'Visa', last4, expiry: form.expiry, isDefault: false }])
    setShowModal(false)
    setForm({ number: '', name: '', expiry: '', cvc: '' })
  }

  const formatCardNumber = (val: string) => {
    return val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim()
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .card-visual {
          height: 160px;
          border-radius: 20px;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(255,211,44,0.15) 0%, rgba(124,58,237,0.12) 100%);
        }
        .card-chip { width: 40px; height: 30px; background: linear-gradient(135deg, #d4af37, #f5e68a); border-radius: 6px; margin-bottom: 20px; }
        .card-number { font-size: 18px; font-weight: 700; letter-spacing: 0.1em; color: var(--text-primary); margin-bottom: 16px; font-family: monospace; }
        .card-footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .card-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-muted); }
        .card-value { font-size: 13px; font-weight: 600; color: var(--text-secondary); }
        .default-indicator {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 10px; height: 10px;
          border-radius: 50%;
          background: var(--success);
          box-shadow: 0 0 6px rgba(52,211,153,0.5);
        }
        @media (max-width: 768px) { .cards-grid { grid-template-columns: 1fr; } }
      ` }} />

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>Payment Methods</h1>
        <button className="btn-p" onClick={() => setShowModal(true)}>+ Add Card</button>
      </div>

      <div className="cards-grid">
        {cards.map(card => (
          <div key={card.id} className="panel" style={{ padding: 20 }}>
            <div className="card-visual">
              {card.isDefault && <div className="default-indicator" title="Default card" />}
              <div className="card-chip" />
              <div className="card-number">•••• •••• •••• {card.last4}</div>
              <div className="card-footer">
                <div>
                  <div className="card-label">Expires</div>
                  <div className="card-value">{card.expiry}</div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-secondary)', letterSpacing: '-0.02em' }}>{card.brand}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {!card.isDefault && (
                <button className="btn-g btn-sm" onClick={() => setCards(prev => prev.map(c => ({ ...c, isDefault: c.id === card.id })))}>
                  Set Default
                </button>
              )}
              {card.isDefault && <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600, padding: '6px 0' }}>✓ Default Card</span>}
              <button className="btn-d btn-sm" onClick={() => setCards(prev => prev.filter(c => c.id !== card.id))}>Remove</button>
            </div>
          </div>
        ))}

        <button
          className="panel"
          onClick={() => setShowModal(true)}
          style={{ padding: 24, border: '2px dashed var(--border)', cursor: 'pointer', background: 'transparent', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, borderRadius: 20, fontSize: 14, fontFamily: 'inherit', minHeight: 200 }}
        >
          <span style={{ fontSize: 32 }}>+</span>
          Add New Card
        </button>
      </div>

      {/* Security note */}
      <div className="panel" style={{ padding: 20, marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 24 }}>🔒</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Secure Payment Processing</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Your payment information is encrypted with 256-bit SSL. We never store your full card number.</div>
        </div>
      </div>

      {/* Add card modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="panel-header">
              <span className="panel-title">Add New Card</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 20 }}>×</button>
            </div>
            <div className="panel-body">
              <div className="f-group">
                <label className="f-label">Card Number</label>
                <input
                  className="f-input"
                  value={form.number}
                  onChange={e => setForm(f => ({ ...f, number: formatCardNumber(e.target.value) }))}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                />
              </div>
              <div className="f-group">
                <label className="f-label">Cardholder Name</label>
                <input
                  className="f-input"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="f-row">
                <div className="f-group">
                  <label className="f-label">Expiry Date</label>
                  <input
                    className="f-input"
                    value={form.expiry}
                    onChange={e => setForm(f => ({ ...f, expiry: e.target.value }))}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div className="f-group">
                  <label className="f-label">CVC</label>
                  <input
                    className="f-input"
                    value={form.cvc}
                    onChange={e => setForm(f => ({ ...f, cvc: e.target.value }))}
                    placeholder="123"
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button className="btn-p" style={{ flex: 1 }} onClick={handleAddCard}>Add Card</button>
                <button className="btn-g" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
