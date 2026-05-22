'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ProductImage } from '@/components/ProductImage'

const CATEGORY_EMOJIS: Record<string, string> = {
  Electronics: '⚡',
  Fashion: '👗',
  'Home & Living': '🏡',
  Beauty: '✨',
  Accessories: '💎',
  Sports: '🏃',
}

const CATEGORY_GRADIENTS: Record<string, string> = {
  Electronics: 'linear-gradient(135deg, rgba(96,165,250,0.15), rgba(124,58,237,0.12))',
  Fashion: 'linear-gradient(135deg, rgba(244,114,182,0.15), rgba(249,168,212,0.10))',
  'Home & Living': 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.10))',
  Beauty: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(245,158,11,0.10))',
  Accessories: 'linear-gradient(135deg, rgba(167,139,250,0.15), rgba(139,92,246,0.12))',
  Sports: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(96,165,250,0.12))',
}

interface ProductImageData {
  url: string
  alt?: string | null
  position?: number
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  colors: string[]
  isBest?: boolean
  isNew?: boolean
  stock?: number
  images?: ProductImageData[]
  category?: { name: string; slug: string } | null
}

const FALLBACK_CATEGORIES = [
  { id: '1', name: 'Electronics', slug: 'electronics', _count: { products: 124 } },
  { id: '2', name: 'Fashion', slug: 'fashion', _count: { products: 287 } },
  { id: '3', name: 'Home & Living', slug: 'home-living', _count: { products: 156 } },
  { id: '4', name: 'Beauty', slug: 'beauty', _count: { products: 98 } },
  { id: '5', name: 'Accessories', slug: 'accessories', _count: { products: 203 } },
  { id: '6', name: 'Sports', slug: 'sports', _count: { products: 167 } },
]

const FALLBACK_PRODUCTS: Product[] = [
  { id: '1', name: 'Minimal Wireless Headphones', slug: 'minimal-wireless-headphones', price: 299, colors: ['#1a1a1a', '#f5f5f5', '#FFD32C'], isBest: true, isNew: false },
  { id: '2', name: 'Premium Leather Bag', slug: 'premium-leather-bag', price: 459, colors: ['#8B4513', '#1a1a1a'], isBest: false, isNew: true },
  { id: '3', name: 'Smart Watch Pro', slug: 'smart-watch-pro', price: 599, colors: ['#1a1a1a', '#c0c0c0', '#ffd700'], isBest: true, isNew: false },
  { id: '4', name: 'Designer Sunglasses', slug: 'designer-sunglasses', price: 329, colors: ['#1a1a1a', '#8B4513'], isBest: false, isNew: true },
  { id: '5', name: 'Minimalist Desk Lamp', slug: 'minimalist-desk-lamp', price: 189, colors: ['#f5f5f5', '#1a1a1a'], isBest: false, isNew: false },
  { id: '6', name: 'Organic Cotton Tee', slug: 'organic-cotton-tee', price: 79, colors: ['#f5f5f5', '#1a1a1a', '#4169E1'], isBest: false, isNew: true },
  { id: '7', name: 'Ceramic Coffee Mug', slug: 'ceramic-coffee-mug', price: 45, colors: ['#f5f5f5', '#FFD32C', '#34D399'], isBest: false, isNew: false },
  { id: '8', name: 'Yoga Mat Premium', slug: 'yoga-mat-premium', price: 89, colors: ['#1a1a1a', '#9370DB', '#FFD32C'], isBest: true, isNew: false },
]

interface Category {
  id: string
  name: string
  slug: string
  _count: { products: number }
}

export function HomepageClient({
  initialProducts,
  initialCategories,
}: {
  initialProducts: Product[]
  initialCategories: Category[]
}) {
  const products = initialProducts.length > 0 ? initialProducts : FALLBACK_PRODUCTS
  const categories = initialCategories.length > 0 ? initialCategories : FALLBACK_CATEGORIES

  const productFrameRef = useRef<HTMLDivElement>(null)
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set())
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState('')

  useEffect(() => {
    // Intersection Observer for scroll reveals
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    )

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

    // Hero parallax tilt
    const frame = productFrameRef.current
    if (frame) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = frame.getBoundingClientRect()
        const x = e.clientX - rect.left - rect.width / 2
        const y = e.clientY - rect.top - rect.height / 2
        const rotX = (y / rect.height) * -10
        const rotY = (x / rect.width) * 10
        frame.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`
      }
      const handleMouseLeave = () => { frame.style.transform = '' }
      document.addEventListener('mousemove', handleMouseMove)
      frame.addEventListener('mouseleave', handleMouseLeave)
      return () => {
        observer.disconnect()
        document.removeEventListener('mousemove', handleMouseMove)
        frame.removeEventListener('mouseleave', handleMouseLeave)
      }
    }

    return () => observer.disconnect()
  }, [])

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const handleWishlist = (e: React.MouseEvent, productId: string, productName: string) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(prev => {
      const next = new Set(prev)
      if (next.has(productId)) {
        next.delete(productId)
        showToast(`${productName} removed from wishlist`)
      } else {
        next.add(productId)
        showToast(`${productName} added to wishlist ♥`)
      }
      return next
    })
  }

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === product.id)
      if (idx >= 0) {
        cart[idx].qty = (cart[idx].qty || 1) + 1
      } else {
        cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 })
      }
      localStorage.setItem('cf_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cf-cart-change'))
      showToast(`${product.name} added to cart!`)
    } catch {}
  }

  return (
    <>
      <style>{`
        .hero {
          padding: 200px 0 120px;
          position: relative;
        }
        .hero-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 72px;
          align-items: center;
        }
        .hero-eyebrow {
          display: inline-block;
          padding: 8px 20px;
          background: rgba(255, 211, 44, 0.12);
          border: 1px solid rgba(255, 211, 44, 0.3);
          border-radius: 999px;
          color: var(--accent-primary);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 24px;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s forwards;
        }
        [data-theme="light"] .hero-eyebrow {
          background: rgba(255,211,44,0.20);
          border-color: rgba(255,211,44,0.50);
          color: #8A6F18;
        }
        .hero-title {
          font-size: 88px;
          line-height: 92px;
          font-weight: 600;
          letter-spacing: -0.02em;
          margin-bottom: 24px;
          color: var(--text-primary);
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
        }
        [data-theme="light"] .hero-title { color: #0a0a0b; }
        .hero-desc {
          font-size: 18px;
          line-height: 28px;
          color: var(--text-secondary);
          margin-bottom: 40px;
          max-width: 540px;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s forwards;
        }
        .hero-ctas {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.4s forwards;
        }
        .hero-right {
          position: relative;
          height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          animation: fadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s forwards;
        }
        .hero-product-frame {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 36px;
          padding: 40px;
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hero-product-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255,211,44,0.08) 0%, rgba(124,58,237,0.06) 100%);
          border: 2px dashed var(--glass-border);
          border-radius: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: var(--text-muted);
          font-family: 'Courier New', monospace;
          text-align: center;
          padding: 32px;
          gap: 16px;
        }
        .hero-placeholder-emoji { font-size: 80px; }
        [data-theme="light"] .hero-product-placeholder {
          background: linear-gradient(135deg, #ECE6DA 0%, #DDD4C2 100%) !important;
          color: rgba(0,0,0,0.35) !important;
        }

        .trust-strip { padding: 56px 0; }
        .trust-items { display: flex; gap: 24px; justify-content: center; flex-wrap: wrap; }
        .trust-item {
          padding: 20px 32px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: 999px;
        }
        .trust-icon { width: 20px; height: 20px; color: var(--accent-primary); flex-shrink: 0; }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .category-card {
          position: relative;
          height: 300px;
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none;
        }
        .category-card:hover { transform: translateY(-8px); }
        .category-card:hover .category-overlay {
          background: linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%);
        }
        .category-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 72px;
        }
        .category-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px;
          background: linear-gradient(135deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border-top: 1px solid var(--glass-border);
          transition: all 0.3s;
        }
        .category-name {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 4px;
          color: var(--text-primary);
        }
        [data-theme="light"] .category-name { color: #0a0a0b !important; }
        .category-count {
          font-size: 13px;
          color: var(--text-muted);
        }

        .product-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
        }

        /* Product card image wrapper — real image support */
        .hp-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: var(--r-md);
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1200px) {
          .hero-title { font-size: 64px; line-height: 68px; }
        }
        @media (max-width: 1024px) {
          .hero { padding: 160px 0 80px; }
          .hero-content { grid-template-columns: 1fr; gap: 56px; }
          .hero-title { font-size: 56px; line-height: 60px; }
          .hero-right { height: 400px; }
          .category-grid { grid-template-columns: repeat(2, 1fr); }
          .product-grid { grid-template-columns: repeat(3, 1fr); }
          .trust-item { padding: 16px 24px; }
        }
        @media (max-width: 768px) {
          .hero { padding: 120px 0 60px; }
          .hero-title { font-size: 40px !important; line-height: 46px !important; }
          .hero-desc { font-size: 16px; }
          .hero-ctas { flex-direction: column; gap: 12px; }
          .hero-ctas .btn { width: 100%; justify-content: center; }
          .hero-right { height: 320px; }
          .category-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .category-card { height: 220px; }
          .category-name { font-size: 16px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
          .trust-strip { padding: 40px 0; }
          .trust-items { gap: 12px; }
          .trust-item { padding: 14px 20px; font-size: 13px; }
        }
        @media (max-width: 480px) {
          .hero { padding: 100px 0 48px; }
          .hero-title { font-size: 30px !important; line-height: 36px !important; }
          .hero-desc { font-size: 15px; margin-bottom: 28px; }
          .hero-right { height: 260px; }
          .hero-product-frame { padding: 20px; border-radius: 24px; }
          .category-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .category-card { height: 180px; }
          .category-image { font-size: 48px; }
          .category-overlay { padding: 16px; }
          .category-name { font-size: 14px; }
          .product-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .trust-item { padding: 12px 16px; border-radius: 16px; }
          .trust-items { flex-direction: column; align-items: stretch; }
          .trust-item { justify-content: center; }
        }
      `}</style>

      {/* Hero */}
      <section className="hero" id="home">
        <div className="container">
          <div className="hero-content">
            <div className="hero-left">
              <span className="hero-eyebrow">✦ New Collection 2026</span>
              <h1 className="hero-title">The Future of Premium Shopping</h1>
              <p className="hero-desc">
                Experience luxury redefined through our cutting-edge liquid glass interface.
                Every interaction, every detail, crafted to perfection.
              </p>
              <div className="hero-ctas">
                <Link href="/shop" className="btn btn-primary">
                  Explore Collection
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="m9 18 6-6-6-6"/>
                  </svg>
                </Link>
                <Link href="/#about" className="btn btn-ghost">Learn More</Link>
              </div>
            </div>

            <div className="hero-right">
              <div ref={productFrameRef} className="hero-product-frame glass glass-heavy">
                <div className="hero-product-placeholder">
                  <span className="hero-placeholder-emoji">✦</span>
                  <span>Hero Product Showcase</span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>Interactive 3D product display</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Strip */}
      <section className="trust-strip">
        <div className="container">
          <div className="trust-items">
            {[
              {
                icon: (
                  <svg className="trust-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                ),
                text: 'Free Shipping Worldwide'
              },
              {
                icon: (
                  <svg className="trust-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M12 6v6l4 2"/>
                  </svg>
                ),
                text: '30-Day Returns'
              },
              {
                icon: (
                  <svg className="trust-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                ),
                text: '24/7 Support'
              },
            ].map((item, i) => (
              <div key={i} className="trust-item glass reveal">
                {item.icon}
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="section" id="categories">
        <div className="container">
          <div className="section-header reveal">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Curated collections for every style</p>
          </div>

          <div className="category-grid">
            {categories.slice(0, 6).map((cat, i) => (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className="category-card glass reveal"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div
                  className="category-image"
                  style={{ background: CATEGORY_GRADIENTS[cat.name] || 'linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))' }}
                >
                  {CATEGORY_EMOJIS[cat.name] || '🛍️'}
                </div>
                <div className="category-overlay">
                  <h3 className="category-name">{cat.name}</h3>
                  <p className="category-count">{cat._count?.products || 0} products</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="container">
          <div className="section-header reveal">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Handpicked favorites from our collection</p>
          </div>

          <div className="product-grid">
            {products.slice(0, 8).map((product, i) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="product-card glass reveal"
                style={{ transitionDelay: `${i * 0.05}s` }}
              >
                <div className="product-image-wrapper">
                  {product.images?.[0]?.url ? (
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].alt || product.name}
                      className="hp-product-img"
                    />
                  ) : (
                    <div className="product-image">
                      <span style={{ fontFamily: 'system-ui', fontSize: 32, display: 'block', marginBottom: 8 }}>
                        {product.category?.name ? (CATEGORY_EMOJIS[product.category.name] || '🛍️') : ['⚡','👜','⌚','🕶️','💡','👕','☕','🧘'][i % 8]}
                      </span>
                      <span style={{ fontSize: 11 }}>{product.name}</span>
                    </div>
                  )}
                  {product.isBest && <span className="product-badge badge-best">Bestseller</span>}
                  {product.isNew && !product.isBest && <span className="product-badge badge-new">New</span>}
                  <button
                    className="product-wishlist"
                    onClick={(e) => handleWishlist(e, product.id, product.name)}
                    aria-label="Add to wishlist"
                  >
                    <svg
                      width="16"
                      height="16"
                      fill={wishlisted.has(product.id) ? 'var(--danger)' : 'none'}
                      stroke={wishlisted.has(product.id) ? 'var(--danger)' : 'currentColor'}
                      viewBox="0 0 24 24"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>

                <div className="product-info">
                  <div className="product-name">{product.name}</div>
                  <div className="product-price">
                    ${product.salePrice ? product.salePrice.toFixed(2) : product.price.toFixed(2)}
                    {product.salePrice && (
                      <span className="product-price-sale">${product.price.toFixed(2)}</span>
                    )}
                  </div>
                </div>

                {product.colors && product.colors.length > 0 && (
                  <div className="product-colors">
                    {product.colors.slice(0, 4).map((color, ci) => (
                      <div key={ci} className="color-dot" style={{ background: color }} />
                    ))}
                  </div>
                )}

                <button
                  className="btn btn-primary product-quick-add"
                  onClick={(e) => handleQuickAdd(e, product)}
                >
                  Quick Add
                </button>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: 56 }}>
            <Link href="/shop" className="btn btn-ghost">
              View All Products
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* About section */}
      <section className="section" id="about">
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <span className="page-eyebrow">About CharFlut</span>
            <h2 className="section-title" style={{ marginTop: 16 }}>Crafted with Precision</h2>
            <p className="section-subtitle" style={{ maxWidth: 640, margin: '16px auto 48px' }}>
              CharFlut is a premium e-commerce destination built around the philosophy that
              beauty and function are inseparable. Our liquid glass design system creates an
              experience unlike any other.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 800, margin: '0 auto' }}>
              {[
                { number: '24K+', label: 'Happy Customers' },
                { number: '1,200+', label: 'Products' },
                { number: '99.8%', label: 'Satisfaction Rate' },
              ].map((stat, i) => (
                <div key={i} className="glass" style={{ padding: '28px 20px', textAlign: 'center', borderRadius: 22 }}>
                  <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 }}>{stat.number}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Toast */}
      {toastVisible && (
        <div className="toast toast-success">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toastMsg}
        </div>
      )}
    </>
  )
}
