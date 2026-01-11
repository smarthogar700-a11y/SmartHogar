import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const withdrawals = await prisma.withdrawal.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          select: {
            username: true,
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    const userIds = Array.from(new Set(withdrawals.map((w) => w.user_id)))
    const totals = userIds.length
      ? await prisma.walletLedger.groupBy({
          by: ['user_id'],
          where: { user_id: { in: userIds } },
          _sum: { amount_bs: true },
        })
      : []

    const totalsMap = new Map(
      totals.map((t) => [t.user_id, t._sum.amount_bs || 0])
    )

    const payload = withdrawals.map((w) => ({
      ...w,
      total_earnings_bs: totalsMap.get(w.user_id) || 0,
    }))

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Admin withdrawals error:', error)
    return NextResponse.json(
      { error: 'Error al cargar retiros' },
      { status: 500 }
    )
  }
}
