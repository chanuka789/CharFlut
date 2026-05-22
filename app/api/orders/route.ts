import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Fetch orders list for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
                images: { orderBy: { position: 'asc' } },
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Orders GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve orders' }, { status: 500 })
  }
}

// Secure checkout to create an order from client-side cart
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { items, address } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // Run checkout validation and creation in a secure transactional block
    const newOrder = await prisma.$transaction(async (tx) => {
      let orderTotal = 0
      const orderItemsData = []

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.id },
        })

        if (!product || !product.published || product.deletedAt) {
          throw new Error(`Product "${item.name}" is no longer available.`)
        }

        const quantity = parseInt(String(item.qty || item.quantity || 1))
        if (product.stock < quantity) {
          throw new Error(`Insufficient stock for "${product.name}". Only ${product.stock} units left.`)
        }

        // Securely lock price from database rather than relying on client input
        const activePrice = product.salePrice !== null ? product.salePrice : product.price
        const itemSubtotal = activePrice * quantity
        orderTotal += itemSubtotal

        // Decrement catalog inventory stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: quantity } },
        })

        orderItemsData.push({
          productId: product.id,
          quantity,
          price: activePrice,
        })
      }

      // Create the order in the database
      const order = await tx.order.create({
        data: {
          userId: session.user.id,
          status: 'PENDING',
          total: orderTotal,
          address: address || 'No address specified',
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { position: 'asc' } },
                },
              },
            },
          },
        },
      })

      return order
    })

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 })
  } catch (error: any) {
    console.error('Checkout / Order POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete checkout' }, { status: 400 })
  }
}
