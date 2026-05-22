import Link from 'next/link'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const COLLECTION_GRADIENTS = [
  'linear-gradient(135deg, rgba(255,211,44,0.15) 0%, rgba(124,58,237,0.12) 100%)',
  'linear-gradient(135deg, rgba(0,194,255,0.15) 0%, rgba(124,58,237,0.12) 100%)',
  'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(0,194,255,0.12) 100%)',
  'linear-gradient(135deg, rgba(244,114,182,0.15) 0%, rgba(249,168,212,0.10) 100%)',
  'linear-gradient(135deg, rgba(96,165,250,0.15) 0%, rgba(52,211,153,0.12) 100%)',
  'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(245,158,11,0.10) 100%)',
  'linear-gradient(135deg, rgba(167,139,250,0.15) 0%, rgba(139,92,246,0.12) 100%)',
  'linear-gradient(135deg, rgba(255,92,92,0.12) 0%, rgba(255,211,44,0.12) 100%)',
]

const COLLECTION_EMOJIS = ['✦', '🌟', '🎯', '💫', '⚡', '🎨', '🏆', '💎']

async function getCollections() {
  try {
    return await prisma.collection.findMany({
      where: { published: true },
      include: {
        products: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' }, take: 1 }
              }
            }
          },
          take: 4,
        },
        _count: { select: { products: true } },
      },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    })
  } catch {
    return []
  }
}

const FALLBACK_COLLECTIONS = [
  { id: '1', name: 'Summer Essentials', slug: 'summer-essentials', tagline: 'Everything you need for the perfect summer', description: 'Curated summer must-haves', gradient: COLLECTION_GRADIENTS[0], featured: true, _count: { products: 24 }, products: [] },
  { id: '2', name: 'Tech Innovators', slug: 'tech-innovators', tagline: 'Cutting-edge technology for modern life', description: 'The latest in tech', gradient: COLLECTION_GRADIENTS[1], featured: true, _count: { products: 18 }, products: [] },
  { id: '3', name: 'Minimalist Living', slug: 'minimalist-living', tagline: 'Less is more, always', description: 'Clean lines, pure function', gradient: COLLECTION_GRADIENTS[2], featured: false, _count: { products: 32 }, products: [] },
  { id: '4', name: 'Outdoor Adventure', slug: 'outdoor-adventure', tagline: 'Gear up for the great outdoors', description: 'Nature awaits', gradient: COLLECTION_GRADIENTS[3], featured: false, _count: { products: 15 }, products: [] },
  { id: '5', name: 'Luxury Lounge', slug: 'luxury-lounge', tagline: 'Indulge in the finest', description: 'Premium comfort', gradient: COLLECTION_GRADIENTS[4], featured: false, _count: { products: 20 }, products: [] },
  { id: '6', name: 'Street Style', slug: 'street-style', tagline: 'Fashion meets culture', description: 'Urban expressions', gradient: COLLECTION_GRADIENTS[5], featured: false, _count: { products: 28 }, products: [] },
  { id: '7', name: 'Home Sanctuary', slug: 'home-sanctuary', tagline: 'Transform your living space', description: 'Your perfect retreat', gradient: COLLECTION_GRADIENTS[6], featured: false, _count: { products: 40 }, products: [] },
  { id: '8', name: 'Wellness Journey', slug: 'wellness-journey', tagline: 'Invest in your wellbeing', description: 'Mind, body, spirit', gradient: COLLECTION_GRADIENTS[7], featured: false, _count: { products: 22 }, products: [] },
]

export default async function CollectionsPage() {
  const collectionsRaw = await getCollections()
  const collections = collectionsRaw.length > 0 ? collectionsRaw : FALLBACK_COLLECTIONS
  const featured = collections.filter((c: any) => c.featured).slice(0, 2)
  const rest = collections.filter((c: any) => !c.featured)

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .collections-hero { padding: 140px 0 60px; text-align: center; }
        .featured-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 48px; }
        .featured-card {
          position: relative;
          height: 420px;
          border-radius: 28px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .featured-card:hover { transform: translateY(-6px) scale(1.01); }
        .featured-bg { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 80px; position: relative; }
        .featured-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 32px;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%);
        }
        .featured-eyebrow {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 999px;
          background: rgba(255,211,44,0.2);
          border: 1px solid rgba(255,211,44,0.3);
          color: var(--accent-primary);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .featured-title { font-size: 28px; font-weight: 700; color: #fff; margin-bottom: 6px; }
        .featured-tagline { font-size: 14px; color: rgba(255,255,255,0.75); }
        .featured-count { font-size: 12px; color: rgba(255,255,255,0.55); margin-top: 8px; }

        .collections-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .collection-card {
          border-radius: 22px;
          overflow: hidden;
          cursor: pointer;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          text-decoration: none;
          color: inherit;
          display: block;
        }
        .collection-card:hover { transform: translateY(-6px); }
        .collection-card-image {
          height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 56px;
          position: relative;
        }
        .collection-floating-products {
          position: absolute;
          bottom: 12px;
          right: 12px;
          display: flex;
          gap: -8px;
        }
        .collection-product-bubble {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          margin-left: -10px;
        }
        .collection-info {
          padding: 20px;
          border-top: 1px solid var(--glass-border);
          backdrop-filter: blur(20px);
        }
        .collection-name { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
        [data-theme="light"] .collection-name { color: #0a0a0b !important; }
        .collection-count { font-size: 12px; color: var(--text-muted); }
        .tag-pills { display: flex; gap: 8px; margin-bottom: 48px; overflow-x: auto; -webkit-overflow-scrolling: touch; justify-content: flex-start; scrollbar-width: none; padding-bottom: 4px; }
        .tag-pills::-webkit-scrollbar { display: none; }
        .tag-pill {
          padding: 7px 18px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          transition: all 0.18s;
          font-family: inherit;
        }
        .tag-pill:hover { border-color: var(--accent); color: var(--accent); background: rgba(255,211,44,0.08); }
        .tag-pill.active { background: rgba(255,211,44,0.12); border-color: var(--accent); color: var(--accent); }

        @media (max-width: 1024px) {
          .featured-grid { grid-template-columns: 1fr; }
          .collections-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .collections-hero { padding: 110px 0 40px; }
          .collections-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
          .featured-card { height: 280px; }
          .featured-title { font-size: 22px; }
          .featured-overlay { padding: 20px; }
          .tag-pills { justify-content: flex-start; margin-bottom: 32px; }
        }
        @media (max-width: 480px) {
          .collections-hero { padding: 100px 0 32px; }
          .collections-grid { grid-template-columns: 1fr; gap: 14px; }
          .featured-card { height: 240px; }
          .featured-title { font-size: 18px; }
          .collection-card-image { height: 160px; font-size: 40px; }
          .collection-name { font-size: 15px; }
        }
      ` }} />

      <section className="collections-hero">
        <div className="container">
          <span className="page-eyebrow">Curated for You</span>
          <h1 className="page-title" style={{ marginTop: 12 }}>Collections</h1>
          <p className="page-desc">
            Handpicked selections that tell a story. Each collection is a journey.
          </p>
        </div>
      </section>

      <div className="container" style={{ paddingBottom: 80 }}>
        {/* Tag filters */}
        <div className="tag-pills">
          {['All', 'Featured', 'New', 'Trending', 'Seasonal'].map((tag) => (
            <button key={tag} className={`tag-pill${tag === 'All' ? ' active' : ''}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Featured Collections */}
        {featured.length > 0 && (
          <div className="featured-grid">
            {featured.map((col: any, i: number) => (
              <Link
                key={col.id}
                href={`/collections/${col.slug}`}
                className="featured-card glass"
                style={{ background: COLLECTION_GRADIENTS[i % COLLECTION_GRADIENTS.length] }}
              >
                <div className="featured-bg">
                  {COLLECTION_EMOJIS[i % COLLECTION_EMOJIS.length]}
                </div>
                <div className="featured-overlay">
                  <span className="featured-eyebrow">Featured</span>
                  <h2 className="featured-title">{col.name}</h2>
                  {col.tagline && <p className="featured-tagline">{col.tagline}</p>}
                  <p className="featured-count">{col._count.products} products</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* All Collections Grid */}
        <div className="collections-grid">
          {rest.map((col: any, i: number) => (
            <Link
              key={col.id}
              href={`/collections/${col.slug}`}
              className="collection-card glass"
            >
              <div
                className="collection-card-image"
                style={{ background: COLLECTION_GRADIENTS[(i + 2) % COLLECTION_GRADIENTS.length] }}
              >
                <span>{COLLECTION_EMOJIS[(i + 2) % COLLECTION_EMOJIS.length]}</span>
                {col.products && col.products.length > 0 && (
                  <div className="collection-floating-products">
                    {col.products.slice(0, 3).map((cp: any, j: number) => {
                      const imgUrl = cp.product?.images?.[0]?.url
                      return (
                        <div key={j} className="collection-product-bubble" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={cp.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            ['✦', '★', '◆'][j % 3]
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              <div className="collection-info">
                <div className="collection-name">{col.name}</div>
                {col.tagline && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, lineHeight: 1.4 }}>
                    {col.tagline}
                  </p>
                )}
                <p className="collection-count" style={{ marginTop: 8 }}>{col._count.products} products</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
