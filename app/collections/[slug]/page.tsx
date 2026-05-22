import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function getCollection(slug: string) {
  try {
    return await prisma.collection.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { position: 'asc' } }
              }
            }
          }
        },
        _count: { select: { products: true } }
      }
    })
  } catch {
    return null
  }
}

async function getMoreCollections(excludeSlug: string) {
  try {
    return await prisma.collection.findMany({
      where: { published: true, NOT: { slug: excludeSlug } },
      take: 4,
      orderBy: { createdAt: 'desc' }
    })
  } catch {
    return []
  }
}

const GRADIENTS = [
  'linear-gradient(135deg, rgba(255,211,44,0.2) 0%, rgba(124,58,237,0.15) 100%)',
  'linear-gradient(135deg, rgba(0,194,255,0.2) 0%, rgba(124,58,237,0.15) 100%)',
  'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(0,194,255,0.15) 100%)',
]

export default async function CollectionDetailPage({ params }: { params: { slug: string } }) {
  const collection = await getCollection(params.slug)
  const moreCollections = await getMoreCollections(params.slug)

  if (!collection && params.slug !== 'demo') {
    notFound()
  }

  const displayCollection = collection || {
    id: 'demo',
    name: 'Sample Collection',
    slug: params.slug,
    tagline: 'A curated selection of premium products',
    description: 'Explore this handpicked collection featuring the finest products from our catalog.',
    gradient: GRADIENTS[0],
    curator: 'CharFlut Team',
    _count: { products: 0 },
    products: [],
    featured: false,
    published: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    accentColor: null,
    tag: null,
    season: null,
  }

  const products = displayCollection.products.map((cp: any) => cp.product)
  const avgPrice = products.length > 0
    ? products.reduce((sum: number, p: any) => sum + (p.price || 0), 0) / products.length
    : 0

  const categoryCount = new Set(products.map((p: any) => p.category?.name).filter(Boolean)).size

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .collection-hero {
          min-height: 60vh;
          display: flex;
          align-items: flex-end;
          padding: 140px 0 60px;
          position: relative;
          overflow: hidden;
        }
        .collection-hero-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .collection-hero-content { position: relative; z-index: 1; }
        .collection-eyebrow {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 999px;
          background: rgba(255,211,44,0.15);
          border: 1px solid rgba(255,211,44,0.3);
          color: var(--accent-primary);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .collection-title {
          font-size: 72px;
          line-height: 76px;
          font-weight: 700;
          letter-spacing: -0.025em;
          color: var(--text-primary);
          margin-bottom: 16px;
        }
        [data-theme="light"] .collection-title { color: #0a0a0b; }
        .collection-tagline {
          font-size: 20px;
          color: var(--text-secondary);
          max-width: 600px;
          margin-bottom: 24px;
        }

        .stats-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: var(--glass-border);
          border-radius: 16px;
          overflow: hidden;
          margin: 48px 0;
        }
        .stat-item {
          padding: 24px;
          background: var(--glass-fill);
          backdrop-filter: blur(20px);
          text-align: center;
        }
        .stat-value { font-size: 28px; font-weight: 700; color: var(--accent-primary); }
        .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.06em; }

        .products-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          gap: 16px;
        }
        .products-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }

        .more-collections {
          display: flex;
          gap: 20px;
          overflow-x: auto;
          padding-bottom: 12px;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: thin;
        }
        .more-collections::-webkit-scrollbar { height: 4px; }
        .more-collections::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
        .more-coll-card {
          flex-shrink: 0;
          width: 240px;
          height: 160px;
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s var(--spring);
          text-decoration: none;
          color: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          font-size: 48px;
        }
        .more-coll-card:hover { transform: translateY(-4px) scale(1.02); }
        .more-coll-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 14px;
          background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
          font-size: 14px;
          font-weight: 600;
          color: #fff;
        }

        @media (max-width: 1024px) {
          .collection-title { font-size: 52px; line-height: 56px; }
          .products-grid { grid-template-columns: repeat(3, 1fr); }
          .stats-bar { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .collection-title { font-size: 36px; line-height: 40px; }
          .products-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-bar { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .collection-hero { padding: 110px 0 32px; min-height: auto; }
          .collection-title { font-size: 28px; line-height: 32px; }
          .collection-tagline { font-size: 15px; }
          .stats-bar { grid-template-columns: 1fr; gap: 8px; background: transparent; }
          .stat-item { padding: 14px; border-radius: 12px; border: 1px solid var(--glass-border); }
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .products-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .products-header select { width: 100% !important; }
        }
      ` }} />

      {/* Hero */}
      <section className="collection-hero">
        <div
          className="collection-hero-bg"
          style={{ background: displayCollection.gradient || GRADIENTS[0] }}
        />
        <div className="container" style={{ width: '100%' }}>
          <nav className="breadcrumb">
            <Link href="/">Home</Link>
            <span className="sep">›</span>
            <Link href="/collections">Collections</Link>
            <span className="sep">›</span>
            <span className="current">{displayCollection.name}</span>
          </nav>
          <div className="collection-hero-content">
            <span className="collection-eyebrow">✦ Collection</span>
            <h1 className="collection-title">{displayCollection.name}</h1>
            {displayCollection.tagline && (
              <p className="collection-tagline">{displayCollection.tagline}</p>
            )}
            {displayCollection.description && (
              <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 540 }}>
                {displayCollection.description}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* Stats bar */}
        <div className="stats-bar glass">
          <div className="stat-item">
            <div className="stat-value">{displayCollection._count.products}</div>
            <div className="stat-label">Products</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{categoryCount || 1}</div>
            <div className="stat-label">Categories</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{avgPrice > 0 ? `$${avgPrice.toFixed(0)}` : '—'}</div>
            <div className="stat-label">Avg. Price</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{(displayCollection as any).curator || 'CharFlut'}</div>
            <div className="stat-label">Curator</div>
          </div>
        </div>

        {/* Products header */}
        <div className="products-header">
          <h2 style={{ fontSize: 22, fontWeight: 700 }}>Products in this collection</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="f-select" style={{ width: 160, padding: '8px 14px' }}>
              <option>Sort: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No products in this collection yet</p>
            <Link href="/shop" className="btn btn-primary" style={{ marginTop: 16 }}>Browse All Products</Link>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product: any) => {
              const imgUrl = product.images?.[0]?.url
              return (
                <Link key={product.id} href={`/products/${product.slug}`} className="product-card glass">
                  <div className="product-image-wrapper">
                    <div className="product-image" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: '12px', textAlign: 'center' }}>
                          <span style={{ fontFamily: 'system-ui', fontSize: 32, display: 'block', marginBottom: 4 }}>🛍️</span>
                          <span style={{ fontSize: 9, opacity: 0.8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{product.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="product-name" style={{ fontSize: 13, fontWeight: 600, marginTop: 8, padding: '0 8px' }}>{product.name}</div>
                  <div className="product-price" style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent-primary)', padding: '0 8px 8px' }}>
                    ${(product.salePrice !== null && product.salePrice !== undefined ? product.salePrice : product.price).toFixed(2)}
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* More Collections */}
        {moreCollections.length > 0 && (
          <section style={{ marginTop: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>More Collections</h2>
            <div className="more-collections">
              {moreCollections.map((col: any, i: number) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="more-coll-card glass"
                  style={{ background: GRADIENTS[i % GRADIENTS.length] }}
                >
                  <span>{['✦', '★', '◆', '●'][i % 4]}</span>
                  <div className="more-coll-overlay">{col.name}</div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  )
}
