'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  salePrice?: number | null
  stock: number
  colors: string[]
  tags: string[]
  isBest: boolean
  isNew: boolean
  featured: boolean
  rating?: number
  reviewCount?: number
  category?: { name: string; slug: string } | null
}

type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'popular' | 'rating' | 'name'
type ViewMode = 'grid4' | 'grid3' | 'list'

const PRICE_RANGES = [
  { label: 'Under $50', min: 0, max: 50 },
  { label: '$50 – $150', min: 50, max: 150 },
  { label: '$150 – $300', min: 150, max: 300 },
  { label: '$300 – $500', min: 300, max: 500 },
  { label: 'Over $500', min: 500, max: Infinity },
]

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'name', label: 'A–Z' },
]

function ShopContent() {
  const searchParams = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category')
    return cat ? [cat] : []
  })
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null)
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sort, setSort] = useState<SortOption>('newest')
  const [view, setView] = useState<ViewMode>('grid4')
  const [perPage, setPerPage] = useState(12)
  const [page, setPage] = useState(1)
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState('')
  const [quickView, setQuickView] = useState<Product | null>(null)
  const [compareList, setCompareList] = useState<string[]>([])

  const searchQuery = searchParams.get('q') || ''

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/products?published=true&limit=100')
        if (res.ok) {
          const data = await res.json()
          setAllProducts(data.products || [])
          const cats = Array.from(new Set(data.products.map((p: Product) => p.category?.name).filter(Boolean))) as string[]
          setCategories(cats)
        }
      } catch {
        setAllProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  const filterAndSort = useCallback(() => {
    let filtered = [...allProducts]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.category?.name.toLowerCase().includes(q)
      )
    }

    // Category
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(p => p.category && selectedCategories.includes(p.category.slug))
    }

    // Price
    if (priceRange) {
      filtered = filtered.filter(p => {
        const price = p.salePrice || p.price
        return price >= priceRange.min && (priceRange.max === Infinity || price <= priceRange.max)
      })
    }

    // Stock
    if (inStockOnly) {
      filtered = filtered.filter(p => p.stock > 0)
    }

    // Sort
    switch (sort) {
      case 'price-asc':
        filtered.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price))
        break
      case 'price-desc':
        filtered.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price))
        break
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'popular':
        filtered.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
        break
      default:
        break
    }

    setProducts(filtered)
    setPage(1)
  }, [allProducts, searchQuery, selectedCategories, priceRange, inStockOnly, sort])

  useEffect(() => {
    filterAndSort()
  }, [filterAndSort])

  const paginatedProducts = products.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(products.length / perPage)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleWishlist = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const handleAddToCart = (product: Product) => {
    try {
      const cart = JSON.parse(localStorage.getItem('cf_cart') || '[]')
      const idx = cart.findIndex((i: any) => i.id === product.id)
      if (idx >= 0) cart[idx].qty = (cart[idx].qty || 1) + 1
      else cart.push({ id: product.id, name: product.name, price: product.salePrice || product.price, qty: 1 })
      localStorage.setItem('cf_cart', JSON.stringify(cart))
      window.dispatchEvent(new Event('cf-cart-change'))
      showToast(`${product.name} added to cart!`)
    } catch {}
  }

  const toggleCompare = (productId: string) => {
    setCompareList(prev => {
      if (prev.includes(productId)) return prev.filter(id => id !== productId)
      if (prev.length >= 3) { showToast('You can compare up to 3 products'); return prev }
      return [...prev, productId]
    })
  }

  const activeFilters: string[] = []
  if (selectedCategories.length > 0) activeFilters.push(...selectedCategories)
  if (priceRange) activeFilters.push(`$${priceRange.min}–${priceRange.max === Infinity ? '∞' : '$' + priceRange.max}`)
  if (inStockOnly) activeFilters.push('In Stock')

  return (
    <>
      <style>{`
        .shop-layout { display: grid; grid-template-columns: 260px 1fr; gap: 32px; padding: 120px 0 80px; }
        .filter-sidebar { position: sticky; top: 100px; height: fit-content; }
        .filter-section { margin-bottom: 28px; }
        .filter-title {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 14px;
        }
        .filter-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 7px 0;
          font-size: 13px;
          color: var(--text-secondary);
          cursor: pointer;
          transition: color 0.15s;
        }
        .filter-option:hover { color: var(--text-primary); }
        .filter-option input[type="checkbox"] { accent-color: var(--accent-primary); width: 15px; height: 15px; }
        .price-chip {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          margin: 4px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          transition: all 0.18s;
          font-family: inherit;
        }
        .price-chip:hover { border-color: var(--accent); color: var(--accent); }
        .price-chip.active { background: rgba(255,211,44,0.12); border-color: var(--accent); color: var(--accent); }
        .sort-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          border-radius: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .sort-count { font-size: 13px; color: var(--text-muted); white-space: nowrap; }
        .sort-options { display: flex; gap: 6px; flex-wrap: wrap; flex: 1; }
        .sort-btn {
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          transition: all 0.18s;
          font-family: inherit;
          white-space: nowrap;
        }
        .sort-btn:hover { border-color: rgba(255,255,255,0.3); color: var(--text-primary); }
        .sort-btn.active { background: rgba(255,211,44,0.12); border-color: var(--accent); color: var(--accent); }
        .view-btns { display: flex; gap: 4px; }
        .view-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s;
        }
        .view-btn:hover, .view-btn.active { border-color: var(--accent); color: var(--accent); background: rgba(255,211,44,0.08); }

        .active-filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px; }
        .active-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          background: rgba(255,211,44,0.10);
          border: 1px solid rgba(255,211,44,0.25);
          color: var(--accent);
        }
        .active-chip button { background: none; border: none; cursor: pointer; color: var(--accent); font-size: 14px; padding: 0; line-height: 1; }

        .products-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
        .products-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .products-list { display: flex; flex-direction: column; gap: 16px; }
        .list-card {
          display: grid;
          grid-template-columns: 120px 1fr auto;
          gap: 20px;
          align-items: center;
          padding: 16px;
          border-radius: 16px;
          text-decoration: none;
          color: inherit;
          transition: transform 0.2s;
        }
        .list-card:hover { transform: translateX(4px); }
        .list-img { width: 120px; height: 120px; border-radius: 12px; overflow: hidden; flex-shrink: 0; }

        .pagination { display: flex; gap: 8px; justify-content: center; margin-top: 48px; }
        .page-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 13px;
          transition: all 0.18s;
          font-family: inherit;
        }
        .page-btn:hover { border-color: var(--accent); color: var(--accent); }
        .page-btn.active { background: rgba(255,211,44,0.12); border-color: var(--accent); color: var(--accent); font-weight: 700; }
        .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .compare-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 16px 32px;
          display: flex;
          align-items: center;
          gap: 16px;
          border-top: 1px solid var(--border);
          background: rgba(10,10,11,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          transform: translateY(100%);
          transition: transform 0.3s var(--spring);
        }
        .compare-bar.visible { transform: translateY(0); }

        .qv-modal { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; padding: 32px; }
        .qv-img { aspect-ratio: 1; border-radius: 16px; overflow: hidden; }
        .qty-stepper { display: flex; align-items: center; gap: 12px; }
        .qty-btn {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.06);
          color: var(--text-primary);
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .qty-btn:hover { border-color: var(--accent); color: var(--accent); }

        @media (max-width: 1024px) {
          .shop-layout { grid-template-columns: 1fr; }
          .filter-sidebar { position: static; display: none; }
          .products-grid-4 { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .shop-layout { padding: 100px 0 60px; }
          .products-grid-4, .products-grid-3 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .products-grid-4, .products-grid-3 { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
      `}</style>

      <div className="container">
        {/* Page header */}
        <div style={{ paddingTop: 120, paddingBottom: 40, textAlign: 'center' }}>
          <span className="page-eyebrow">Discover</span>
          <h1 className="page-title" style={{ marginTop: 12 }}>Shop All Products</h1>
          <p className="page-desc">
            {searchQuery
              ? `Results for "${searchQuery}" — ${products.length} products found`
              : `Browse our curated collection of ${allProducts.length || '1,200+'} premium products`}
          </p>
        </div>

        <div className="shop-layout" style={{ paddingTop: 0 }}>
          {/* Sidebar */}
          <aside className="filter-sidebar">
            <div className="panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Filters</h3>
                {activeFilters.length > 0 && (
                  <button
                    className="btn-xs btn-g"
                    onClick={() => {
                      setSelectedCategories([])
                      setPriceRange(null)
                      setInStockOnly(false)
                    }}
                  >
                    Clear all
                  </button>
                )}
              </div>

              {/* Category filter */}
              {categories.length > 0 && (
                <div className="filter-section">
                  <div className="filter-title">Category</div>
                  {categories.map(cat => (
                    <label key={cat} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'))}
                        onChange={() => {
                          const slug = cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')
                          setSelectedCategories(prev =>
                            prev.includes(slug)
                              ? prev.filter(c => c !== slug)
                              : [...prev, slug]
                          )
                        }}
                      />
                      {cat}
                    </label>
                  ))}
                </div>
              )}

              {/* Price range */}
              <div className="filter-section">
                <div className="filter-title">Price Range</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {PRICE_RANGES.map(range => (
                    <button
                      key={range.label}
                      className={`price-chip${priceRange?.min === range.min && priceRange?.max === range.max ? ' active' : ''}`}
                      onClick={() =>
                        setPriceRange(prev =>
                          prev?.min === range.min && prev?.max === range.max
                            ? null
                            : { min: range.min, max: range.max }
                        )
                      }
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="filter-section">
                <div className="filter-title">Availability</div>
                <label className="filter-option">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={e => setInStockOnly(e.target.checked)}
                  />
                  In Stock Only
                </label>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main>
            {/* Active filters */}
            {activeFilters.length > 0 && (
              <div className="active-filters">
                {activeFilters.map(filter => (
                  <div key={filter} className="active-chip">
                    {filter}
                    <button onClick={() => {
                      if (filter === 'In Stock') setInStockOnly(false)
                      else if (filter.startsWith('$')) setPriceRange(null)
                      else setSelectedCategories(prev => prev.filter(c => c !== filter))
                    }}>×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Sort bar */}
            <div className="sort-bar glass">
              <span className="sort-count">{products.length} products</span>
              <div className="sort-options">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`sort-btn${sort === opt.value ? ' active' : ''}`}
                    onClick={() => setSort(opt.value as SortOption)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <select
                  value={perPage}
                  onChange={e => setPerPage(Number(e.target.value))}
                  className="f-select"
                  style={{ width: 80, padding: '6px 10px' }}
                >
                  <option value={12}>12</option>
                  <option value={24}>24</option>
                  <option value={48}>48</option>
                </select>
                <div className="view-btns">
                  <button className={`view-btn${view === 'grid4' ? ' active' : ''}`} onClick={() => setView('grid4')} title="4 columns">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="0" y="0" width="5" height="5"/><rect x="7" y="0" width="5" height="5"/>
                      <rect x="0" y="7" width="5" height="5"/><rect x="7" y="7" width="5" height="5"/>
                    </svg>
                  </button>
                  <button className={`view-btn${view === 'grid3' ? ' active' : ''}`} onClick={() => setView('grid3')} title="3 columns">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="0" y="0" width="3" height="12"/><rect x="4.5" y="0" width="3" height="12"/>
                      <rect x="9" y="0" width="3" height="12"/>
                    </svg>
                  </button>
                  <button className={`view-btn${view === 'list' ? ' active' : ''}`} onClick={() => setView('list')} title="List">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                      <rect x="0" y="0" width="12" height="3"/><rect x="0" y="4.5" width="12" height="3"/>
                      <rect x="0" y="9" width="12" height="3"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            {loading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                Loading products...
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                <p style={{ fontSize: 18, marginBottom: 8 }}>No products found</p>
                <p style={{ fontSize: 14 }}>Try adjusting your filters</p>
              </div>
            ) : (
              <>
                {view === 'list' ? (
                  <div className="products-list">
                    {paginatedProducts.map(product => (
                      <Link key={product.id} href={`/products/${product.slug}`} className="list-card glass">
                        <div className="list-img">
                          <div className="product-image" style={{ width: '100%', height: '100%' }}>
                            <span style={{ fontSize: 40 }}>
                              {product.category?.name === 'Electronics' ? '⚡' :
                               product.category?.name === 'Fashion' ? '👗' :
                               product.category?.name === 'Beauty' ? '✨' : '🛍️'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                            {product.category?.name}
                          </div>
                          <div className="product-name" style={{ fontSize: 16, marginBottom: 8 }}>{product.name}</div>
                          <div className="product-price">${(product.salePrice || product.price).toFixed(2)}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button className="btn btn-primary btn-sm" onClick={e => { e.preventDefault(); handleAddToCart(product) }}>Add to Cart</button>
                          <button className="btn btn-ghost btn-sm" onClick={e => { e.preventDefault(); setQuickView(product) }}>Quick View</button>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className={view === 'grid4' ? 'products-grid-4' : 'products-grid-3'}>
                    {paginatedProducts.map((product) => (
                      <Link key={product.id} href={`/products/${product.slug}`} className="product-card glass">
                        <div className="product-image-wrapper">
                          <div className="product-image">
                            <span style={{ fontFamily: 'system-ui', fontSize: 40, display: 'block', marginBottom: 8 }}>
                              {product.category?.name === 'Electronics' ? '⚡' :
                               product.category?.name === 'Fashion' ? '👗' :
                               product.category?.name === 'Beauty' ? '✨' :
                               product.category?.name === 'Sports' ? '🏃' :
                               product.category?.name === 'Accessories' ? '💎' : '🛍️'}
                            </span>
                            <span style={{ fontSize: 10 }}>{product.name}</span>
                          </div>
                          {product.isBest && <span className="product-badge badge-best">Bestseller</span>}
                          {product.isNew && !product.isBest && <span className="product-badge badge-new">New</span>}
                          {product.stock === 0 && <span className="product-badge badge-out">Sold Out</span>}
                          {product.salePrice && <span className="product-badge badge-sale" style={{ top: 12, left: product.isBest || product.isNew ? 80 : 12 }}>Sale</span>}
                          <button
                            className="product-wishlist"
                            onClick={e => handleWishlist(e, product.id)}
                            aria-label="Add to wishlist"
                          >
                            <svg width="16" height="16" fill={wishlisted.has(product.id) ? 'var(--danger)' : 'none'} stroke={wishlisted.has(product.id) ? 'var(--danger)' : 'currentColor'} viewBox="0 0 24 24">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                          </button>
                          <button
                            style={{
                              position: 'absolute', bottom: 8, left: 8, right: 8,
                              padding: '8px', borderRadius: 8,
                              background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: 'white', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer', fontFamily: 'inherit',
                              opacity: 0, transition: 'opacity 0.2s',
                            }}
                            className="quick-view-btn"
                            onClick={e => { e.preventDefault(); setQuickView(product) }}
                          >
                            Quick View
                          </button>
                        </div>
                        <div className="product-info">
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{product.category?.name}</div>
                          <div className="product-name">{product.name}</div>
                          <div className="product-price">
                            ${(product.salePrice || product.price).toFixed(2)}
                            {product.salePrice && <span className="product-price-sale">${product.price.toFixed(2)}</span>}
                          </div>
                        </div>
                        {product.colors.length > 0 && (
                          <div className="product-colors">
                            {product.colors.slice(0, 4).map((c, i) => (
                              <div key={i} className="color-dot" style={{ background: c }} />
                            ))}
                          </div>
                        )}
                        <button
                          className="btn btn-primary product-quick-add"
                          onClick={e => { e.preventDefault(); handleAddToCart(product) }}
                        >
                          Add to Cart
                        </button>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-muted)', marginTop: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={compareList.includes(product.id)} onChange={() => toggleCompare(product.id)} style={{ accentColor: 'var(--accent)' }} />
                          Compare
                        </label>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>
                      ‹
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      const pg = i + 1
                      return (
                        <button
                          key={pg}
                          className={`page-btn${page === pg ? ' active' : ''}`}
                          onClick={() => setPage(pg)}
                        >
                          {pg}
                        </button>
                      )
                    })}
                    <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickView && (
        <div className="modal-overlay" onClick={() => setQuickView(null)}>
          <div className="modal-content glass" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setQuickView(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}
            >
              ×
            </button>
            <div className="qv-modal">
              <div className="qv-img">
                <div className="product-image" style={{ height: '100%', width: '100%', minHeight: 300, fontSize: 80, flexDirection: 'column', gap: 12 }}>
                  <span>
                    {quickView.category?.name === 'Electronics' ? '⚡' :
                     quickView.category?.name === 'Fashion' ? '👗' : '🛍️'}
                  </span>
                </div>
              </div>
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                  {quickView.category?.name}
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>{quickView.name}</h2>
                <div className="product-price" style={{ fontSize: 24, marginBottom: 20 }}>
                  ${(quickView.salePrice || quickView.price).toFixed(2)}
                </div>
                {quickView.colors.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Colors</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {quickView.colors.map((c, i) => (
                        <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: '2px solid var(--border)', cursor: 'pointer' }} />
                      ))}
                    </div>
                  </div>
                )}
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>Quantity</div>
                  <div className="qty-stepper">
                    <button className="qty-btn">−</button>
                    <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>1</span>
                    <button className="qty-btn">+</button>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }} onClick={() => { handleAddToCart(quickView); setQuickView(null) }}>
                  Add to Cart
                </button>
                <Link href={`/products/${quickView.slug}`} className="btn btn-ghost" style={{ width: '100%', textAlign: 'center' }}>
                  View Full Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compare Bar */}
      <div className={`compare-bar${compareList.length > 0 ? ' visible' : ''}`}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>Comparing {compareList.length} products</span>
        <button className="btn btn-primary btn-sm" onClick={() => {}}>Compare Now</button>
        <button className="btn btn-ghost btn-sm" onClick={() => setCompareList([])}>Clear</button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="toast toast-success">
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {toast}
        </div>
      )}

      <style>{`
        .product-card:hover .quick-view-btn { opacity: 1 !important; }
      `}</style>
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '200px 0', color: 'var(--text-muted)' }}>
        Loading shop...
      </div>
    }>
      <ShopContent />
    </Suspense>
  )
}
