import { prisma } from '@/lib/db'

export async function payReferralBonuses(
  userId: string,
  investmentBs: number,
  level: number = 1
): Promise<void> {
  if (level > 7) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sponsor_id: true },
  })

  if (!user || !user.sponsor_id) return

  const bonusRule = await prisma.referralBonusRule.findUnique({
    where: { level },
  })

  if (bonusRule && bonusRule.percentage > 0) {
    const bonusAmount = (investmentBs * bonusRule.percentage) / 100

    await prisma.walletLedger.create({
      data: {
        user_id: user.sponsor_id,
        type: 'REFERRAL_BONUS',
        amount_bs: bonusAmount,
        description: `Bono de referido nivel ${level} (${bonusRule.percentage}%)`,
      },
    })
  }

  await payReferralBonuses(user.sponsor_id, investmentBs, level + 1)
}
