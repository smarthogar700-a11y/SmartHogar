import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

// DELETE - Eliminar todo el historial de chat de un usuario
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    await prisma.chatMessage.deleteMany({
      where: { user_id: params.userId },
    })

    return NextResponse.json({ success: true, message: 'Historial eliminado' })
  } catch (error) {
    console.error('Admin chat DELETE error:', error)
    return NextResponse.json({ error: 'Error al eliminar historial' }, { status: 500 })
  }
}

// GET - Obtener mensajes de un usuario especifico
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { user_id: params.userId },
      orderBy: { created_at: 'asc' },
    })

    // Marcar mensajes del usuario como leidos
    await prisma.chatMessage.updateMany({
      where: {
        user_id: params.userId,
        sender_role: 'USER',
        is_read: false,
      },
      data: { is_read: true },
    })

    // Obtener info del usuario
    const user = await prisma.user.findUnique({
      where: { id: params.userId },
      select: { id: true, username: true, full_name: true },
    })

    return NextResponse.json({ messages, user })
  } catch (error) {
    console.error('Admin chat user GET error:', error)
    return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 })
  }
}

// POST - Enviar mensaje a un usuario
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const authResult = requireAdmin(req)
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
        user_id: params.userId,
        sender_role: 'ADMIN',
        message: message.trim(),
        is_read: false,
      },
    })

    return NextResponse.json({ message: chatMessage })
  } catch (error) {
    console.error('Admin chat POST error:', error)
    return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 })
  }
}
