import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET - Listar productos activos (público para usuarios)
export async function GET(request: NextRequest) {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    })

    // Obtener número de WhatsApp global
    let config = await prisma.globalConfig.findUnique({
      where: { id: 1 },
    })

    return NextResponse.json({
      products,
      whatsapp_number: config?.whatsapp_number || '',
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
