'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'

const DUMMY_PRODUCT = {
  id: 'demo',
  name: 'Minimal Wireless Headphones',
  slug: 'minimal-wireless-headphones',
  description: 'Experience audio perfection with our flagship wireless headphones. Featuring 40mm drivers, active noise cancellation, and 30-hour battery life, these headphones redefine what premium audio means.',
  shortDesc: 'Premium wireless headphones with ANC and 30hr battery.',
  price: 299.99,
  salePrice: null,
  sku: 'MWH-001',
  stock: 42,
  colors: ['#1a1a1a', '#f5f5f5', '#FFD32C'],
  tags: ['wireless', 'premium', 'ANC', 'bluetooth'],
  isBest: true,
  isNew: false,
  rating: 4.8,
  reviewCount: 127,
  category: { name: 'Electronics', slug: 'electronics' },
  images: [],
}

const TABS = ['Description', 'Specifications', 'Shipping & Returns', 'Reviews']

const SPECS = [
  { key: 'Driver Size', value: '40mm Dynamic' },
  { key: 'Frequency Response', value: '20Hz – 20kHz' },
  { key: 'Battery Life', value: 'Up to 30 hours' },
  { key: 'Charging Time', value: '2 hours (USB-C)' },
  { key: 'Connectivity', value: 'Bluetooth 5.2' },
  { key: 'Weight', value: '250g' },
  { key: 'Noise Cancellation', value: 'Active (ANC)' },
  { key: 'Microphone', value: 'Built-in dual mic' },
]

const REVIEWS = [
  { name: 'Alex K.', rating: 5, title: 'Absolutely incredible', body: 'Best headphones I\'ve ever owned. The sound quality is exceptional and the ANC is top-tier.', verified: true, date: 'May 2026' },
  { name: 'Sam R.', rating: 4, title: 'Premium quality', body: 'Very comfortable for long sessions. Build quality is outstanding. Worth every penny.', verified: true, date: 'April 2026' },
  { name: 'Jordan L.', rating: 5, title: 'Game changer', body: 'The audio clarity is unmatched in this price range. Highly recommend!', verified: false, date: 'March 2026' },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= Math.round(rating) ? 'var(--accent-primary)' : 'none'} stroke={i <= Math.round(rating) ? 'var(--accent-primary)' : 'var(--text-muted)'} strokeWidth="2">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState(0)
  const [qty, setQty] = useState(1)
  const [activeTab, setActiveTab] = useState(0)
  const [wishlisted, setWishlisted] = useState(false)
  const [toast, setToast] = useState('')
  const [stickyVisible, setStickyVisible] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // First get by slug to find the ID
        const listRes = await fetch(`/api/products?slug=${params.slug}`)
        if (!listRes.ok) { setProduct(DUMMY_PRODUCT); setLoading(false); return }
        const listData = await listRes.json()
        const basic = listData.products?.[0]
        if (!basic) { setProduct(DUMMY_PRODUCT); setLoading(false); return }

        // Then fetch full detail (includes all images)
        const detailRes = await fetch(`/api/products/${basic.id}`)
        if (detailRes.ok) {
          const detail = await detailRes.json()
          setProduct(detail.error ? basic : detail)
        } else {
          setProduct(basic)
        }
      } catch {
        setProduct(DUMMY_PRODUCT)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [params.slug])

  useEffect(() => {
    const handleScroll = () => {
      const ctaSection = document.getElementById('product-cta')
      if (ctaSection) {
        const rect = ctaSection.getBoundingClientRect()
        setStickyVisible(rect.bottom < 0)
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleAddToCart = () => {
    if (!product) return
    try {
      const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === product.id)
      if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + qty
      else cart.push({ id: product.id, name: product.name, price: product.salePrice || product.price, qty })
      localStorage.setItem('cf_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cf-cart-change'))
      showToast(`${product.name} added to cart!`)
    } catch {}
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '200px 0', color: 'var(--text-muted)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        Loading product...
      </div>
    )
  }

  const p = product || DUMMY_PRODUCT

  return (
    <>
      <style>{`
        .pdp-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: start;
          padding: 140px 0 80px;
        }
        .gallery { position: sticky; top: 100px; }
        .gallery-main {
          aspect-ratio: 1;
          border-radius: 24px;
          overflow: hidden;
          margin-bottom: 16px;
          cursor: zoom-in;
          position: relative;
        }
        .gallery-main-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          border: 2px dashed var(--glass-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 100px;
          gap: 12px;
        }
        [data-theme="light"] .gallery-main-placeholder {
          background: linear-gradient(135deg, #ECE6DA 0%, #DDD4C2 100%) !important;
          color: rgba(0,0,0,0.35) !important;
        }
        .gallery-thumbs { display: flex; gap: 12px; }
        .gallery-thumb {
          width: 80px;
          height: 80px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s;
          flex-shrink: 0;
        }
        .gallery-thumb.active { border-color: var(--accent-primary); }
        .thumb-inner {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);
          border: 1px dashed var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        .pdp-panel h1 { font-size: 36px; font-weight: 700; letter-spacing: -0.02em; color: var(--text-primary); margin-bottom: 12px; }
        [data-theme="light"] .pdp-panel h1 { color: #0a0a0b; }
        .pdp-rating { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
        .pdp-price { font-size: 32px; font-weight: 700; color: var(--accent-primary); margin-bottom: 24px; }
        [data-theme="light"] .pdp-price { color: #B5901E !important; }

        .option-label { font-size: 11px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-muted); margin-bottom: 10px; }
        .colors-row { display: flex; gap: 10px; margin-bottom: 24px; }
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .color-swatch.active { border-color: var(--accent-primary); transform: scale(1.15); }

        .connectivity-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .conn-pill {
          padding: 7px 16px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.18s;
        }
        .conn-pill:hover, .conn-pill.active { border-color: var(--accent); color: var(--accent); background: rgba(255,211,44,0.08); }

        .qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
        .qty-btn { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: rgba(255,255,255,0.06); color: var(--text-primary); font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .qty-btn:hover { border-color: var(--accent); color: var(--accent); }
        .qty-value { font-size: 18px; font-weight: 700; min-width: 32px; text-align: center; }

        .cta-row { display: flex; gap: 12px; margin-bottom: 24px; }

        .trust-badges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin: 24px 0; }
        .trust-badge {
          padding: 16px 12px;
          border-radius: 14px;
          text-align: center;
        }
        .trust-badge-icon { font-size: 24px; margin-bottom: 8px; }
        .trust-badge-title { font-size: 12px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .trust-badge-sub { font-size: 11px; color: var(--text-muted); }
        [data-theme="light"] .trust-badge-title { color: #0a0a0b; }

        .tabs { display: flex; gap: 0; margin: 40px 0 0; border-bottom: 1px solid var(--border); }
        .tab-btn {
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-muted);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          font-family: inherit;
          white-space: nowrap;
        }
        .tab-btn:hover { color: var(--text-secondary); }
        .tab-btn.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
        .tab-content { padding: 28px 0; }
        .desc-content { font-size: 15px; line-height: 1.8; color: var(--text-secondary); }
        [data-theme="light"] .desc-content { color: rgba(0,0,0,0.74); }

        .spec-table { width: 100%; border-collapse: collapse; }
        .spec-table tr { border-bottom: 1px solid var(--border); }
        .spec-table td { padding: 12px 0; font-size: 13px; }
        .spec-table td:first-child { color: var(--text-muted); width: 40%; }
        .spec-table td:last-child { color: var(--text-primary); font-weight: 500; }
        [data-theme="light"] .spec-table td:last-child { color: #0a0a0b; }

        .review-card { margin-bottom: 20px; padding: 20px; border-radius: 16px; }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .review-name { font-size: 14px; font-weight: 700; }
        .review-date { font-size: 12px; color: var(--text-muted); }
        .review-title { font-size: 14px; font-weight: 600; margin-bottom: 6px; }
        .review-body { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }
        [data-theme="light"] .review-body { color: rgba(0,0,0,0.74); }
        .verified-badge { font-size: 10px; color: var(--success); font-weight: 600; }

        /* Sticky bottom bar */
        .sticky-bottom {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-top: 1px solid var(--border);
          background: rgba(10,10,11,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transform: translateY(100%);
          transition: transform 0.4s var(--spring);
        }
        .sticky-bottom.visible { transform: translateY(0); }

        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.2s ease;
        }
        .lightbox-content { width: 90vmin; height: 90vmin; border-radius: 24px; overflow: hidden; }
        .lightbox-close { position: absolute; top: 24px; right: 24px; width: 44px; height: 44px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 50%; cursor: pointer; color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; }

        @media (max-width: 1024px) {
          .pdp-layout { grid-template-columns: 1fr; gap: 40px; padding: 120px 0 60px; }
          .gallery { position: static; }
          .trust-badges { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .pdp-layout { padding: 100px 0 60px; gap: 28px; }
          .tabs { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .tabs::-webkit-scrollbar { display: none; }
          .trust-badges { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .trust-badge { padding: 12px 8px; }
          .trust-badge-icon { font-size: 20px; margin-bottom: 6px; }
          .trust-badge-title { font-size: 11px; }
          .trust-badge-sub { font-size: 10px; display: none; }
          .cta-row { flex-wrap: wrap; }
          .cta-row .btn:first-child { flex: 1; min-width: 0; }
          .cta-row .btn:nth-child(2) { flex: 1; min-width: 0; }
          .sticky-bottom { padding: 12px 16px; padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px)); }
          .pdp-panel h1 { font-size: 26px; }
          .pdp-price { font-size: 26px; }
        }
        @media (max-width: 480px) {
          .gallery-thumbs { flex-wrap: wrap; }
          .gallery-thumb { width: 64px; height: 64px; }
          .trust-badges { grid-template-columns: repeat(3, 1fr); gap: 6px; }
          .connectivity-pills { gap: 6px; }
          .conn-pill { padding: 6px 12px; font-size: 11px; }
          .sticky-bottom { flex-direction: column; align-items: stretch; gap: 10px; }
          .sticky-bottom > div:first-child { display: flex; justify-content: space-between; align-items: center; }
          .sticky-bottom > div:last-child { display: flex; gap: 10px; }
          .sticky-bottom > div:last-child .btn { flex: 1; }
        }
      `}</style>

      <div className="container">
        <div className="pdp-layout">
          {/* Gallery */}
          <div className="gallery">
            <div className="gallery-main glass" onClick={() => p.images?.length > 0 && setLightboxOpen(true)}>
              {p.images && p.images.length > 0 ? (
                <img
                  src={p.images[Math.min(activeImage, p.images.length - 1)]?.url}
                  alt={p.images[Math.min(activeImage, p.images.length - 1)]?.alt || p.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div className="gallery-main-placeholder">
                  <span>{p.category?.name === 'Electronics' ? '⚡' : p.category?.name === 'Fashion' ? '👗' : '🛍️'}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>No image</span>
                </div>
              )}
            </div>
            {p.images && p.images.length > 1 && (
              <div className="gallery-thumbs">
                {p.images.map((img: any, i: number) => (
                  <div
                    key={img.id}
                    className={`gallery-thumb${activeImage === i ? ' active' : ''}`}
                    onClick={() => setActiveImage(i)}
                  >
                    <img src={img.url} alt={img.alt || p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="pdp-panel">
            <nav className="breadcrumb" style={{ marginBottom: 20 }}>
              <Link href="/">Home</Link>
              <span className="sep">›</span>
              <Link href="/shop">Shop</Link>
              <span className="sep">›</span>
              {p.category && (
                <>
                  <Link href={`/shop?category=${p.category.slug}`}>{p.category.name}</Link>
                  <span className="sep">›</span>
                </>
              )}
              <span className="current">{p.name}</span>
            </nav>

            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {p.isBest && <span className="pill-g pill-yellow">Bestseller</span>}
              {p.isNew && <span className="pill-g pill-blue">New</span>}
              {p.stock === 0 && <span className="pill-g pill-gray">Sold Out</span>}
            </div>

            <h1>{p.name}</h1>

            {/* Rating */}
            <div className="pdp-rating">
              <StarRating rating={p.rating || 4.5} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{p.rating || 4.5}</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>({p.reviewCount || 0} reviews)</span>
              {p.sku && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>SKU: {p.sku}</span>}
            </div>

            <div className="pdp-price">
              ${(p.salePrice || p.price).toFixed(2)}
              {p.salePrice && (
                <span className="product-price-sale" style={{ marginLeft: 12 }}>${p.price.toFixed(2)}</span>
              )}
            </div>

            {p.shortDesc && (
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                {p.shortDesc}
              </p>
            )}

            {/* Colors */}
            {p.colors && p.colors.length > 0 && (
              <div id="product-cta">
                <div className="option-label">Color: <span style={{ color: 'var(--text-primary)', textTransform: 'none' }}>{['Midnight Black', 'Arctic White', 'Solar Yellow'][selectedColor] || 'Default'}</span></div>
                <div className="colors-row">
                  {p.colors.map((color: string, i: number) => (
                    <div
                      key={i}
                      className={`color-swatch${selectedColor === i ? ' active' : ''}`}
                      style={{ background: color }}
                      onClick={() => setSelectedColor(i)}
                    />
                  ))}
                </div>

                {/* Connectivity pills */}
                <div className="option-label">Connectivity</div>
                <div className="connectivity-pills">
                  {['Bluetooth 5.2', 'USB-C', 'AUX 3.5mm'].map((c, i) => (
                    <button key={i} className={`conn-pill${i === 0 ? ' active' : ''}`}>{c}</button>
                  ))}
                </div>

                {/* Quantity */}
                <div className="option-label">Quantity</div>
                <div className="qty-row">
                  <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
                  <span className="qty-value">{qty}</span>
                  <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
                  <span style={{ fontSize: 12, color: p.stock > 10 ? 'var(--success)' : 'var(--warning)', marginLeft: 12 }}>
                    {p.stock > 10 ? `✓ In Stock (${p.stock} available)` : p.stock > 0 ? `⚡ Only ${p.stock} left` : '✗ Sold Out'}
                  </span>
                </div>

                {/* CTA buttons */}
                <div className="cta-row">
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={handleAddToCart}
                    disabled={p.stock === 0}
                  >
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                  </button>
                  <button className="btn btn-ghost" style={{ flex: 1 }}>
                    Buy Now
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ width: 48, padding: 0 }}
                    onClick={() => setWishlisted(w => !w)}
                    aria-label="Add to wishlist"
                  >
                    <svg width="20" height="20" fill={wishlisted ? 'var(--danger)' : 'none'} stroke={wishlisted ? 'var(--danger)' : 'currentColor'} viewBox="0 0 24 24">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Trust badges */}
            <div className="trust-badges">
              {[
                { icon: '🚀', title: 'Free Shipping', sub: 'On orders over $50' },
                { icon: '↩', title: '30-Day Returns', sub: 'No questions asked' },
                { icon: '🛡️', title: '2-Year Warranty', sub: 'Full coverage' },
              ].map((badge, i) => (
                <div key={i} className="trust-badge glass">
                  <div className="trust-badge-icon">{badge.icon}</div>
                  <div className="trust-badge-title">{badge.title}</div>
                  <div className="trust-badge-sub">{badge.sub}</div>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="tabs">
              {TABS.map((tab, i) => (
                <button
                  key={tab}
                  className={`tab-btn${activeTab === i ? ' active' : ''}`}
                  onClick={() => setActiveTab(i)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="tab-content">
              {activeTab === 0 && (
                <div className="desc-content">
                  <p>{p.description || 'Premium product with exceptional quality and craftsmanship. Built to last with the finest materials and attention to every detail.'}</p>
                  <br />
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Key Features</h4>
                  <ul style={{ paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <li>Active Noise Cancellation technology</li>
                    <li>30-hour battery life with quick charge</li>
                    <li>Premium 40mm dynamic drivers</li>
                    <li>Bluetooth 5.2 with multipoint connection</li>
                    <li>Foldable design for easy portability</li>
                  </ul>
                </div>
              )}

              {activeTab === 1 && (
                <table className="spec-table">
                  <tbody>
                    {SPECS.map(spec => (
                      <tr key={spec.key}>
                        <td>{spec.key}</td>
                        <td>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === 2 && (
                <div className="desc-content">
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Shipping</h4>
                  <p style={{ marginBottom: 16 }}>Free standard shipping on all orders over $50. Express shipping available at checkout. Orders typically process within 1-2 business days.</p>
                  <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Returns</h4>
                  <p>We offer hassle-free 30-day returns. Items must be in original condition with packaging. Initiate returns through your dashboard account page.</p>
                </div>
              )}

              {activeTab === 3 && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '20px', borderRadius: 16, background: 'rgba(255,211,44,0.05)', border: '1px solid rgba(255,211,44,0.12)' }}>
                    <div style={{ textAlign: 'center', minWidth: 80 }}>
                      <div style={{ fontSize: 48, fontWeight: 700, color: 'var(--accent-primary)', lineHeight: 1 }}>{p.rating || 4.8}</div>
                      <StarRating rating={p.rating || 4.8} />
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{p.reviewCount || 127} reviews</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[5, 4, 3, 2, 1].map(stars => (
                        <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 12 }}>{stars}</span>
                          <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', background: 'var(--accent-primary)', borderRadius: 3, width: `${[72, 18, 6, 2, 2][5 - stars]}%` }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 24, textAlign: 'right' }}>{[72, 18, 6, 2, 2][5 - stars]}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {REVIEWS.map((review, i) => (
                    <div key={i} className="review-card glass">
                      <div className="review-header">
                        <div>
                          <div className="review-name">{review.name}
                            {review.verified && <span className="verified-badge" style={{ marginLeft: 8 }}>✓ Verified</span>}
                          </div>
                          <StarRating rating={review.rating} />
                        </div>
                        <span className="review-date">{review.date}</span>
                      </div>
                      <div className="review-title">{review.title}</div>
                      <div className="review-body">{review.body}</div>
                    </div>
                  ))}

                  <button className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>Load More Reviews</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className={`sticky-bottom${stickyVisible ? ' visible' : ''}`}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent-primary)' }}>${(p.salePrice || p.price).toFixed(2)}</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleAddToCart}>Add to Cart</button>
          <button className="btn btn-ghost">Buy Now</button>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && p.images?.length > 0 && (
        <div className="lightbox" onClick={() => setLightboxOpen(false)}>
          <button className="lightbox-close" onClick={() => setLightboxOpen(false)}>×</button>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <img
              src={p.images[Math.min(activeImage, p.images.length - 1)]?.url}
              alt={p.name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 24 }}
            />
          </div>
        </div>
      )}

      {/* Toast */}
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
