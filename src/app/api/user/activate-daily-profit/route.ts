import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

// Función para verificar si el usuario ya activó hoy
function canActivateToday(lastActivation: Date | null): { canActivate: boolean; unlocksAt: Date | null } {
  if (!lastActivation) {
    return { canActivate: true, unlocksAt: null }
  }

  const now = new Date()
  const lastRun = new Date(lastActivation)

  // Calcular la próxima 1:00 AM después de la última activación
  const unlockTime = new Date(lastRun)
  unlockTime.setHours(1, 0, 0, 0) // Establecer a 1:00 AM

  // Si la última activación fue después de la 1:00 AM de hoy, desbloquea mañana a la 1:00 AM
  if (lastRun >= unlockTime) {
    unlockTime.setDate(unlockTime.getDate() + 1)
  }

  // Si ahora es antes de la hora de desbloqueo, está bloqueado
  if (now < unlockTime) {
    return { canActivate: false, unlocksAt: unlockTime }
  }

  return { canActivate: true, unlocksAt: null }
}

export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const userId = authResult.user.userId
    const now = new Date()

    // Obtener el usuario con su última activación
    const user = await withRetry(() =>
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          purchases: {
            where: { status: 'ACTIVE' },
            include: {
              vip_package: {
                select: {
                  daily_profit_bs: true,
                  name: true,
                },
              },
            },
          },
        },
      })
    )

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    // Buscar la última activación del usuario
    const lastActivation = await withRetry(() =>
      prisma.walletLedger.findFirst({
        where: {
          user_id: userId,
          type: 'DAILY_PROFIT',
        },
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      })
    )

    // Verificar si puede activar hoy
    const { canActivate, unlocksAt } = canActivateToday(lastActivation?.created_at || null)

    if (!canActivate) {
      return NextResponse.json(
        {
          error: 'Ya activaste tus ganancias hoy',
          blocked: true,
          unlocks_at: unlocksAt,
          message: 'Disponible a la 1:00 AM',
        },
        { status: 423 } // 423 = Locked
      )
    }

    // Verificar si tiene compras activas
    if (user.purchases.length === 0) {
      return NextResponse.json(
        { error: 'No tienes paquetes VIP activos' },
        { status: 400 }
      )
    }

    // Procesar ganancias para cada compra activa del usuario
    let totalProfit = 0
    const processedPackages: string[] = []

    // Procesar todas las compras en una sola transacción atómica
    await withRetry(() =>
      prisma.$transaction(async (tx) => {
        for (const purchase of user.purchases) {
          const effectiveProfit = purchase.vip_package?.daily_profit_bs ?? purchase.daily_profit_bs

          // Validar que el profit sea válido
          if (!effectiveProfit || effectiveProfit <= 0) {
            throw new Error(`Profit inválido para el paquete ${purchase.vip_package?.name || 'VIP'}`)
          }

          // Crear registro en wallet
          await tx.walletLedger.create({
            data: {
              user_id: userId,
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
              daily_profit_bs: effectiveProfit, // Sincronizar con el porcentaje actual
            },
          })

          totalProfit += effectiveProfit
          processedPackages.push(purchase.vip_package?.name || 'VIP')
        }
      })
    )

    // Calcular hora de desbloqueo (próxima 1:00 AM)
    const unlockTime = new Date(now)
    unlockTime.setHours(1, 0, 0, 0)
    if (now >= unlockTime) {
      unlockTime.setDate(unlockTime.getDate() + 1)
    }

    return NextResponse.json({
      success: true,
      message: 'Ganancias activadas exitosamente',
      total_profit: totalProfit,
      packages: processedPackages,
      unlocks_at: unlockTime,
    })
  } catch (error) {
    console.error('Activate daily profit error:', error)
    return NextResponse.json(
      { error: 'Error al activar ganancias' },
      { status: 500 }
    )
  }
}

// Endpoint para verificar si el usuario puede activar
export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const userId = authResult.user.userId

    // Buscar la última activación del usuario
    const lastActivation = await withRetry(() =>
      prisma.walletLedger.findFirst({
        where: {
          user_id: userId,
          type: 'DAILY_PROFIT',
        },
        orderBy: { created_at: 'desc' },
        select: { created_at: true },
      })
    )

    const { canActivate, unlocksAt } = canActivateToday(lastActivation?.created_at || null)

    // Contar compras activas del usuario
    const activeCount = await withRetry(() =>
      prisma.purchase.count({
        where: { user_id: userId, status: 'ACTIVE' },
      })
    )

    return NextResponse.json({
      can_activate: canActivate,
      last_activation: lastActivation?.created_at || null,
      unlocks_at: unlocksAt,
      active_packages: activeCount,
    })
  } catch (error) {
    console.error('Check activation status error:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado' },
      { status: 500 }
    )
  }
}
