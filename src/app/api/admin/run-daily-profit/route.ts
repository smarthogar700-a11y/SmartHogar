import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export async function POST(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const lastRun = await prisma.dailyProfitRun.findUnique({
      where: { id: 1 },
    })

    if (lastRun && lastRun.last_run_at > twentyFourHoursAgo) {
      return NextResponse.json({
        message: 'Ganancias diarias ya actualizadas',
        processed: 0,
        synced: 0,
        last_run_at: lastRun.last_run_at,
        already_run: true,
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
            description: `Ganancia diaria ${purchase.vip_package_id}`,
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

    await prisma.dailyProfitRun.upsert({
      where: { id: 1 },
      update: { last_run_at: now },
      create: { id: 1, last_run_at: now },
    })

    return NextResponse.json({
      message: 'Ganancias diarias procesadas',
      processed: processedCount,
      synced: syncedCount,
      last_run_at: now,
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
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const lastRun = await prisma.dailyProfitRun.findUnique({
      where: { id: 1 },
    })

    const alreadyRun = lastRun ? lastRun.last_run_at > twentyFourHoursAgo : false
    return NextResponse.json({
      last_run_at: lastRun?.last_run_at || null,
      already_run: alreadyRun,
    })
  } catch (error) {
    console.error('Run daily profit status error:', error)
    return NextResponse.json(
      { error: 'Error al consultar estado' },
      { status: 500 }
    )
  }
}
