import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const collection = await prisma.collection.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { products: true } },
        products: {
          where: { product: { deletedAt: null } },
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { position: 'asc' }, take: 1 },
              },
            },
          },
          orderBy: { productId: 'asc' },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error) {
    console.error('Collection GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, slug, tagline, description, gradient, published, featured, curator, tag } = body

    const collection = await prisma.collection.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(tagline !== undefined && { tagline: tagline || null }),
        ...(description !== undefined && { description: description || null }),
        ...(gradient !== undefined && { gradient: gradient || null }),
        ...(published !== undefined && { published }),
        ...(featured !== undefined && { featured }),
        ...(curator !== undefined && { curator: curator || null }),
        ...(tag !== undefined && { tag: tag || null }),
      },
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json(collection)
  } catch (error: any) {
    console.error('Collection PUT error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update collection' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.collection.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collection DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete collection' }, { status: 500 })
  }
}
