import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export async function POST(req: NextRequest) {
  console.log('📥 [PUSH] Recibiendo suscripción...')

  try {
    const body = await req.json()
    const { subscription } = body

    console.log('📥 [PUSH] Endpoint:', subscription?.endpoint?.substring(0, 50) + '...')

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      console.error('❌ [PUSH] Suscripción inválida:', { subscription })
      return NextResponse.json(
        { error: 'Suscripción inválida' },
        { status: 400 }
      )
    }

    // Intentar obtener el usuario autenticado (opcional)
    let userId: string | null = null
    const authResult = requireAuth(req)
    if (!('error' in authResult)) {
      userId = authResult.user.userId
      console.log('📥 [PUSH] Usuario autenticado:', userId)
    } else {
      console.log('📥 [PUSH] Usuario anónimo')
    }

    // Guardar o actualizar la suscripción
    const saved = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      update: {
        user_id: userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updated_at: new Date(),
      },
    })

    console.log('✅ [PUSH] Suscripción guardada:', saved.id)

    // Contar total de suscripciones
    const total = await prisma.pushSubscription.count()
    console.log('📊 [PUSH] Total suscripciones:', total)

    return NextResponse.json({ success: true, id: saved.id, total })
  } catch (error) {
    console.error('❌ [PUSH] Error guardando suscripción:', error)
    return NextResponse.json(
      { error: 'Error al guardar suscripción' },
      { status: 500 }
    )
  }
}
