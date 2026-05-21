import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Cart is primarily localStorage-based on the client.
// This API provides server-side cart sync for logged-in users.

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ items: [] })
    }

    // Return empty server cart — client cart is source of truth
    return NextResponse.json({ items: [] })
  } catch (error) {
    console.error('Cart GET error:', error)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, quantity = 1 } = body

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, price: true, salePrice: true, stock: true, published: true },
    })

    if (!product || !product.published) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.stock < quantity) {
      return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      item: {
        productId: product.id,
        name: product.name,
        price: product.salePrice || product.price,
        quantity,
      },
    })
  } catch (error) {
    console.error('Cart POST error:', error)
    return NextResponse.json({ error: 'Failed to process cart action' }, { status: 500 })
  }
}
