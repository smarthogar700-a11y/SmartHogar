import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const packages = await prisma.vipPackage.findMany({
      orderBy: { level: 'asc' },
    })

    return NextResponse.json(packages)
  } catch (error) {
    console.error('Get VIP packages error:', error)
    return NextResponse.json(
      { error: 'Error al cargar paquetes' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { id, investment_bs, daily_profit_bs, is_enabled } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    }

    const updated = await prisma.vipPackage.update({
      where: { id: parseInt(id) },
      data: {
        investment_bs: investment_bs !== undefined ? parseFloat(investment_bs) : undefined,
        daily_profit_bs: daily_profit_bs !== undefined ? parseFloat(daily_profit_bs) : undefined,
        is_enabled: is_enabled !== undefined ? is_enabled : undefined,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update VIP package error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar paquete' },
      { status: 500 }
    )
  }
}
