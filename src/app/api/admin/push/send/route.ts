import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { sendPushNotification, getRandomNotification } from '@/lib/push-notifications'

// Forzar runtime de Node.js (web-push requiere APIs de Node)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Verificar que sea admin
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const body = await req.json()
    const { title, body: messageBody, type = 'custom', count = 1 } = body

    // Obtener todas las suscripciones activas
    const subscriptions = await prisma.pushSubscription.findMany()

    if (subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay suscriptores registrados',
        sent: 0
      })
    }

    let sent = 0
    let failed = 0
    const failedEndpoints: string[] = []

    for (const sub of subscriptions) {
      let notification: { title: string; body: string }

      if (type === 'random') {
        notification = getRandomNotification()
      } else {
        notification = { title, body: messageBody }
      }

      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        {
          ...notification,
          url: '/home',
          tag: `smarthogar-${Date.now()}`,
        }
      )

      if (result.success) {
        sent++
      } else {
        failed++
        // Si la suscripción ya no es válida (410 Gone), eliminarla
        if (result.statusCode === 410) {
          failedEndpoints.push(sub.endpoint)
        }
      }
    }

    // Eliminar suscripciones inválidas
    if (failedEndpoints.length > 0) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: failedEndpoints } },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Notificaciones enviadas`,
      sent,
      failed,
      cleaned: failedEndpoints.length,
    })
  } catch (error) {
    console.error('Error sending push notifications:', error)
    return NextResponse.json(
      { error: 'Error al enviar notificaciones' },
      { status: 500 }
    )
  }
}

// Obtener estadísticas de suscriptores
export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: authResult.user.userId },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    const totalSubscriptions = await prisma.pushSubscription.count()
    const withUser = await prisma.pushSubscription.count({
      where: { user_id: { not: null } },
    })

    return NextResponse.json({
      total: totalSubscriptions,
      with_user: withUser,
      anonymous: totalSubscriptions - withUser,
    })
  } catch (error) {
    console.error('Error getting push stats:', error)
    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    )
  }
}
