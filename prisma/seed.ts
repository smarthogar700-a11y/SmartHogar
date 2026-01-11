import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Seed VIP Packages
  const vipPackages = [
    { level: 1, name: 'VIP 1', investment_bs: 100, daily_profit_bs: 4 },
    { level: 2, name: 'VIP 2', investment_bs: 300, daily_profit_bs: 10 },
    { level: 3, name: 'VIP 3', investment_bs: 500, daily_profit_bs: 17 },
    { level: 4, name: 'VIP 4', investment_bs: 1000, daily_profit_bs: 35 },
    { level: 5, name: 'VIP 5', investment_bs: 2000, daily_profit_bs: 70 },
    { level: 6, name: 'VIP 6', investment_bs: 3000, daily_profit_bs: 105 },
    { level: 7, name: 'VIP 7', investment_bs: 4000, daily_profit_bs: 135 },
  ]

  for (const pkg of vipPackages) {
    await prisma.vipPackage.upsert({
      where: { level: pkg.level },
      update: {},
      create: pkg,
    })
  }
  console.log('VIP Packages seeded')

  // Seed Referral Bonus Rules
  const bonusRules = [
    { level: 1, percentage: 12 },
    { level: 2, percentage: 5 },
    { level: 3, percentage: 1 },
    { level: 4, percentage: 0 },
    { level: 5, percentage: 0 },
    { level: 6, percentage: 0 },
    { level: 7, percentage: 0 },
  ]

  for (const rule of bonusRules) {
    await prisma.referralBonusRule.upsert({
      where: { level: rule.level },
      update: {},
      create: rule,
    })
  }
  console.log('Referral Bonus Rules seeded')

  // Seed Banners (examples)
  const banners = [
    {
      location: 'HOME_TOP' as const,
      image_url: 'https://via.placeholder.com/800x300/C9A24D/FFFFFF?text=Banner+Top+1',
      order: 1,
    },
    {
      location: 'HOME_TOP' as const,
      image_url: 'https://via.placeholder.com/800x300/E6C87A/0B0B0B?text=Banner+Top+2',
      order: 2,
    },
    {
      location: 'HOME_BOTTOM' as const,
      image_url: 'https://via.placeholder.com/800x300/5A4A2F/FFFFFF?text=Banner+Bottom+1',
      order: 1,
    },
    {
      location: 'HOME_BOTTOM' as const,
      image_url: 'https://via.placeholder.com/800x300/2B2B2B/E6C87A?text=Banner+Bottom+2',
      order: 2,
    },
  ]

  for (const banner of banners) {
    await prisma.banner.create({
      data: banner,
    })
  }
  console.log('Banners seeded')

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
