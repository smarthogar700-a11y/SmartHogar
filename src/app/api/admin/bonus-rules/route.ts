import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const rules = await prisma.referralBonusRule.findMany({
      orderBy: { level: 'asc' },
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Get bonus rules error:', error)
    return NextResponse.json(
      { error: 'Error al cargar reglas de bonos' },
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
    const { id, percentage } = await req.json()

    if (!id || percentage === undefined) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    const updated = await prisma.referralBonusRule.update({
      where: { id: parseInt(id) },
      data: {
        percentage: parseFloat(percentage),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Update bonus rule error:', error)
    return NextResponse.json(
      { error: 'Error al actualizar regla' },
      { status: 500 }
    )
  }
}
