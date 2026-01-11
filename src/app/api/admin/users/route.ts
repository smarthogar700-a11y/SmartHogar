import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        full_name: true,
        email: true,
        user_code: true,
        role: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    })

    // Get balance for each user
    const usersWithBalance = await Promise.all(
      users.map(async (user) => {
        const ledgerSum = await prisma.walletLedger.aggregate({
          where: { user_id: user.id },
          _sum: { amount_bs: true },
        })

        const activePurchase = await prisma.purchase.findFirst({
          where: {
            user_id: user.id,
            status: 'ACTIVE',
          },
          select: {
            vip_package: {
              select: { name: true },
            },
          },
        })

        return {
          ...user,
          balance: ledgerSum._sum.amount_bs || 0,
          active_vip: activePurchase?.vip_package.name || null,
        }
      })
    )

    return NextResponse.json(usersWithBalance)
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: 'Error al cargar usuarios' },
      { status: 500 }
    )
  }
}
