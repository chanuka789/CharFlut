import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlist = await prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      include: {
        product: {
          include: {
            category: true,
            images: { orderBy: { position: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ wishlist })
  } catch (error) {
    console.error('Wishlist GET error:', error)
    return NextResponse.json({ wishlist: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    // Toggle: if exists, remove; if not, add
    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId: session.user.id, productId } },
    })

    if (existing) {
      await prisma.wishlistItem.delete({
        where: { userId_productId: { userId: session.user.id, productId } },
      })
      return NextResponse.json({ added: false, message: 'Removed from wishlist' })
    } else {
      await prisma.wishlistItem.create({
        data: { userId: session.user.id, productId },
      })
      return NextResponse.json({ added: true, message: 'Added to wishlist' })
    }
  } catch (error) {
    console.error('Wishlist POST error:', error)
    return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    await prisma.wishlistItem.deleteMany({
      where: { userId: session.user.id, productId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Wishlist DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 })
  }
}
