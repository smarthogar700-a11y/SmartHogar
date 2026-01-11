import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

async function getNetworkCount(userId: string): Promise<number> {
  let count = 0
  const queue = [userId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const currentId = queue.shift()!
    if (visited.has(currentId)) continue
    visited.add(currentId)

    const referrals = await prisma.user.findMany({
      where: { sponsor_id: currentId },
      select: { id: true },
    })

    count += referrals.length
    referrals.forEach(ref => queue.push(ref.id))
  }

  return count
}

export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: {
        username: true,
        full_name: true,
        user_code: true,
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
      vip_package: { name: string; level: number }
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
      const bonusRules = await prisma.referralBonusRule.findMany({
        where: { level: { in: [1, 2, 3, 4, 5, 6, 7] } },
        select: { level: true, percentage: true },
      })

      const ruleMap = new Map(bonusRules.map((r) => [r.level, r.percentage]))

      const level1Users = await prisma.user.findMany({
        where: { sponsor_id: authResult.user.userId },
        select: { id: true },
      })
      const level1Ids = level1Users.map((u) => u.id)

      const level2Users = level1Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level1Ids } },
            select: { id: true },
          })
        : []
      const level2Ids = level2Users.map((u) => u.id)

      const level3Users = level2Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level2Ids } },
            select: { id: true },
          })
        : []
      const level3Ids = level3Users.map((u) => u.id)

      const level4Users = level3Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level3Ids } },
            select: { id: true },
          })
        : []
      const level4Ids = level4Users.map((u) => u.id)

      const level5Users = level4Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level4Ids } },
            select: { id: true },
          })
        : []
      const level5Ids = level5Users.map((u) => u.id)

      const level6Users = level5Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level5Ids } },
            select: { id: true },
          })
        : []
      const level6Ids = level6Users.map((u) => u.id)

      const level7Users = level6Ids.length
        ? await prisma.user.findMany({
            where: { sponsor_id: { in: level6Ids } },
            select: { id: true },
          })
        : []
      const level7Ids = level7Users.map((u) => u.id)

      const levels: { level: number; ids: string[] }[] = [
        { level: 1, ids: level1Ids },
        { level: 2, ids: level2Ids },
        { level: 3, ids: level3Ids },
        { level: 4, ids: level4Ids },
        { level: 5, ids: level5Ids },
        { level: 6, ids: level6Ids },
        { level: 7, ids: level7Ids },
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
          type: { in: ['DAILY_PROFIT', 'REFERRAL_BONUS', 'ADJUSTMENT'] },
        },
        _sum: { amount_bs: true },
      })
      totalEarningsValue = totalEarnings._sum.amount_bs || 0
    } catch (error) {
      console.error('Dashboard total earnings error:', error)
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

    return NextResponse.json({
      user,
      daily_profit: activePurchases.reduce((sum, p) => sum + p.daily_profit_bs, 0),
      daily_profit_total: dailyProfitTotal,
      active_vip_daily: activePurchases[0]?.daily_profit_bs || 0,
      active_vip_name: activePurchases[0]?.vip_package.name || null,
      active_vip_status: activePurchases.length ? 'ACTIVE' : null,
      has_active_vip: activePurchases.length > 0,
      active_purchases: activePurchases,
      referral_bonus: referralBonus,
      referral_bonus_total: referralBonusTotal,
      referral_bonus_levels: referralBonusLevels,
      total_earnings: totalEarningsValue,
      network_count: networkCount,
      direct_referrals: directReferrals,
      banners_top: bannersTop,
      banners_bottom: bannersBottom,
      announcements,
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    return NextResponse.json(
      { error: 'Error al cargar dashboard' },
      { status: 500 }
    )
  }
}
