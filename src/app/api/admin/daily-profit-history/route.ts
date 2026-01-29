import { NextRequest, NextResponse } from 'next/server'
import { prisma, withRetry } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

// Función para calcular el inicio del día actual (desde la última 1:00 AM)
function getDayStartTime(): Date {
  const now = new Date()
  const dayStart = new Date(now)
  dayStart.setHours(1, 0, 0, 0) // 1:00 AM de hoy

  // Si aún no son las 1:00 AM, el día empezó ayer a la 1:00 AM
  if (now < dayStart) {
    dayStart.setDate(dayStart.getDate() - 1)
  }

  return dayStart
}

// Función para calcular el próximo reset (próxima 1:00 AM)
function getNextResetTime(): Date {
  const now = new Date()
  const nextReset = new Date(now)
  nextReset.setHours(1, 0, 0, 0)

  // Si ya pasó la 1:00 AM de hoy, el próximo reset es mañana
  if (now >= nextReset) {
    nextReset.setDate(nextReset.getDate() + 1)
  }

  return nextReset
}

export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const dayStart = getDayStartTime()
    const nextReset = getNextResetTime()

    // Obtener todos los usuarios con compras VIP activas
    const usersWithVIP = await withRetry(() =>
      prisma.user.findMany({
        where: {
          purchases: {
            some: {
              status: 'ACTIVE',
            },
          },
        },
        select: {
          id: true,
          username: true,
          full_name: true,
          purchases: {
            where: { status: 'ACTIVE' },
            include: {
              vip_package: {
                select: {
                  name: true,
                  daily_profit_bs: true,
                },
              },
            },
          },
        },
        orderBy: {
          full_name: 'asc',
        },
      })
    )

    // Para cada usuario, verificar si activó hoy
    const usersData = await Promise.all(
      usersWithVIP.map(async (user) => {
        // Buscar activaciones desde el inicio del día
        const todayActivations = await withRetry(() =>
          prisma.walletLedger.findMany({
            where: {
              user_id: user.id,
              type: 'DAILY_PROFIT',
              created_at: {
                gte: dayStart,
              },
            },
            orderBy: {
              created_at: 'asc',
            },
          })
        )

        // Calcular ganancia total de hoy
        const profitToday = todayActivations.reduce(
          (sum, entry) => sum + entry.amount_bs,
          0
        )

        // Obtener saldo total del wallet (todas las transacciones)
        const walletBalance = await withRetry(() =>
          prisma.walletLedger.aggregate({
            where: {
              user_id: user.id,
            },
            _sum: {
              amount_bs: true,
            },
          })
        )

        const currentBalance = walletBalance._sum.amount_bs || 0

        // Calcular saldo antes de activar hoy (balance actual - ganancias de hoy)
        const balanceBefore = currentBalance - profitToday

        // Detalle de cada activación de hoy
        const activationsDetail = todayActivations.map((entry) => ({
          package_name: (entry.description || 'VIP').replace('Ganancia diaria - ', ''),
          amount: entry.amount_bs,
          activated_at: entry.created_at,
        }))

        // Obtener acumulado total histórico de daily profits
        const allProfits = await withRetry(() =>
          prisma.walletLedger.aggregate({
            where: {
              user_id: user.id,
              type: 'DAILY_PROFIT',
            },
            _sum: {
              amount_bs: true,
            },
          })
        )

        const totalAccumulated = allProfits._sum.amount_bs || 0

        // Hora de activación (primera activación de hoy)
        const firstActivationToday = todayActivations.length > 0
          ? todayActivations[0].created_at
          : null

        // VIPs activos
        const activeVIPs = user.purchases.map((purchase) => ({
          package_name: purchase.vip_package?.name || 'VIP',
          daily_profit: purchase.vip_package?.daily_profit_bs ?? purchase.daily_profit_bs,
        }))

        return {
          user_id: user.id,
          username: user.username,
          full_name: user.full_name,
          activated_today: todayActivations.length > 0,
          activation_time: firstActivationToday,
          balance_before: balanceBefore,
          balance_after: currentBalance,
          profit_today: profitToday,
          activations_detail: activationsDetail,
          total_accumulated: totalAccumulated,
          active_vips: activeVIPs,
        }
      })
    )

    // Calcular resumen
    const activatedCount = usersData.filter((u) => u.activated_today).length
    const notActivatedCount = usersData.length - activatedCount
    const totalProfitToday = usersData.reduce((sum, u) => sum + u.profit_today, 0)

    return NextResponse.json({
      day_start: dayStart,
      next_reset: nextReset,
      users: usersData,
      summary: {
        total_users_with_vip: usersData.length,
        activated_today: activatedCount,
        not_activated_today: notActivatedCount,
        total_profit_today: totalProfitToday,
      },
    })
  } catch (error) {
    console.error('Daily profit history error:', error)
    return NextResponse.json(
      { error: 'Error al cargar historial' },
      { status: 500 }
    )
  }
}
