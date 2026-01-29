import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/auth/middleware'

export const dynamic = 'force-dynamic'

// GET - Obtener lista de conversaciones con usuarios (optimizado)
export async function GET(req: NextRequest) {
  const authResult = requireAdmin(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    // Usar raw query para obtener todo en una sola consulta optimizada
    const conversationsData = await prisma.$queryRaw<Array<{
      user_id: string
      username: string
      full_name: string
      last_message_id: string
      last_message: string
      last_sender_role: string
      last_is_read: boolean
      last_created_at: Date
      unread_count: bigint
    }>>`
      SELECT
        u.id as user_id,
        u.username,
        u.full_name,
        lm.id as last_message_id,
        lm.message as last_message,
        lm.sender_role as last_sender_role,
        lm.is_read as last_is_read,
        lm.created_at as last_created_at,
        COALESCE(unread.cnt, 0) as unread_count
      FROM (
        SELECT DISTINCT user_id FROM "ChatMessage"
      ) cm
      JOIN "User" u ON u.id = cm.user_id
      LEFT JOIN LATERAL (
        SELECT id, message, sender_role, is_read, created_at
        FROM "ChatMessage"
        WHERE user_id = cm.user_id
        ORDER BY created_at DESC
        LIMIT 1
      ) lm ON true
      LEFT JOIN (
        SELECT user_id, COUNT(*) as cnt
        FROM "ChatMessage"
        WHERE sender_role = 'USER' AND is_read = false
        GROUP BY user_id
      ) unread ON unread.user_id = cm.user_id
      ORDER BY lm.created_at DESC NULLS LAST
    `

    const conversations = conversationsData.map(row => ({
      user_id: row.user_id,
      user: {
        id: row.user_id,
        username: row.username,
        full_name: row.full_name,
      },
      last_message: row.last_message_id ? {
        id: row.last_message_id,
        user_id: row.user_id,
        message: row.last_message,
        sender_role: row.last_sender_role,
        is_read: row.last_is_read,
        created_at: row.last_created_at,
      } : null,
      unread_count: Number(row.unread_count),
    }))

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Admin chat GET error:', error)
    return NextResponse.json({ error: 'Error al cargar conversaciones' }, { status: 500 })
  }
}
