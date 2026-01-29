import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

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

    // Check if user already has an ACTIVE or PENDING purchase of this VIP package
    const existingPackage = await prisma.purchase.findFirst({
      where: {
        user_id: authResult.user.userId,
        vip_package_id,
        status: {
          in: ['ACTIVE', 'PENDING']
        }
      },
    })

    if (existingPackage) {
      return NextResponse.json(
        { error: 'Ya tienes una compra activa o pendiente de este paquete VIP' },
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

    const purchase = await prisma.purchase.create({
      data: {
        user_id: authResult.user.userId,
        vip_package_id,
        investment_bs: vipPackage.investment_bs,
        daily_profit_bs: vipPackage.daily_profit_bs,
        receipt_url,
        status: 'PENDING',
      },
    })

    return NextResponse.json({ message: 'Compra registrada - Pendiente de aprobación por el administrador', purchase })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'Error al registrar compra' },
      { status: 500 }
    )
  }
}
