import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

interface UserNetworkNode {
  id: string
  username: string
  full_name: string
  status: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE'
  vip_packages: { name: string; level: number }[]
  referrals: UserNetworkNode[]
}

async function getUserDownline(
  userId: string,
  depth: number = 0,
  maxDepth: number = 2
): Promise<UserNetworkNode | null> {
  if (depth > maxDepth) {
    return null
  }

  try {
    // Query optimizada: traer usuario + compras
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        purchases: {
          select: {
            status: true,
            vip_package: {
              select: { name: true, level: true },
            },
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Determinar estado
    let status: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' = 'INACTIVO'
    const activeVips = user.purchases.filter(p => p.status === 'ACTIVE')
    const pendingVips = user.purchases.filter(p => p.status === 'PENDING')

    if (pendingVips.length > 0) {
      status = 'PENDIENTE'
    } else if (activeVips.length > 0) {
      status = 'ACTIVO'
    }

    // Traer solo los VIPs activos
    const vipPackages = activeVips.map(p => p.vip_package)

    // Solo en nivel 1: traer referidos. En niveles más profundos devolver array vacío
    let referrals: UserNetworkNode[] = []
    
    if (depth < maxDepth) {
      const directReferrals = await prisma.user.findMany({
        where: { sponsor_id: userId },
        select: { id: true },
      })

      for (const ref of directReferrals) {
        const refNode = await getUserDownline(ref.id, depth + 1, maxDepth)
        if (refNode) {
          referrals.push(refNode)
        }
      }
    }

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      status,
      vip_packages,
      referrals,
    }
  } catch (err) {
    console.error(`Error getUserDownline depth ${depth}:`, err)
    return null
  }
}

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)

  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: authResult.status }
    )
  }

  const userId = authResult.user.userId

  if (!userId) {
    return NextResponse.json({ error: 'No user ID' }, { status: 401 })
  }

  try {
    const network = await getUserDownline(userId, 0, 2)

    if (!network) {
      return NextResponse.json({
        id: userId,
        username: 'unknown',
        full_name: 'Usuario',
        status: 'INACTIVO' as const,
        vip_packages: [],
        referrals: [],
      })
    }

    return NextResponse.json(network)
  } catch (error) {
    console.error('Network API error:', error)

    return NextResponse.json(
      {
        id: userId,
        username: 'error',
        full_name: 'Error al cargar',
        status: 'INACTIVO' as const,
        vip_packages: [],
        referrals: [],
      },
      { status: 200 }
    )
  }
}
