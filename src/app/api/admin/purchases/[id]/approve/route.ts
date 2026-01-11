import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'
import { payReferralBonuses } from '@/lib/referrals'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id: params.id },
    })

    if (!purchase) {
      return NextResponse.json(
        { error: 'Compra no encontrada' },
        { status: 404 }
      )
    }

    if (purchase.status === 'ACTIVE') {
      return NextResponse.json({ message: 'Compra ya activa' })
    }

    const now = new Date()

    await prisma.purchase.update({
      where: { id: params.id },
      data: {
        status: 'ACTIVE',
        activated_at: now,
        last_profit_at: now,
      },
    })

    await payReferralBonuses(purchase.user_id, purchase.investment_bs)

    return NextResponse.json({ message: 'Compra activada y bonos pagados' })
  } catch (error) {
    console.error('Approve purchase error:', error)
    return NextResponse.json(
      { error: 'Error al aprobar compra' },
      { status: 500 }
    )
  }
}
