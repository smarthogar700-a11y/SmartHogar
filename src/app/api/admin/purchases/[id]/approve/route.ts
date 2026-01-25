import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'
import { payReferralBonusesWithClient } from '@/lib/referrals'

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

    // Verificar si es la primera compra VIP activa del usuario
    const existingActiveVip = await prisma.purchase.findFirst({
      where: {
        user_id: purchase.user_id,
        status: 'ACTIVE',
      },
    })

    let tiktokBonusAmount = 0

    // Ejecutar todo en una transacción para garantizar atomicidad
    // Si los bonos fallan, la compra no se activa
    await prisma.$transaction(async (tx) => {
      // 1. Activar la compra
      await tx.purchase.update({
        where: { id: params.id },
        data: {
          status: 'ACTIVE',
          activated_at: now,
          last_profit_at: now,
        },
      })

      // 2. Pagar bonos a los patrocinadores (usando el cliente de transacción)
      await payReferralBonusesWithClient(tx, purchase.user_id, purchase.investment_bs)

      // 3. Si es primera compra VIP, bonificar tareas de TikTok acumuladas
      if (!existingActiveVip) {
        const tiktokTasks = await tx.tikTokTask.findMany({
          where: { user_id: purchase.user_id },
        })

        if (tiktokTasks.length > 0) {
          tiktokBonusAmount = tiktokTasks.reduce((sum, task) => sum + task.amount_bs, 0)

          // Crear registro en wallet con el bono de TikTok
          await tx.walletLedger.create({
            data: {
              user_id: purchase.user_id,
              type: 'TIKTOK_BONUS',
              amount_bs: tiktokBonusAmount,
              description: `Bono TikTok - ${tiktokTasks.length} tareas completadas`,
            },
          })

          // Eliminar las tareas de TikTok (ya fueron bonificadas)
          await tx.tikTokTask.deleteMany({
            where: { user_id: purchase.user_id },
          })
        }
      }
    })

    const message = tiktokBonusAmount > 0
      ? `Compra activada, bonos pagados y +Bs ${tiktokBonusAmount.toFixed(2)} de TikTok bonificados`
      : 'Compra activada y bonos pagados'

    return NextResponse.json({ message, tiktok_bonus: tiktokBonusAmount })
  } catch (error) {
    console.error('Approve purchase error:', error)
    return NextResponse.json(
      { error: 'Error al aprobar compra' },
      { status: 500 }
    )
  }
}
