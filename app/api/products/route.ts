import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '24')
    const offset = parseInt(searchParams.get('offset') || '0')
    const category = searchParams.get('category')
    const published = searchParams.get('published')
    const featured = searchParams.get('featured')
    const search = searchParams.get('q') || searchParams.get('search')
    const slug = searchParams.get('slug')
    const sort = searchParams.get('sort') || 'newest'

    const where: any = {}

    if (published === 'true') where.published = true
    if (featured === 'true') where.featured = true
    if (category) {
      where.category = { slug: category }
    }
    if (slug) {
      where.slug = slug
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
      ]
    }

    let orderBy: any = { createdAt: 'desc' }
    if (sort === 'price-asc') orderBy = { price: 'asc' }
    if (sort === 'price-desc') orderBy = { price: 'desc' }
    if (sort === 'name') orderBy = { name: 'asc' }
    if (sort === 'rating') orderBy = { rating: 'desc' }
    if (sort === 'popular') orderBy = { reviewCount: 'desc' }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { position: 'asc' }, take: 1 },
          _count: { select: { reviews: true } },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, offset, limit })
  } catch (error) {
    console.error('Products GET error:', error)
    return NextResponse.json({ products: [], total: 0 }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name, slug, description, shortDesc, price, salePrice, sku, stock,
      colors, tags, categoryId, published, featured, isNew, isBest,
    } = body

    if (!name || !slug || price === undefined) {
      return NextResponse.json({ error: 'Name, slug, and price are required' }, { status: 400 })
    }

    // Find category by slug or id
    let catId = categoryId
    if (categoryId && !categoryId.match(/^c[a-z0-9]+$/)) {
      const cat = await prisma.category.findFirst({ where: { slug: categoryId } })
      catId = cat?.id || null
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description,
        shortDesc,
        price: parseFloat(String(price)),
        salePrice: salePrice ? parseFloat(String(salePrice)) : null,
        sku,
        stock: parseInt(String(stock || 0)),
        colors: colors || [],
        tags: tags || [],
        categoryId: catId || null,
        published: !!published,
        featured: !!featured,
        isNew: !!isNew,
        isBest: !!isBest,
      },
      include: { category: true },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Products POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A product with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
