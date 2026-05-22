import { Suspense } from 'react'
import { prisma } from '@/lib/prisma'
import { HomepageClient } from './HomepageClient'

export const dynamic = 'force-dynamic'

async function getFeaturedProducts() {
  try {
    const products = await prisma.product.findMany({
      where: { published: true, featured: true },
      include: { category: true, images: { orderBy: { position: 'asc' } } },
      take: 8,
      orderBy: { createdAt: 'desc' },
    })
    return products
  } catch {
    return []
  }
}

async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
    })
    return categories
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [products, categories] = await Promise.all([getFeaturedProducts(), getCategories()])

  return (
    <Suspense fallback={null}>
      <HomepageClient
        initialProducts={JSON.parse(JSON.stringify(products))}
        initialCategories={JSON.parse(JSON.stringify(categories))}
      />
    </Suspense>
  )
}
