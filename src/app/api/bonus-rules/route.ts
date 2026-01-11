import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const rules = await prisma.referralBonusRule.findMany({
      orderBy: { level: 'asc' },
    })
    return NextResponse.json(rules)
  } catch (error) {
    console.error('Bonus rules error:', error)
    return NextResponse.json(
      { error: 'Error al cargar bonos' },
      { status: 500 }
    )
  }
}
