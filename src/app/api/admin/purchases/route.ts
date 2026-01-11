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
      include: {
        user: {
          select: {
            id: true,
            username: true,
            full_name: true,
            email: true,
          },
        },
        vip_package: true,
      },
      orderBy: { created_at: 'desc' },
    })

    const totalInvestmentResult = await prisma.purchase.aggregate({
      _sum: { investment_bs: true },
    })
    const totalInvestment = totalInvestmentResult._sum.investment_bs || 0

    return NextResponse.json({
      purchases,
      total_investment_bs: totalInvestment,
    })
  } catch (error) {
    console.error('Admin purchases error:', error)
    return NextResponse.json(
      { error: 'Error al cargar compras' },
      { status: 500 }
    )
  }
}
