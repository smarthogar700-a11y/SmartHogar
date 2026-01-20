import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

// Función para verificar si está bloqueado
function isBlocked(lastRunAt: Date | null): { blocked: boolean; unlocksAt: Date | null } {
  if (!lastRunAt) {
    return { blocked: false, unlocksAt: null }
  }

  const now = new Date()
  const lastRun = new Date(lastRunAt)

  // Calcular la próxima 1:00 AM después de la última ejecución
  const unlockTime = new Date(lastRun)
  unlockTime.setHours(1, 0, 0, 0) // Establecer a 1:00 AM

  // Si la última ejecución fue después de la 1:00 AM de hoy, desbloquea mañana a la 1:00 AM
  if (lastRun >= unlockTime) {
    unlockTime.setDate(unlockTime.getDate() + 1)
  }

  // Si ahora es antes de la hora de desbloqueo, está bloqueado
  if (now < unlockTime) {
    return { blocked: true, unlocksAt: unlockTime }
  }

  return { blocked: false, unlocksAt: null }
}

export async function POST(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const now = new Date()

    // Verificar si está bloqueado
    const lastRun = await prisma.dailyProfitRun.findUnique({
      where: { id: 1 },
    })

    const { blocked, unlocksAt } = isBlocked(lastRun?.last_run_at || null)

    if (blocked) {
      return NextResponse.json({
        error: 'Ganancias ya procesadas hoy',
        blocked: true,
        last_run_at: lastRun?.last_run_at,
        unlocks_at: unlocksAt,
        message: `Bloqueado hasta la 1:00 AM`,
      }, { status: 423 }) // 423 = Locked
    }

    // Obtener todas las compras activas con su paquete VIP
    const activePurchases = await prisma.purchase.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        vip_package: {
          select: {
            daily_profit_bs: true,
            name: true,
          },
        },
        user: {
          select: {
            username: true,
          },
        },
      },
    })

    // Sincronizar las ganancias con el porcentaje actual del paquete VIP
    let syncedCount = 0
    for (const purchase of activePurchases) {
      const currentProfit = purchase.vip_package?.daily_profit_bs ?? purchase.daily_profit_bs
      if (purchase.daily_profit_bs !== currentProfit) {
        await prisma.purchase.update({
          where: { id: purchase.id },
          data: { daily_profit_bs: currentProfit },
        })
        syncedCount++
      }
    }

    // Procesar ganancias para todas las compras activas
    let processedCount = 0
    const processedUsers: string[] = []

    for (const purchase of activePurchases) {
      const effectiveProfit = purchase.vip_package?.daily_profit_bs ?? purchase.daily_profit_bs

      await prisma.$transaction(async (tx) => {
        // Crear registro en wallet
        await tx.walletLedger.create({
          data: {
            user_id: purchase.user_id,
            type: 'DAILY_PROFIT',
            amount_bs: effectiveProfit,
            description: `Ganancia diaria - ${purchase.vip_package?.name || 'VIP'}`,
          },
        })

        // Actualizar la compra
        await tx.purchase.update({
          where: { id: purchase.id },
          data: {
            last_profit_at: now,
            total_earned_bs: purchase.total_earned_bs + effectiveProfit,
          },
        })
      })

      processedCount++
      if (purchase.user?.username) {
        processedUsers.push(purchase.user.username)
      }
    }

    // Registrar la ejecución
    await prisma.dailyProfitRun.upsert({
      where: { id: 1 },
      update: { last_run_at: now },
      create: { id: 1, last_run_at: now },
    })

    // Calcular hora de desbloqueo (próxima 1:00 AM)
    const unlockTime = new Date(now)
    unlockTime.setHours(1, 0, 0, 0)
    if (now >= unlockTime) {
      unlockTime.setDate(unlockTime.getDate() + 1)
    }

    return NextResponse.json({
      message: 'Ganancias diarias procesadas exitosamente',
      processed: processedCount,
      synced: syncedCount,
      last_run_at: now,
      unlocks_at: unlockTime,
      already_run: false,
    })
  } catch (error) {
    console.error('Run daily profit error:', error)
    return NextResponse.json(
      { error: 'Error al procesar ganancias' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const lastRun = await prisma.dailyProfitRun.findUnique({
      where: { id: 1 },
    })

    // Verificar si está bloqueado
    const { blocked, unlocksAt } = isBlocked(lastRun?.last_run_at || null)

    // Contar compras activas para mostrar info
    const activeCount = await prisma.purchase.count({
      where: { status: 'ACTIVE' },
    })

    return NextResponse.json({
      last_run_at: lastRun?.last_run_at || null,
      blocked,
      unlocks_at: unlocksAt,
      active_purchases: activeCount,
    })
  } catch (error) {
    console.error('Run daily profit status error:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado' },
      { status: 500 }
    )
  }
}
