import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ categories: [] }, { status: 500 })
  }
}
