import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { getDashboardCache, setDashboardCache } from '@/lib/cache'

async function getNetworkCount(userId: string): Promise<number> {
  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    with recursive network as (
      select id from "User" where sponsor_id = ${userId}
      union all
      select u.id from "User" u
      inner join network n on u.sponsor_id = n.id
    )
    select count(*)::bigint as count from network
  `

  const value = result[0]?.count ?? BigInt(0)
  return Number(value)
}

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const cacheKey = authResult.user.userId
  const cached = getDashboardCache(cacheKey)
  if (cached) {
    return NextResponse.json(cached)
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: {
        username: true,
        full_name: true,
        user_code: true,
        profile_image_url: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    let dailyProfitTotal = 0
    try {
      const dailyProfitSum = await prisma.walletLedger.aggregate({
        where: {
          user_id: authResult.user.userId,
          type: 'DAILY_PROFIT',
        },
        _sum: { amount_bs: true },
      })
      dailyProfitTotal = dailyProfitSum._sum.amount_bs || 0
    } catch (error) {
      console.error('Dashboard daily profit error:', error)
    }

    let activePurchases: {
      daily_profit_bs: number
      vip_package: { name: string; level: number; daily_profit_bs: number }
    }[] = []
    try {
      activePurchases = await prisma.purchase.findMany({
        where: {
          user_id: authResult.user.userId,
          status: 'ACTIVE',
        },
        orderBy: { activated_at: 'desc' },
        select: {
          daily_profit_bs: true,
          vip_package: {
            select: {
              name: true,
              level: true,
              daily_profit_bs: true,
            },
          },
        },
      })
    } catch (error) {
      console.error('Dashboard active purchases error:', error)
    }

    let referralBonus = 0
    try {
      const referralBonusSum = await prisma.walletLedger.aggregate({
        where: {
          user_id: authResult.user.userId,
          type: 'REFERRAL_BONUS',
        },
        _sum: { amount_bs: true },
      })
      referralBonus = referralBonusSum._sum.amount_bs || 0
    } catch (error) {
      console.error('Dashboard referral bonus error:', error)
    }

    let referralBonusTotal = referralBonus
    let referralBonusLevels: { level: number; amount_bs: number }[] = []
    try {
      // Sistema de bonos de patrocinio con 3 niveles
      const bonusRules = await prisma.referralBonusRule.findMany({
        where: { level: { in: [1, 2, 3] } },
        select: { level: true, percentage: true },
      })

      const ruleMap = new Map(bonusRules.map((r) => [r.level, r.percentage]))

      // Nivel 1: Referidos directos
      const level1Users = await prisma.user.findMany({
        where: { sponsor_id: authResult.user.userId },
        select: { id: true },
      })
      const level1Ids = level1Users.map((u) => u.id)

      // Nivel 2: Referidos de mis referidos
      const level2Users = level1Ids.length
        ? await prisma.user.findMany({
          where: { sponsor_id: { in: level1Ids } },
          select: { id: true },
        })
        : []
      const level2Ids = level2Users.map((u) => u.id)

      // Nivel 3: Referidos del nivel 2
      const level3Users = level2Ids.length
        ? await prisma.user.findMany({
          where: { sponsor_id: { in: level2Ids } },
          select: { id: true },
        })
        : []
      const level3Ids = level3Users.map((u) => u.id)

      // Solo 3 niveles de patrocinio
      const levels: { level: number; ids: string[] }[] = [
        { level: 1, ids: level1Ids },
        { level: 2, ids: level2Ids },
        { level: 3, ids: level3Ids },
      ]

      let computedTotal = 0
      const computedLevels: { level: number; amount_bs: number }[] = []
      for (const item of levels) {
        const percentage = ruleMap.get(item.level) || 0
        if (!percentage || item.ids.length === 0) {
          computedLevels.push({ level: item.level, amount_bs: 0 })
          continue
        }

        const sum = await prisma.purchase.aggregate({
          where: { user_id: { in: item.ids }, status: 'ACTIVE' },
          _sum: { investment_bs: true },
        })
        const base = sum._sum.investment_bs || 0
        const amount = (base * percentage) / 100
        computedTotal += amount
        computedLevels.push({ level: item.level, amount_bs: amount })
      }

      referralBonusTotal = computedTotal
      referralBonusLevels = computedLevels
    } catch (error) {
      console.error('Dashboard referral bonus total error:', error)
    }

    let totalEarningsValue = 0
    try {
      const totalEarnings = await prisma.walletLedger.aggregate({
        where: {
          user_id: authResult.user.userId,
          type: { in: ['DAILY_PROFIT', 'REFERRAL_BONUS', 'ADJUSTMENT', 'TIKTOK_BONUS'] },
        },
        _sum: { amount_bs: true },
      })
      totalEarningsValue = totalEarnings._sum.amount_bs || 0
    } catch (error) {
      console.error('Dashboard total earnings error:', error)
    }

    let adjustments: { amount: number; type: 'ABONADO' | 'DESCUENTO'; description: string }[] = []
    let adjustmentsTotal = 0
    try {
      const adjustmentLedgers = await prisma.walletLedger.findMany({
        where: {
          user_id: authResult.user.userId,
          type: 'ADJUSTMENT',
        },
        select: {
          amount_bs: true,
          description: true,
        },
        orderBy: { created_at: 'desc' },
      })

      adjustments = adjustmentLedgers.map((adj) => ({
        amount: adj.amount_bs,
        type: adj.amount_bs >= 0 ? 'ABONADO' as const : 'DESCUENTO' as const,
        description: adj.description || 'Ajuste manual',
      }))

      adjustmentsTotal = adjustmentLedgers.reduce((sum, adj) => sum + adj.amount_bs, 0)
    } catch (error) {
      console.error('Dashboard adjustments error:', error)
    }

    let networkCount = 0
    try {
      networkCount = await getNetworkCount(authResult.user.userId)
    } catch (error) {
      console.error('Dashboard network count error:', error)
    }

    let directReferrals = 0
    try {
      directReferrals = await prisma.user.count({
        where: { sponsor_id: authResult.user.userId },
      })
    } catch (error) {
      console.error('Dashboard direct referrals error:', error)
    }

    let bannersTop: any[] = []
    let bannersBottom: any[] = []
    let announcements: any[] = []
    try {
      bannersTop = await prisma.banner.findMany({
        where: { location: 'HOME_TOP', is_active: true },
        orderBy: { order: 'asc' },
      })

      bannersBottom = await prisma.banner.findMany({
        where: { location: 'HOME_BOTTOM', is_active: true },
        orderBy: { order: 'asc' },
      })

      announcements = await prisma.announcement.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
        take: 5,
      })
    } catch (error) {
      console.error('Dashboard banners error:', error)
    }

    let effortBonuses: any[] = []
    try {
      effortBonuses = await prisma.effortBonus.findMany({
        where: { is_active: true },
        orderBy: { sort_order: 'asc' },
      })
      // Init defaults if empty (fail-safe for frontend display)
      if (effortBonuses.length === 0) {
        // We rely on admin/api access to populate defaults mainly, or seed, but empty is safe to return as []
      }
    } catch (error) {
      console.error('Dashboard effort bonuses error:', error)
    }

    let latestUsers: any[] = []
    try {
      const users = await prisma.user.findMany({
        where: { role: { not: 'ADMIN' } },
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          username: true,
          full_name: true,
          created_at: true,
          profile_image_url: true,
          purchases: {
            where: { status: 'ACTIVE' },
            select: {
              vip_package: {
                select: { daily_profit_bs: true }
              }
            }
          },
          wallet_ledger: {
            select: { amount_bs: true, type: true }
          }
        },
      })

      // Calcular ganancias de cada usuario
      latestUsers = users.map(u => {
        // Calcular ganancias totales (solo tipos de ganancia)
        const totalEarnings = u.wallet_ledger
          .filter(w => ['DAILY_PROFIT', 'REFERRAL_BONUS', 'ADJUSTMENT', 'TIKTOK_BONUS'].includes(w.type))
          .reduce((sum, w) => sum + (w.amount_bs || 0), 0)

        // Calcular balance de billetera (todas las transacciones)
        const walletBalance = u.wallet_ledger.reduce((sum, w) => sum + (w.amount_bs || 0), 0)

        return {
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          created_at: u.created_at,
          profile_image_url: u.profile_image_url,
          daily_profit: u.purchases.reduce((sum, p) => sum + (p.vip_package?.daily_profit_bs || 0), 0),
          total_earnings: totalEarnings,
          wallet_balance: walletBalance
        }
      })
    } catch (error) {
      console.error('Dashboard latest users error:', error)
    }

    // Usar la ganancia del paquete VIP actual (no la guardada en la compra)
    const activePurchasesWithCurrentProfit = activePurchases.map(p => ({
      ...p,
      daily_profit_bs: p.vip_package.daily_profit_bs, // Siempre usar ganancia actual del paquete
    }))

    const payload = {
      user,
      daily_profit: activePurchasesWithCurrentProfit.reduce((sum, p) => sum + p.daily_profit_bs, 0),
      daily_profit_total: dailyProfitTotal,
      active_vip_daily: activePurchasesWithCurrentProfit[0]?.daily_profit_bs || 0,
      active_vip_name: activePurchasesWithCurrentProfit[0]?.vip_package.name || null,
      active_vip_status: activePurchasesWithCurrentProfit.length ? 'ACTIVE' : null,
      has_active_vip: activePurchasesWithCurrentProfit.length > 0,
      active_purchases: activePurchasesWithCurrentProfit,
      referral_bonus: referralBonus,
      referral_bonus_total: referralBonusTotal,
      referral_bonus_levels: referralBonusLevels,
      adjustments: {
        items: adjustments,
        total: adjustmentsTotal,
      },
      total_earnings: totalEarningsValue,
      network_count: networkCount,
      direct_referrals: directReferrals,
      banners_top: bannersTop,
      banners_bottom: bannersBottom,
      announcements,
      effort_bonuses: effortBonuses,
      latest_users: latestUsers,
    }

    setDashboardCache(cacheKey, payload)

    return NextResponse.json(payload)
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al cargar dashboard' },
      { status: 500 }
    )
  }
}
