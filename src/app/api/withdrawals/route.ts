import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    // Calculate balance
    const ledgerSum = await prisma.walletLedger.aggregate({
      where: { user_id: authResult.user.userId },
      _sum: { amount_bs: true },
    })

    const balance = ledgerSum._sum.amount_bs || 0

    // Get withdrawals
    const withdrawals = await prisma.withdrawal.findMany({
      where: { user_id: authResult.user.userId },
      orderBy: { created_at: 'desc' },
    })

    return NextResponse.json({ balance, withdrawals })
  } catch (error) {
    console.error('Withdrawals GET error:', error)
    return NextResponse.json(
      { error: 'Error al cargar retiros' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { amount_bs, bank_name, qr_image_url, payout_method, phone_number } = await req.json()

    // Validar montos exactos permitidos
    const allowedAmounts = [10, 50, 100, 200, 500, 1000]
    if (!amount_bs || !allowedAmounts.includes(amount_bs)) {
      return NextResponse.json(
        { error: 'Solo se permiten retiros en montos exactos: 10, 50, 100, 200, 500 o 1000 Bs' },
        { status: 400 }
      )
    }

    if (!bank_name || !qr_image_url || !payout_method || !phone_number) {
      return NextResponse.json(
        { error: 'Datos invalidos. Debes subir tu imagen QR' },
        { status: 400 }
      )
    }

    // Check balance
    const ledgerSum = await prisma.walletLedger.aggregate({
      where: { user_id: authResult.user.userId },
      _sum: { amount_bs: true },
    })

    const balance = ledgerSum._sum.amount_bs || 0

    if (amount_bs > balance) {
      return NextResponse.json(
        { error: 'Saldo insuficiente' },
        { status: 400 }
      )
    }

    // Verificar que el usuario tenga al menos un VIP activo
    const activeVipCount = await prisma.purchase.count({
      where: {
        user_id: authResult.user.userId,
        status: 'ACTIVE',
      },
    })

    if (activeVipCount === 0) {
      return NextResponse.json(
        { error: 'Debes tener al menos un paquete VIP activo para solicitar retiros' },
        { status: 403 }
      )
    }

    // Create withdrawal y descontar saldo inmediatamente
    const withdrawal = await prisma.$transaction(async (tx) => {
      const w = await tx.withdrawal.create({
        data: {
          user_id: authResult.user.userId,
          amount_bs,
          bank_name,
          qr_image_url,
          payout_method,
          phone_number,
          status: 'PENDING',
        },
      })

      // Descontar saldo al solicitar
      await tx.walletLedger.create({
        data: {
          user_id: authResult.user.userId,
          type: 'WITHDRAW_REQUEST',
          amount_bs: -amount_bs,
          description: `Solicitud de retiro #${w.id}`,
        },
      })

      return w
    })

    return NextResponse.json({ message: 'Retiro solicitado', withdrawal })
  } catch (error) {
    console.error('Withdrawal POST error:', error)
    return NextResponse.json(
      { error: 'Error al solicitar retiro' },
      { status: 500 }
    )
  }
}
