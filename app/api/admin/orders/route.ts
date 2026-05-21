import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '200')

    const where: any = {}
    if (status) where.status = status

    const orders = await prisma.order.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: { product: { select: { name: true } } },
        },
      },
    })

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Admin orders GET error:', error)
    return NextResponse.json({ orders: [] }, { status: 500 })
  }
}
