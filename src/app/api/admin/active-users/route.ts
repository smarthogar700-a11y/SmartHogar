import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const purchases = await prisma.purchase.findMany({
      where: { status: 'ACTIVE' },
      include: {
        user: {
          select: {
            username: true,
            full_name: true,
            email: true,
          },
        },
        vip_package: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: { activated_at: 'desc' },
    })

    const byUser = new Map<string, { user: typeof purchases[number]['user']; packages: typeof purchases[number]['vip_package'][] }>()
    for (const purchase of purchases) {
      const entry = byUser.get(purchase.user_id)
      if (!entry) {
        byUser.set(purchase.user_id, {
          user: purchase.user,
          packages: [purchase.vip_package],
        })
      } else {
        entry.packages.push(purchase.vip_package)
      }
    }

    const userIds = Array.from(byUser.keys())
    const totals = userIds.length
      ? await prisma.walletLedger.groupBy({
          by: ['user_id'],
          where: {
            user_id: { in: userIds },
            type: { in: ['DAILY_PROFIT', 'REFERRAL_BONUS'] },
          },
          _sum: { amount_bs: true },
        })
      : []

    const totalsMap = new Map(
      totals.map((t) => [t.user_id, t._sum.amount_bs || 0])
    )

    const payload = Array.from(byUser.entries()).map(([userId, entry]) => ({
      user: entry.user,
      active_packages: entry.packages,
      total_earnings_bs: totalsMap.get(userId) || 0,
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Active users error:', error)
    return NextResponse.json(
      { error: 'Error al cargar usuarios activos' },
      { status: 500 }
    )
  }
}
