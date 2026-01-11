import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    // Verificar token de seguridad (opcional pero recomendado)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'cron-secret-change-me'

    if (authHeader !== `Bearer ${cronSecret}`) {
      // Si no hay auth header, permitir en desarrollo
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const lastRun = await prisma.dailyProfitRun.findUnique({
      where: { id: 1 },
    })

    if (lastRun && lastRun.last_run_at > twentyFourHoursAgo) {
      return NextResponse.json({
        success: true,
        processed: 0,
        synced: 0,
        already_run: true,
        last_run_at: lastRun.last_run_at,
        timestamp: now.toISOString(),
      })
    }

    const activePurchases = await prisma.purchase.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        vip_package: {
          select: {
            daily_profit_bs: true,
          },
        },
      },
    })

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

    const eligiblePurchases = activePurchases.filter((purchase) => {
      if (!purchase.last_profit_at) return true
      return purchase.last_profit_at <= twentyFourHoursAgo
    })

    let processedCount = 0

    for (const purchase of eligiblePurchases) {
      const effectiveProfit = purchase.vip_package?.daily_profit_bs ?? purchase.daily_profit_bs
      await prisma.$transaction(async (tx) => {
        await tx.walletLedger.create({
          data: {
            user_id: purchase.user_id,
            type: 'DAILY_PROFIT',
            amount_bs: effectiveProfit,
            description: `Ganancia diaria automática ${purchase.vip_package_id}`,
          },
        })

        await tx.purchase.update({
          where: { id: purchase.id },
          data: {
            last_profit_at: now,
            total_earned_bs: purchase.total_earned_bs + effectiveProfit,
          },
        })
      })

      processedCount++
    }

    console.log(`[CRON] Ganancias diarias procesadas: ${processedCount} usuarios`)

    await prisma.dailyProfitRun.upsert({
      where: { id: 1 },
      update: { last_run_at: now },
      create: { id: 1, last_run_at: now },
    })

    return NextResponse.json({
      success: true,
      processed: processedCount,
      synced: syncedCount,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Error procesando ganancias diarias:', error)
    return NextResponse.json(
      { error: 'Error al procesar ganancias' },
      { status: 500 }
    )
  }
}
