'use client'

import { useState } from 'react'
import Link from 'next/link'

const WISHLIST = [
  { id: '1', name: 'Smart Watch Pro', price: 599, slug: 'smart-watch-pro', emoji: '⌚', sale: false },
  { id: '2', name: 'Designer Sunglasses', price: 329, slug: 'designer-sunglasses', emoji: '🕶️', sale: true, salePrice: 249 },
  { id: '3', name: 'Premium Leather Bag', price: 459, slug: 'premium-leather-bag', emoji: '👜', sale: false },
  { id: '4', name: 'Minimal Wireless Headphones', price: 299, slug: 'minimal-wireless-headphones', emoji: '⚡', sale: false },
]

export default function WishlistPage() {
  const [items, setItems] = useState(WISHLIST)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddToCart = (item: typeof WISHLIST[0]) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === item.id)
      if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + 1
      else cart.push({ id: item.id, name: item.name, price: item.salePrice || item.price, qty: 1 })
      localStorage.setItem('cf_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cf-cart-change'))
      showToast(`${item.name} added to cart!`)
    } catch {}
  }

  return (
    <>
      <style>{`
        .wish-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .wish-card { border-radius: 18px; padding: 16px; position: relative; }
        .wish-img { aspect-ratio: 1; border-radius: 12px; overflow: hidden; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; font-size: 56px; background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); }
        [data-theme="light"] .wish-img { background: linear-gradient(135deg, #ECE6DA 0%, #DDD4C2 100%) !important; }
        .wish-remove {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 30px; height: 30px;
          background: rgba(255,92,92,0.10);
          border: 1px solid rgba(255,92,92,0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--danger);
          font-size: 16px;
          transition: all 0.2s;
        }
        .wish-remove:hover { background: rgba(255,92,92,0.2); }
        @media (max-width: 1024px) { .wish-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .wish-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
      `}</style>

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Wishlist</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{items.length} items saved</span>
      </div>

      {items.length === 0 ? (
        <div className="panel" style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your wishlist is empty</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Save items you love for later</p>
          <Link href="/shop" className="btn-p">Browse Products</Link>
        </div>
      ) : (
        <div className="wish-grid">
          {items.map(item => (
            <div key={item.id} className="wish-card panel">
              <button
                className="wish-remove"
                onClick={() => { setItems(prev => prev.filter(i => i.id !== item.id)); showToast('Removed from wishlist') }}
                aria-label="Remove from wishlist"
              >
                ×
              </button>
              <Link href={`/products/${item.slug}`}>
                <div className="wish-img">
                  {item.emoji}
                </div>
              </Link>
              <div className="product-name" style={{ fontSize: 14, marginBottom: 6 }}>{item.name}</div>
              <div className="product-price" style={{ fontSize: 16, marginBottom: 12 }}>
                ${(item.salePrice || item.price).toFixed(2)}
                {item.salePrice && <span className="product-price-sale">${item.price.toFixed(2)}</span>}
              </div>
              {item.sale && <span className="pill-g pill-red" style={{ marginBottom: 10, display: 'inline-block' }}>On Sale!</span>}
              <button
                className="btn-p"
                style={{ width: '100%', padding: '9px', fontSize: 13 }}
                onClick={() => handleAddToCart(item)}
              >
                Add to Cart
              </button>
            </div>
          ))}
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
