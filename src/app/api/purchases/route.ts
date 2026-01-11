import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { payReferralBonuses } from '@/lib/referrals'

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { vip_package_id, receipt_url } = await req.json()

    if (!vip_package_id || !receipt_url) {
      return NextResponse.json(
        { error: 'Datos incompletos' },
        { status: 400 }
      )
    }

    // Check if user already has this VIP package
    const existingSamePackage = await prisma.purchase.findFirst({
      where: {
        user_id: authResult.user.userId,
        vip_package_id,
      },
    })

    if (existingSamePackage) {
      return NextResponse.json(
        { error: 'Ya compraste este paquete VIP' },
        { status: 400 }
      )
    }

    const vipPackage = await prisma.vipPackage.findUnique({
      where: { id: vip_package_id },
    })

    if (!vipPackage || !vipPackage.is_enabled) {
      return NextResponse.json(
        { error: 'Paquete no disponible' },
        { status: 400 }
      )
    }

    const now = new Date()
    const purchase = await prisma.purchase.create({
      data: {
        user_id: authResult.user.userId,
        vip_package_id,
        investment_bs: vipPackage.investment_bs,
        daily_profit_bs: vipPackage.daily_profit_bs,
        receipt_url,
        status: 'ACTIVE',
        activated_at: now,
        last_profit_at: now,
      },
    })

    await payReferralBonuses(purchase.user_id, purchase.investment_bs)

    return NextResponse.json({ message: 'Compra registrada y activada', purchase })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Error al registrar compra' },
      { status: 500 }
    )
  }
}
