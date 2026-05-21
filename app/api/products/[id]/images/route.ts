import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const images = await prisma.productImage.findMany({
      where: { productId: params.id },
      orderBy: { position: 'asc' },
    })
    return NextResponse.json({ images })
  } catch (error) {
    console.error('Product images GET error:', error)
    return NextResponse.json({ images: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, alt, position } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const maxPos = await prisma.productImage.aggregate({
      where: { productId: params.id },
      _max: { position: true },
    })
    const nextPos = position ?? ((maxPos._max.position ?? -1) + 1)

    const image = await prisma.productImage.create({
      data: { productId: params.id, url, alt: alt || null, position: nextPos },
    })
    return NextResponse.json(image, { status: 201 })
  } catch (error) {
    console.error('Product images POST error:', error)
    return NextResponse.json({ error: 'Failed to add image' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const imageId = searchParams.get('imageId')
    if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })

    await prisma.productImage.delete({ where: { id: imageId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product images DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
  }
}
