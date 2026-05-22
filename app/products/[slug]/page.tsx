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
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes panelReveal {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes galleryReveal {
          from {
            opacity: 0;
            transform: scale(0.97) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .pdp-layout {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 56px;
          align-items: start;
          padding: 140px 0 80px;
        }

        .gallery {
          position: sticky;
          top: 100px;
          animation: galleryReveal 0.6s var(--spring) forwards;
        }

        .gallery-main {
          aspect-ratio: 1;
          border-radius: 28px;
          overflow: hidden;
          margin-bottom: 16px;
          cursor: zoom-in;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.15);
          transition: all 0.3s var(--ease);
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
        }

        .gallery-main:hover {
          transform: scale(1.01);
          border-color: rgba(255, 211, 44, 0.3);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(255, 211, 44, 0.1);
        }

        [data-theme="light"] .gallery-main {
          background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%);
          border-color: rgba(0, 0, 0, 0.08);
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.95);
        }

        [data-theme="light"] .gallery-main:hover {
          border-color: rgba(181, 144, 30, 0.3);
          box-shadow: 
            0 25px 50px rgba(0, 0, 0, 0.08),
            0 0 20px rgba(181, 144, 30, 0.08);
        }

        .gallery-main-placeholder {
          width: 100%;
          height: 100%;
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

        .gallery-thumbs {
          display: flex;
          gap: 12px;
          padding: 2px 0;
        }

        .gallery-thumb {
          width: 80px;
          height: 80px;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: all 0.25s var(--spring);
          flex-shrink: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
        }

        [data-theme="light"] .gallery-thumb {
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.04);
        }

        .gallery-thumb:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .gallery-thumb.active {
          border-color: var(--accent-primary);
          transform: scale(1.05) translateY(-2px);
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.25),
            0 0 12px rgba(255, 211, 44, 0.3);
        }

        [data-theme="light"] .gallery-thumb.active {
          box-shadow: 
            0 8px 16px rgba(0, 0, 0, 0.08),
            0 0 12px rgba(181, 144, 30, 0.2);
        }

        .thumb-inner {
          width: 100%;
          height: 100%;
          border: 1px dashed var(--glass-border);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }

        /* Product Info Panel - Floating Liquid Glass styling */
        .pdp-panel {
          padding: 10px 0;
          animation: panelReveal 0.6s var(--spring) forwards;
        }

        /* Applying stagger effect to panel items */
        .pdp-panel > * {
          animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .pdp-panel > *:nth-child(1) { animation-delay: 0.1s; }
        .pdp-panel > *:nth-child(2) { animation-delay: 0.14s; }
        .pdp-panel > *:nth-child(3) { animation-delay: 0.18s; }
        .pdp-panel > *:nth-child(4) { animation-delay: 0.22s; }
        .pdp-panel > *:nth-child(5) { animation-delay: 0.26s; }
        .pdp-panel > *:nth-child(6) { animation-delay: 0.30s; }
        .pdp-panel > *:nth-child(7) { animation-delay: 0.34s; }
        .pdp-panel > *:nth-child(8) { animation-delay: 0.38s; }
        .pdp-panel > *:nth-child(9) { animation-delay: 0.42s; }

        .pdp-panel h1 {
          font-size: 40px;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: var(--text-primary);
          margin-bottom: 12px;
          line-height: 1.15;
        }
        [data-theme="light"] .pdp-panel h1 { color: #0a0a0b; }
        
        .pdp-rating { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }
        
        .pdp-price {
          font-size: 36px;
          font-weight: 800;
          color: var(--accent-primary);
          margin-bottom: 28px;
          letter-spacing: -0.01em;
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        [data-theme="light"] .pdp-price { color: #B5901E !important; }

        .option-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .colors-row { display: flex; gap: 12px; margin-bottom: 28px; }
        
        .color-swatch {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          position: relative;
          transition: all 0.25s var(--spring);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
        }
        .color-swatch:hover {
          transform: scale(1.1);
        }
        .color-swatch.active {
          border-color: #fff;
          transform: scale(1.2);
          box-shadow: 0 0 0 3px var(--accent-primary), 0 4px 12px rgba(255,211,44,0.4);
        }
        [data-theme="light"] .color-swatch.active {
          border-color: #fff;
          box-shadow: 0 0 0 3px var(--accent-primary), 0 4px 12px rgba(181,144,30,0.3);
        }

        .connectivity-pills { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 28px; }
        
        .conn-pill {
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.04);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.22s var(--spring);
        }
        .conn-pill:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
          transform: translateY(-1px);
        }
        .conn-pill.active {
          border-color: var(--accent);
          color: #0a0a0b;
          background: var(--accent);
          font-weight: 700;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(255,211,44,0.25);
        }
        [data-theme="light"] .conn-pill {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.08);
        }
        [data-theme="light"] .conn-pill.active {
          color: #0a0a0b;
          background: var(--accent-primary);
          border-color: var(--accent-primary);
        }

        .qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; }
        
        .qty-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          border: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.04);
          color: var(--text-primary);
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s var(--spring);
        }
        .qty-btn:hover {
          border-color: rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.08);
          color: var(--accent);
        }
        .qty-btn:active {
          transform: scale(0.92);
        }
        .qty-value { font-size: 18px; font-weight: 700; min-width: 32px; text-align: center; }

        .cta-row { display: flex; gap: 12px; margin-bottom: 28px; }
        
        .btn.btn-primary {
          background: var(--accent-primary);
          color: #0a0a0b;
          font-weight: 700;
          border-radius: 16px;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
          cursor: pointer;
          transition: all 0.25s var(--spring);
          box-shadow: 0 4px 20px rgba(255,211,44,0.25);
          position: relative;
          overflow: hidden;
        }
        .btn.btn-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(255,211,44,0.35);
        }
        .btn.btn-primary:active {
          transform: translateY(0) scale(0.97);
        }
        .btn.btn-primary:disabled {
          background: rgba(255,255,255,0.1);
          color: var(--text-muted);
          box-shadow: none;
          cursor: not-allowed;
          transform: none;
        }
        
        .btn.btn-ghost {
          background: rgba(255,255,255,0.04);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          font-weight: 600;
          border-radius: 16px;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s var(--ease);
        }
        .btn.btn-ghost:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-1px);
        }
        .btn.btn-ghost:active {
          transform: scale(0.95);
        }
        [data-theme="light"] .btn.btn-ghost {
          background: rgba(0,0,0,0.03);
          border-color: rgba(0,0,0,0.06);
          color: #0a0a0b;
        }
        [data-theme="light"] .btn.btn-ghost:hover {
          background: rgba(0,0,0,0.06);
          border-color: rgba(0,0,0,0.12);
        }

        .trust-badges {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin: 32px 0;
        }
        .trust-badge {
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid var(--glass-border);
          border-radius: 20px;
          padding: 18px 12px;
          text-align: center;
          transition: all 0.25s var(--spring);
        }
        .trust-badge:hover {
          transform: translateY(-4px);
          border-color: rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.07);
        }
        [data-theme="light"] .trust-badge {
          background: linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.5) 100%);
          border-color: rgba(0,0,0,0.06);
        }
        .trust-badge-icon { font-size: 26px; margin-bottom: 8px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15)); }
        .trust-badge-title { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .trust-badge-sub { font-size: 11px; color: var(--text-muted); }
        [data-theme="light"] .trust-badge-title { color: #0a0a0b; }

        .tabs {
          display: flex;
          gap: 4px;
          margin: 40px 0 0;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tab-btn {
          padding: 14px 24px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          border: none;
          background: none;
          transition: all 0.25s ease;
          position: relative;
          white-space: nowrap;
        }
        .tab-btn:hover {
          color: var(--text-secondary);
        }
        .tab-btn.active {
          color: var(--accent-primary);
        }
        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent-primary);
          border-radius: 999px;
          box-shadow: 0 0 8px rgba(255,211,44,0.6);
          animation: tabSlide 0.3s ease;
        }
        @keyframes tabSlide {
          from { transform: scaleX(0.4); opacity: 0; }
          to { transform: scaleX(1); opacity: 1; }
        }
        
        .tab-content { padding: 28px 0; }
        .desc-content { font-size: 15px; line-height: 1.8; color: var(--text-secondary); }
        [data-theme="light"] .desc-content { color: rgba(0,0,0,0.74); }

        .spec-table { width: 100%; border-collapse: collapse; }
        .spec-table tr { border-bottom: 1px solid var(--border); }
        .spec-table td { padding: 14px 0; font-size: 13px; }
        .spec-table td:first-child { color: var(--text-muted); width: 40%; }
        .spec-table td:last-child { color: var(--text-primary); font-weight: 600; }
        [data-theme="light"] .spec-table td:last-child { color: #0a0a0b; }

        .review-card {
          margin-bottom: 20px;
          padding: 24px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%);
          border: 1px solid var(--glass-border);
          transition: all 0.25s ease;
        }
        [data-theme="light"] .review-card {
          background: linear-gradient(135deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.5) 100%);
          border-color: rgba(0,0,0,0.06);
        }
        .review-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.18);
        }
        .review-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .review-name { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
        .review-date { font-size: 12px; color: var(--text-muted); }
        .review-title { font-size: 15px; font-weight: 700; margin-bottom: 8px; color: var(--text-primary); }
        [data-theme="light"] .review-title { color: #0a0a0b; }
        .review-body { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; }
        [data-theme="light"] .review-body { color: rgba(0,0,0,0.74); }
        .verified-badge { font-size: 10px; color: var(--success); font-weight: 700; background: rgba(52,211,153,0.12); padding: 2px 6px; border-radius: 999px; }

        /* Sticky bottom action bar - Floating capsule style */
        .sticky-bottom {
          position: fixed;
          bottom: 20px;
          left: 20px;
          right: 20px;
          z-index: 100;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          border-radius: 24px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(10,10,11,0.85);
          backdrop-filter: blur(32px) saturate(180%);
          -webkit-backdrop-filter: blur(32px) saturate(180%);
          box-shadow: 0 10px 40px -10px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15);
          transform: translateY(150%);
          transition: transform 0.4s var(--spring);
        }
        .sticky-bottom.visible {
          transform: translateY(0);
        }
        [data-theme="light"] .sticky-bottom {
          background: rgba(255,255,255,0.85);
          border-color: rgba(0,0,0,0.08);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.9);
        }

        /* Lightbox */
        .lightbox {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          z-index: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease;
        }
        .lightbox-content {
          width: 85vmin;
          height: 85vmin;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 30px 70px rgba(0,0,0,0.8);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .lightbox-close {
          position: absolute;
          top: 24px;
          right: 24px;
          width: 44px;
          height: 44px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 50%;
          cursor: pointer;
          color: #fff;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .lightbox-close:hover {
          background: rgba(255,255,255,0.15);
          transform: scale(1.05);
        }

        /* Responsiveness breakdown */
        @media (max-width: 1024px) {
          .pdp-layout {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 120px 16px 60px;
          }
          .gallery { position: static; }
        }
        
        @media (max-width: 768px) {
          .pdp-layout {
            padding: 100px 12px 60px;
            gap: 24px;
          }
          
          /* Gallery layout optimized: square box to display images with absolute precision */
          .gallery-main {
            width: 100%;
            height: auto;
            aspect-ratio: 1 / 1;
            border-radius: 24px;
            margin-bottom: 12px;
          }

          .gallery-thumbs {
            overflow-x: auto;
            padding: 4px 0;
            margin-bottom: 4px;
            -webkit-overflow-scrolling: touch;
            gap: 12px;
            display: flex;
          }
          .gallery-thumbs::-webkit-scrollbar { display: none; }
          .gallery-thumb {
            width: 72px;
            height: 72px;
            border-radius: 14px;
          }
          .gallery-thumb.active {
            transform: scale(1.04);
          }

          /* Floating Glass Info Panel: Removed overlapping negative margin, added clean spacer and premium layout bounds */
          .pdp-panel {
            background: linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%);
            backdrop-filter: blur(40px) saturate(180%);
            -webkit-backdrop-filter: blur(40px) saturate(180%);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 28px;
            padding: 28px 20px;
            margin-top: 8px; /* Removed negative margin overlap to fix half-hidden thumbnails */
            position: relative;
            z-index: 10;
            box-shadow: 0 15px 35px rgba(0,0,0,0.25);
            animation: panelReveal 0.65s var(--spring) 0.1s both;
          }
          [data-theme="light"] .pdp-panel {
            background: linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.65) 100%);
            border-color: rgba(0,0,0,0.08);
            box-shadow: 0 12px 28px rgba(0,0,0,0.05);
          }

          .pdp-panel h1 { font-size: 28px; line-height: 1.2; }
          .pdp-price { font-size: 28px; margin-bottom: 20px; }

          .breadcrumb {
            flex-wrap: wrap;
            font-size: 12px;
            gap: 6px 8px;
          }

          .tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            padding-bottom: 4px;
          }
          .tabs::-webkit-scrollbar { display: none; }
          .tab-btn {
            padding: 12px 18px;
            font-size: 13px;
          }
          
          /* Balanced trust badges layout for tablets & smaller devices */
          .trust-badges {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin: 24px 0;
          }
          .trust-badge {
            padding: 12px 6px;
            border-radius: 14px;
          }
          .trust-badge-icon { font-size: 20px; margin-bottom: 4px; }
          .trust-badge-title { font-size: 11px; }
          .trust-badge-sub { display: none; }
          
          /* Perfect two-row call-to-action alignment for zero awkward wrapping */
          .cta-row {
            display: grid !important;
            grid-template-columns: 1fr 48px !important;
            grid-template-rows: auto auto !important;
            gap: 10px !important;
            margin-bottom: 24px;
          }
          .cta-row .btn.btn-primary {
            grid-column: 1 / span 2 !important;
            width: 100% !important;
            min-width: 0 !important;
            padding: 14px 20px !important;
            font-size: 14px !important;
            height: 48px !important;
          }
          .cta-row .btn.btn-ghost:nth-of-type(1) {
            grid-column: 1 !important;
            width: 100% !important;
            min-width: 0 !important;
            padding: 14px 20px !important;
            font-size: 14px !important;
            height: 48px !important;
          }
          .cta-row .btn.btn-ghost:nth-of-type(2) {
            grid-column: 2 !important;
            width: 48px !important;
            height: 48px !important;
            padding: 0 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          .sticky-bottom {
            bottom: 12px;
            left: 12px;
            right: 12px;
            padding: 12px 18px;
            border-radius: 20px;
          }
        }

        @media (max-width: 480px) {
          .pdp-layout {
            padding: 90px 8px 60px;
            gap: 16px;
          }
          
          .pdp-panel {
            padding: 24px 16px;
            border-radius: 24px;
          }
          .pdp-panel h1 { font-size: 24px; }
          .pdp-price { font-size: 24px; }
          
          .connectivity-pills { gap: 6px; }
          .conn-pill { padding: 6px 12px; font-size: 11px; }

          /* Stacking the quantity stock selector status cleanly */
          .qty-row {
            flex-wrap: wrap;
            gap: 10px 14px;
            margin-bottom: 24px;
          }
          .qty-row span:last-child {
            margin-left: 0 !important;
            width: 100%;
            font-size: 11.5px !important;
          }

          /* Listing trust badges vertically on small mobile viewports for premium legibility */
          .trust-badges {
            grid-template-columns: 1fr;
            gap: 8px;
            margin: 20px 0;
          }
          .trust-badge {
            display: flex;
            align-items: center;
            gap: 12px;
            text-align: left;
            padding: 10px 16px;
            border-radius: 14px;
          }
          .trust-badge-icon {
            font-size: 18px;
            margin-bottom: 0;
          }
          .trust-badge-title {
            font-size: 12.5px;
          }
          .trust-badge-sub {
            display: inline;
            font-size: 11px;
            opacity: 0.8;
            margin-left: 4px;
          }
          
          .sticky-bottom {
            flex-direction: row;
            align-items: center;
            gap: 10px;
            bottom: calc(12px + env(safe-area-inset-bottom, 0px));
          }
          .sticky-bottom > div:first-child {
            display: none;
          }
          .sticky-bottom > div:last-child {
            display: flex;
            gap: 8px;
            flex: 1;
          }
          .sticky-bottom > div:last-child .btn.btn-primary {
            flex: 2;
            padding: 12px 16px;
            font-size: 13px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(255,211,44,0.2);
          }
          .sticky-bottom > div:last-child .btn.btn-ghost {
            flex: 1;
            padding: 12px 12px;
            font-size: 13px;
            border-radius: 14px;
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--glass-border);
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          [data-theme="light"] .sticky-bottom > div:last-child .btn.btn-ghost {
            background: rgba(0,0,0,0.03);
            border-color: rgba(0,0,0,0.06);
            color: #0a0a0b;
          }
        }
      ` }} />

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
