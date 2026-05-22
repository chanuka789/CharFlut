import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Fetch all saved addresses for authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'asc' }],
    })

    return NextResponse.json({ addresses })
  } catch (error) {
    console.error('Addresses GET error:', error)
    return NextResponse.json({ error: 'Failed to retrieve addresses' }, { status: 500 })
  }
}

// Create or update a saved address
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, line1, line2, city, state, zip, country, isDefault } = body

    if (!name || !line1 || !city || !zip || !country) {
      return NextResponse.json({ error: 'Missing required address fields' }, { status: 400 })
    }

    const userId = session.user.id
    const isDefaultBool = !!isDefault

    // Secure database transactional updates for default toggles
    const savedAddress = await prisma.$transaction(async (tx) => {
      // If this address is set to default, set all others to false
      if (isDefaultBool) {
        await tx.address.updateMany({
          where: { userId },
          data: { isDefault: false },
        })
      }

      if (id) {
        // Update existing address
        const existing = await tx.address.findFirst({
          where: { id, userId },
        })

        if (!existing) {
          throw new Error('Address not found')
        }

        return await tx.address.update({
          where: { id },
          data: {
            name,
            line1,
            line2: line2 || null,
            city,
            state: state || null,
            zip,
            country,
            isDefault: isDefaultBool,
          },
        })
      } else {
        // If it's the very first address created by this user, make it default automatically
        const addressCount = await tx.address.count({
          where: { userId },
        })

        const makeDefault = addressCount === 0 ? true : isDefaultBool

        // Create new address
        return await tx.address.create({
          data: {
            userId,
            name,
            line1,
            line2: line2 || null,
            city,
            state: state || null,
            zip,
            country,
            isDefault: makeDefault,
          },
        })
      }
    })

    return NextResponse.json({ success: true, address: savedAddress }, { status: id ? 200 : 201 })
  } catch (error: any) {
    console.error('Address POST error:', error)
    return NextResponse.json({ error: error.message || 'Failed to save address' }, { status: 400 })
  }
}

// Delete an address
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Address ID required' }, { status: 400 })
    }

    // Double check ownership before deletion
    const existing = await prisma.address.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Address not found or unauthorized' }, { status: 404 })
    }

    await prisma.address.delete({
      where: { id },
    })

    // If we deleted the default address, make another address default if available
    if (existing.isDefault) {
      const remaining = await prisma.address.findFirst({
        where: { userId: session.user.id },
      })
      if (remaining) {
        await prisma.address.update({
          where: { id: remaining.id },
          data: { isDefault: true },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Address DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
