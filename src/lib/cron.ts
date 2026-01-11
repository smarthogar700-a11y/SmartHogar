import cron from 'node-cron'

let isScheduled = false

export function startDailyProfitCron() {
  if (isScheduled) {
    console.log('[CRON] Ya está programado')
    return
  }

  // Programar para la 1 AM hora Bolivia (UTC-4)
  // En servidor UTC esto sería 5 AM
  // Formato: segundo minuto hora dia mes dia-semana
  // '0 1 * * *' = Todos los días a la 1:00 AM (hora local del servidor)

  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Ejecutando ganancias diarias automáticas...')

    try {
      const response = await fetch('http://localhost:3000/api/cron/daily-profit', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.CRON_SECRET || 'cron-secret-change-me'}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        console.log('[CRON] ✅ Ganancias diarias procesadas:', data.processed)
      } else {
        console.error('[CRON] ❌ Error en cron:', data.error)
      }
    } catch (error) {
      console.error('[CRON] ❌ Error ejecutando cron:', error)
    }
  }, {
    timezone: 'America/La_Paz' // Hora de Bolivia (UTC-4)
  })

  isScheduled = true
  console.log('[CRON] ✅ Programado: Ganancias diarias a la 1 AM hora Bolivia')
  console.log('[CRON] Próxima ejecución:', getNextCronTime())
}

function getNextCronTime() {
  const now = new Date()
  const next = new Date(now)

  // Configurar a 1 AM
  next.setHours(1, 0, 0, 0)

  // Si ya pasó 1 AM hoy, mover al siguiente día
  if (next <= now) {
    next.setDate(next.getDate() + 1)
  }

  return next.toLocaleString('es-BO', { timeZone: 'America/La_Paz' })
}
