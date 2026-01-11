import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const purchases = await prisma.purchase.findMany({
      where: { user_id: authResult.user.userId },
      include: {
        vip_package: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json(purchases)
  } catch (error) {
    console.error('My purchases error:', error)
    return NextResponse.json(
      { error: 'Error al cargar compras' },
      { status: 500 }
    )
  }
}
