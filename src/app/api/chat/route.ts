import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

// GET - Obtener mensajes del usuario
export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { user_id: authResult.user.userId },
      orderBy: { created_at: 'asc' },
    })

    // Marcar mensajes del admin como leidos
    await prisma.chatMessage.updateMany({
      where: {
        user_id: authResult.user.userId,
        sender_role: 'ADMIN',
        is_read: false,
      },
      data: { is_read: true },
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Chat GET error:', error)
    return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
  }
}

// POST - Enviar mensaje al admin
export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const { message } = await req.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Mensaje vacio' }, { status: 400 })
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        user_id: authResult.user.userId,
        sender_role: 'USER',
        message: message.trim(),
        is_read: false,
      },
    })

    return NextResponse.json({ message: chatMessage })
  } catch (error) {
    console.error('Chat POST error:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
