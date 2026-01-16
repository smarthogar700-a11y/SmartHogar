import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

interface UserNetworkNode {
  id: string
  username: string
  full_name: string
  status: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE'
  vip_packages: { name: string; level: number; status: string; activated_at?: string }[]
  referrals: UserNetworkNode[]
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
    // Query única - traer usuario con compras y referidos directos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        full_name: true,
        purchases: {
          select: {
            status: true,
            activated_at: true,
            vip_package: {
              select: { name: true, level: true },
            },
          },
        },
        referrals: {
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
            referrals: {
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
                referrals: {
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
                },
              },
            },
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({
        id: userId,
        username: 'unknown',
        full_name: 'Usuario',
        status: 'INACTIVO' as const,
        vip_packages: [],
        referrals: [],
      })
    }

    // Procesar usuario actual
    let status: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' = 'INACTIVO'
    const activeVips = user.purchases.filter(p => p.status === 'ACTIVE')
    const pendingVips = user.purchases.filter(p => p.status === 'PENDING')

    if (pendingVips.length > 0) {
      status = 'PENDIENTE'
    } else if (activeVips.length > 0) {
      status = 'ACTIVO'
    }

    const buildNode = (u: any): UserNetworkNode => {
      const uActiveVips = u.purchases.filter((p: any) => p.status === 'ACTIVE')
      const uPendingVips = u.purchases.filter((p: any) => p.status === 'PENDING')
      
      let uStatus: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE' = 'INACTIVO'
      if (uPendingVips.length > 0) {
        uStatus = 'PENDIENTE'
      } else if (uActiveVips.length > 0) {
        uStatus = 'ACTIVO'
      }

      const allVips = [
        ...uActiveVips.map((p: any) => ({ ...p.vip_package, status: 'ACTIVE', activated_at: p.activated_at })),
        ...uPendingVips.map((p: any) => ({ ...p.vip_package, status: 'PENDING', activated_at: p.activated_at }))
      ]

      return {
        id: u.id,
        username: u.username,
        full_name: u.full_name,
        status: uStatus,
        vip_packages: allVips,
        referrals: u.referrals ? u.referrals.map(buildNode) : [],
      }
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      status,
      vip_packages: [
        ...activeVips.map(p => ({ ...p.vip_package, status: 'ACTIVE', activated_at: p.activated_at })),
        ...pendingVips.map(p => ({ ...p.vip_package, status: 'PENDING', activated_at: p.activated_at }))
      ],
      referrals: user.referrals.map(buildNode),
    })
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
