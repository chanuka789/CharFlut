import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '24')
    const offset = parseInt(searchParams.get('offset') || '0')
    const featured = searchParams.get('featured')
    const published = searchParams.get('published')
    const slug = searchParams.get('slug')

    const where: any = {}
    if (featured === 'true') where.featured = true
    if (published === 'true') where.published = true
    if (slug) where.slug = slug

    const [collections, total] = await Promise.all([
      prisma.collection.findMany({
        where,
        include: {
          _count: { select: { products: true } },
          products: {
            where: { product: { deletedAt: null } },
            include: {
              product: {
                include: {
                  images: { orderBy: { position: 'asc' }, take: 1 },
                },
              },
            },
            take: 4,
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.collection.count({ where }),
    ])

    return NextResponse.json({ collections, total, offset, limit })
  } catch (error) {
    console.error('Collections GET error:', error)
    return NextResponse.json({ collections: [], total: 0 }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug, tagline, description, gradient, published, featured, curator, tag } = body

    if (!name || !slug) {
      return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
    }

    const collection = await prisma.collection.create({
      data: {
        name,
        slug,
        tagline: tagline || null,
        description: description || null,
        gradient: gradient || null,
        published: !!published,
        featured: !!featured,
        curator: curator || null,
        tag: tag || null,
      },
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json(collection, { status: 201 })
  } catch (error: any) {
    console.error('Collections POST error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A collection with this slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}
