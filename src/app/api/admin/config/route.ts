import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

// GET - Obtener configuración global
export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    let config = await prisma.globalConfig.findUnique({
      where: { id: 1 },
    })

    if (!config) {
      config = await prisma.globalConfig.create({
        data: {
          id: 1,
          whatsapp_number: '',
        },
      })
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// PUT - Actualizar configuración global
export async function PUT(request: NextRequest) {
  const authResult = requireAdmin(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const body = await request.json()
    const { whatsapp_number } = body

    const config = await prisma.globalConfig.upsert({
      where: { id: 1 },
      update: { whatsapp_number: whatsapp_number || '' },
      create: {
        id: 1,
        whatsapp_number: whatsapp_number || '',
      },
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
