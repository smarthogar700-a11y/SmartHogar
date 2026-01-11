import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

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

    if (purchase.status === 'REJECTED') {
      return NextResponse.json({ message: 'Compra ya desactivada' })
    }

    await prisma.purchase.update({
      where: { id: params.id },
      data: { status: 'REJECTED' },
    })

    return NextResponse.json({ message: 'Compra rechazada' })
  } catch (error) {
    console.error('Reject purchase error:', error)
    return NextResponse.json(
      { error: 'Error al rechazar compra' },
      { status: 500 }
    )
  }
}
