'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  useEffect(() => {
    const fetchWishlist = async () => {
      try {
        const res = await fetch('/api/wishlist')
        if (res.ok) {
          const data = await res.json()
          setItems(data.wishlist || [])
        }
      } catch (err) {
        console.error('Failed to fetch wishlist:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchWishlist()
  }, [])

  const handleRemove = async (productId: string, productName: string) => {
    try {
      const res = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setItems(prev => prev.filter(i => i.productId !== productId))
        showToast(`Removed "${productName}" from wishlist`)
        window.dispatchEvent(new Event('cf-wishlist-change'))
      }
    } catch (err) {
      console.error('Failed to remove item:', err)
    }
  }

  const handleAddToCart = (product: any) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === product.id)
      const price = product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price
      if (idx >= 0) {
        cart[idx].qty = (cart[idx].qty || 1) + 1
      } else {
        cart.push({ id: product.id, name: product.name, price: price, qty: 1 })
      }
      localStorage.setItem('cf_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cf-cart-change'))
      showToast(`${product.name} added to cart!`)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .wish-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .wish-card { border-radius: 18px; padding: 16px; position: relative; }
        .wish-img { aspect-ratio: 1; border-radius: 12px; overflow: hidden; margin-bottom: 12px; display: flex; align-items: center; justify-content: center; font-size: 56px; background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02)); position: relative; }
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
          z-index: 5;
        }
        .wish-remove:hover { background: rgba(255,92,92,0.2); }
        
        /* Pulse Animation */
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
          background: rgba(255,255,255,0.06);
          border-radius: 12px;
        }
        [data-theme="light"] .skeleton {
          background: rgba(0,0,0,0.04);
        }
        @media (max-width: 1024px) { .wish-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .wish-grid { grid-template-columns: 1fr 1fr; gap: 12px; } }
      ` }} />

      <div className="page-header">
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>My Wishlist</h1>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {loading ? '...' : `${items.length} items saved`}
        </span>
      </div>

      {loading ? (
        <div className="wish-grid">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel" style={{ padding: 16 }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: 1, marginBottom: 12 }} />
              <div className="skeleton" style={{ width: '70%', height: 14, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '40%', height: 16, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '100%', height: 36, borderRadius: 8 }} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="panel" style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>❤️</div>
          <p style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Your wishlist is empty</p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Save items you love for later</p>
          <Link href="/shop" className="btn-p">Browse Products</Link>
        </div>
      ) : (
        <div className="wish-grid">
          {items.map(item => {
            const product = item.product
            if (!product) return null
            const imgUrl = product.images?.[0]?.url
            const hasSale = product.salePrice !== null && product.salePrice !== undefined
            const displayPrice = hasSale ? product.salePrice : product.price

            return (
              <div key={item.productId} className="wish-card panel">
                <button
                  className="wish-remove"
                  onClick={() => handleRemove(product.id, product.name)}
                  aria-label="Remove from wishlist"
                >
                  ×
                </button>
                <Link href={`/products/${product.slug}`}>
                  <div className="wish-img">
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      '🛍️'
                    )}
                  </div>
                </Link>
                <div className="product-name" style={{ fontSize: 14, marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {product.name}
                </div>
                <div className="product-price" style={{ fontSize: 16, marginBottom: 12 }}>
                  ${displayPrice.toFixed(2)}
                  {hasSale && <span className="product-price-sale" style={{ marginLeft: 8, textDecoration: 'line-through', fontSize: 12, color: 'var(--text-muted)' }}>${product.price.toFixed(2)}</span>}
                </div>
                {hasSale && <span className="pill-g pill-red" style={{ marginBottom: 10, display: 'inline-block' }}>On Sale!</span>}
                <button
                  className="btn-p"
                  style={{ width: '100%', padding: '9px', fontSize: 13 }}
                  onClick={() => handleAddToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            )
          })}
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
