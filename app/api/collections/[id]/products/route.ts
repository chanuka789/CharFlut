import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const products = await prisma.collectionProduct.findMany({
      where: { collectionId: params.id },
      include: {
        product: {
          include: { images: { orderBy: { position: 'asc' }, take: 1 } },
        },
      },
      orderBy: { product: { name: 'asc' } },
    })
    return NextResponse.json({ products: products.map(cp => cp.product) })
  } catch (error) {
    console.error('Collection products GET error:', error)
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { productId } = await req.json()
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    await prisma.collectionProduct.upsert({
      where: { collectionId_productId: { collectionId: params.id, productId } },
      create: { collectionId: params.id, productId },
      update: {},
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collection products POST error:', error)
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    await prisma.collectionProduct.delete({
      where: { collectionId_productId: { collectionId: params.id, productId } },
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Collection products DELETE error:', error)
    return NextResponse.json({ error: 'Failed to remove product' }, { status: 500 })
  }
}
