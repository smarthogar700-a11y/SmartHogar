import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth/middleware'
import { getSupabaseAdminClient } from '@/lib/supabaseClient'

const TASK_ORDER = ['FOLLOW', 'LIKE', 'COMMENT', 'SHARE'] as const
const BONUS_PER_TASK = 2.50
const MAX_BONUS = 10

// Función para extraer el path del archivo de una URL de Supabase
function extractFilePath(url: string): string | null {
  try {
    // URL típica: https://xxx.supabase.co/storage/v1/object/public/Smart/uploads/userId_timestamp.ext
    const match = url.match(/\/Smart\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}

// Función para eliminar imágenes de Supabase Storage
async function deleteScreenshots(screenshotUrls: string[]): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient()
    const filePaths = screenshotUrls
      .map(url => extractFilePath(url))
      .filter((path): path is string => path !== null)

    if (filePaths.length > 0) {
      const { error } = await supabase.storage
        .from('Smart')
        .remove(filePaths)

      if (error) {
        console.error('Error eliminando imágenes de TikTok:', error)
      } else {
        console.log(`[TIKTOK] ${filePaths.length} imágenes eliminadas de Storage`)
      }
    }
  } catch (error) {
    console.error('Error al eliminar screenshots:', error)
  }
}

// GET - Obtener estado de tareas del usuario
export async function GET(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const userId = authResult.user.userId

    // Verificar si tiene VIP activo
    const hasActiveVip = await prisma.purchase.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
    })

    if (hasActiveVip) {
      return NextResponse.json({
        has_vip: true,
        tasks_completed: 0,
        total_earned: 0,
        next_task: null,
        is_complete: true,
      })
    }

    // Obtener tareas completadas
    const completedTasks = await prisma.tikTokTask.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    })

    const tasksCompleted = completedTasks.length
    const totalEarned = tasksCompleted * BONUS_PER_TASK
    const isComplete = totalEarned >= MAX_BONUS

    // Determinar siguiente tarea
    const completedTypes = completedTasks.map(t => t.task_type)
    const nextTask = TASK_ORDER.find(t => !completedTypes.includes(t)) || null

    return NextResponse.json({
      has_vip: false,
      tasks_completed: tasksCompleted,
      total_earned: totalEarned,
      next_task: nextTask,
      is_complete: isComplete,
      completed_tasks: completedTasks.map(t => ({
        type: t.task_type,
        amount: t.amount_bs,
        created_at: t.created_at,
      })),
    })
  } catch (error) {
    console.error('Get TikTok tasks error:', error)
    return NextResponse.json(
      { error: 'Error al obtener tareas' },
      { status: 500 }
    )
  }
}

// POST - Enviar una nueva tarea
export async function POST(req: NextRequest) {
  const authResult = requireAuth(req)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  try {
    const userId = authResult.user.userId
    const { screenshot_url, task_type } = await req.json()

    if (!screenshot_url || !task_type) {
      return NextResponse.json(
        { error: 'Captura y tipo de tarea requeridos' },
        { status: 400 }
      )
    }

    // Verificar si tiene VIP activo
    const hasActiveVip = await prisma.purchase.findFirst({
      where: {
        user_id: userId,
        status: 'ACTIVE',
      },
    })

    if (hasActiveVip) {
      return NextResponse.json(
        { error: 'Ya tienes un plan VIP activo' },
        { status: 400 }
      )
    }

    // Verificar tareas completadas
    const completedTasks = await prisma.tikTokTask.findMany({
      where: { user_id: userId },
    })

    if (completedTasks.length >= 4) {
      return NextResponse.json(
        { error: 'Ya completaste todas las tareas' },
        { status: 400 }
      )
    }

    // Verificar que no haya completado esta tarea ya
    const alreadyCompleted = completedTasks.find(t => t.task_type === task_type)
    if (alreadyCompleted) {
      return NextResponse.json(
        { error: 'Ya completaste esta tarea' },
        { status: 400 }
      )
    }

    // Verificar que sea la tarea correcta en orden
    const completedTypes = completedTasks.map(t => t.task_type)
    const expectedTask = TASK_ORDER.find(t => !completedTypes.includes(t))

    if (task_type !== expectedTask) {
      return NextResponse.json(
        { error: `Debes completar primero la tarea: ${expectedTask}` },
        { status: 400 }
      )
    }

    // Crear la tarea
    await prisma.tikTokTask.create({
      data: {
        user_id: userId,
        task_type: task_type,
        screenshot_url: screenshot_url,
        amount_bs: BONUS_PER_TASK,
      },
    })

    const newTotal = (completedTasks.length + 1) * BONUS_PER_TASK
    const isComplete = newTotal >= MAX_BONUS

    // Si completó las 4 tareas, abonar inmediatamente a la billetera y eliminar imágenes
    if (isComplete) {
      // Verificar si ya se abonó el bono (para evitar duplicados)
      const existingBonus = await prisma.walletLedger.findFirst({
        where: {
          user_id: userId,
          type: 'TIKTOK_BONUS',
        },
      })

      // Solo abonar si no existe un bono previo
      if (!existingBonus) {
        // Abonar los 10 Bs inmediatamente a la billetera
        await prisma.walletLedger.create({
          data: {
            user_id: userId,
            type: 'TIKTOK_BONUS',
            amount_bs: MAX_BONUS,
            description: 'Bono por completar tareas de TikTok',
          },
        })
        console.log(`[TIKTOK] Bs ${MAX_BONUS} abonados a billetera del usuario ${userId}`)
      }

      // Obtener todas las URLs de screenshots (incluyendo la recién agregada)
      const allTasks = await prisma.tikTokTask.findMany({
        where: { user_id: userId },
        select: { screenshot_url: true },
      })

      const screenshotUrls = allTasks.map(t => t.screenshot_url)

      // Eliminar imágenes de Supabase Storage (async, no bloqueante)
      deleteScreenshots(screenshotUrls)

      // Limpiar las URLs de los registros (para privacidad)
      await prisma.tikTokTask.updateMany({
        where: { user_id: userId },
        data: { screenshot_url: '' },
      })

      console.log(`[TIKTOK] Usuario ${userId} completó las 4 tareas. Imágenes eliminadas.`)
    }

    // Determinar siguiente tarea
    const newCompletedTypes = [...completedTypes, task_type]
    const nextTask = TASK_ORDER.find(t => !newCompletedTypes.includes(t)) || null

    return NextResponse.json({
      success: true,
      message: isComplete
        ? `¡Felicidades! Has acumulado Bs ${newTotal.toFixed(2)}`
        : `+Bs ${BONUS_PER_TASK.toFixed(2)} acumulados`,
      tasks_completed: completedTasks.length + 1,
      total_earned: newTotal,
      next_task: nextTask,
      is_complete: isComplete,
    })
  } catch (error) {
    console.error('Submit TikTok task error:', error)
    return NextResponse.json(
      { error: 'Error al enviar tarea' },
      { status: 500 }
    )
  }
}
