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

    const userId = session.user.id

    // Fetch stats in parallel
    const [orderCount, spentResult, wishlistCount, recentOrders] = await Promise.all([
      prisma.order.count({
        where: { userId },
      }),
      prisma.order.aggregate({
        where: { userId },
        _sum: {
          total: true,
        },
      }),
      prisma.wishlistItem.count({
        where: { userId },
      }),
      prisma.order.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: 'desc' },
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
      }),
    ])

    const totalSpent = spentResult._sum.total || 0
    // Dynamic formula for loyalty points (e.g. 10 points for every dollar spent)
    const loyaltyPoints = Math.floor(totalSpent * 10)

    return NextResponse.json({
      totalOrders: orderCount,
      totalSpent,
      wishlistCount,
      loyaltyPoints,
      recentOrders,
    })
  } catch (error) {
    console.error('Dashboard Stats GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve stats' }, { status: 500 })
  }
}
