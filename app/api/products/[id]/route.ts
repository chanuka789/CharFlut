import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        images: { orderBy: { position: 'asc' } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        collections: {
          include: { collection: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    let catId = categoryId
    if (categoryId && !categoryId.match(/^c[a-z0-9]+$/)) {
      const cat = await prisma.category.findFirst({ where: { slug: categoryId } })
      catId = cat?.id || null
    }

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(shortDesc !== undefined && { shortDesc }),
        ...(price !== undefined && { price: parseFloat(String(price)) }),
        ...(salePrice !== undefined && { salePrice: salePrice ? parseFloat(String(salePrice)) : null }),
        ...(sku !== undefined && { sku }),
        ...(stock !== undefined && { stock: parseInt(String(stock)) }),
        ...(colors !== undefined && { colors }),
        ...(tags !== undefined && { tags }),
        ...(catId !== undefined && { categoryId: catId || null }),
        ...(published !== undefined && { published }),
        ...(featured !== undefined && { featured }),
        ...(isNew !== undefined && { isNew }),
        ...(isBest !== undefined && { isBest }),
      },
      include: { category: true },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Product PUT error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.product.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
