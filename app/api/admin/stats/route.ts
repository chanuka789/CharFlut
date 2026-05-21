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

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      ordersThisMonth,
      ordersLastMonth,
      customersThisMonth,
      customersLastMonth,
      totalProducts,
      totalCollections,
      recentOrders,
      lowStock,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: lastMonthStart, lt: monthStart } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: monthStart } } }),
      prisma.user.count({ where: { role: 'CUSTOMER', createdAt: { gte: lastMonthStart, lt: monthStart } } }),
      prisma.product.count(),
      prisma.collection.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: {
            include: { product: { select: { name: true } } },
            take: 1,
          },
        },
      }),
      prisma.product.findMany({
        where: { stock: { lt: 5 }, published: true },
        select: { id: true, name: true, stock: true, sku: true },
        orderBy: { stock: 'asc' },
        take: 8,
      }),
    ])

    const revenueThisMonth = ordersThisMonth._sum.total || 0
    const revenueLastMonth = ordersLastMonth._sum.total || 0
    const revenueGrowth = revenueLastMonth > 0
      ? ((revenueThisMonth - revenueLastMonth) / revenueLastMonth * 100).toFixed(1)
      : null

    const ordersCount = ordersThisMonth._count
    const ordersLastCount = ordersLastMonth._count
    const ordersGrowth = ordersLastCount > 0
      ? ((ordersCount - ordersLastCount) / ordersLastCount * 100).toFixed(1)
      : null

    const customersGrowth = customersLastMonth > 0
      ? ((customersThisMonth - customersLastMonth) / customersLastMonth * 100).toFixed(1)
      : null

    return NextResponse.json({
      revenue: { current: revenueThisMonth, growth: revenueGrowth },
      orders: { current: ordersCount, growth: ordersGrowth },
      customers: { current: customersThisMonth, growth: customersGrowth },
      totalProducts,
      totalCollections,
      recentOrders,
      lowStock,
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
