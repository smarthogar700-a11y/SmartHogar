import webPush from 'web-push'

// Variable para controlar si ya se configuró
let isConfigured = false

// Configurar VAPID de forma lazy (solo cuando se necesite)
function getWebPush() {
  if (!isConfigured) {
    webPush.setVapidDetails(
      process.env.VAPID_EMAIL || 'mailto:admin@smarthogar.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || ''
    )
    isConfigured = true
  }
  return webPush
}

// Nombres bolivianos
const NOMBRES = [
  'Edgar', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'Juan', 'Sofía', 'Miguel', 'Carmen',
  'Roberto', 'Patricia', 'Fernando', 'Gabriela', 'José', 'Valentina', 'Andrés', 'Lucía', 'Ricardo', 'Isabella',
  'Eduardo', 'Camila', 'Francisco', 'Daniela', 'Alberto', 'Mariana', 'Sergio', 'Natalia', 'Jorge', 'Alejandra',
  'Luis', 'Fernanda', 'Raúl', 'Paula', 'Gustavo', 'Andrea', 'Martín', 'Claudia', 'Nicolás', 'Verónica',
  'Héctor', 'Silvia', 'Ramiro', 'Mónica', 'Cristian', 'Lorena', 'Javier', 'Carolina', 'Óscar', 'Estefanía',
  'Diego', 'Marcela', 'Arturo', 'Beatriz', 'Gonzalo', 'Roxana', 'Mauricio', 'Paola', 'Víctor', 'Adriana',
  'Rodrigo', 'Cecilia', 'Iván', 'Gloria', 'Santiago', 'Teresa', 'Esteban', 'Rosa', 'Fabián', 'Elena',
  'Tomás', 'Sandra', 'Gabriel', 'Alicia', 'César', 'Norma', 'Leonardo', 'Carla', 'Emilio', 'Diana',
  'Julián', 'Martha', 'René', 'Yolanda', 'Hugo', 'Estela', 'Armando', 'Susana', 'Alfredo', 'Blanca',
  'Mario', 'Lidia', 'Raquel', 'Ernesto', 'Soledad', 'Ignacio', 'Marisol', 'Felipe', 'Noemí', 'Pablo'
]

const CIUDADES = [
  'Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Trinidad', 'Cobija',
  'El Alto', 'Montero', 'Quillacollo', 'Sacaba', 'Warnes', 'Yacuiba', 'Riberalta'
]

const randomAmount = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomName = () => NOMBRES[Math.floor(Math.random() * NOMBRES.length)]
const randomCity = () => CIUDADES[Math.floor(Math.random() * CIUDADES.length)]

// Generar 200 notificaciones diferentes
export function generateFakeNotifications(): { title: string; body: string }[] {
  const notifications: { title: string; body: string }[] = []

  // Tipo 1: Retiros exitosos (50)
  for (let i = 0; i < 50; i++) {
    const nombre = randomName()
    const cantidad = randomAmount(100, 5000)
    const ciudad = randomCity()
    const templates = [
      { title: '💰 Retiro Exitoso', body: `${nombre} de ${ciudad} retiró Bs ${cantidad.toLocaleString('es-BO')} exitosamente` },
      { title: '🎉 ¡Nuevo Retiro!', body: `¡${nombre} acaba de retirar Bs ${cantidad.toLocaleString('es-BO')}!` },
      { title: '✅ Retiro Confirmado', body: `${nombre} recibió Bs ${cantidad.toLocaleString('es-BO')} en su cuenta` },
      { title: '💵 Pago Procesado', body: `${nombre} cobró sus ganancias: Bs ${cantidad.toLocaleString('es-BO')}` },
      { title: '🏆 ¡Felicidades!', body: `${nombre} de ${ciudad} retiró Bs ${cantidad.toLocaleString('es-BO')}` },
    ]
    notifications.push(templates[i % templates.length])
  }

  // Tipo 2: Ganancias diarias (40)
  for (let i = 0; i < 40; i++) {
    const nombre = randomName()
    const cantidad = randomAmount(50, 349)
    const templates = [
      { title: '📈 Ganancia Activada', body: `${nombre} ganó Bs ${cantidad} trabajando desde casa` },
      { title: '💰 ¡Ganancias del día!', body: `${nombre} activó +Bs ${cantidad} en ganancias diarias` },
      { title: '🔥 ¡Sigue sumando!', body: `${nombre} ya ganó Bs ${cantidad} hoy ¿y tú?` },
      { title: '✨ Ganancia Diaria', body: `Hoy ${nombre} sumó Bs ${cantidad} a su billetera` },
    ]
    notifications.push(templates[i % templates.length])
  }

  // Tipo 3: Nuevos usuarios (30)
  for (let i = 0; i < 30; i++) {
    const nombre = randomName()
    const ciudad = randomCity()
    const templates = [
      { title: '👋 Nuevo Miembro', body: `${nombre} de ${ciudad} se unió a SmartHogar` },
      { title: '🎉 ¡Bienvenido!', body: `${nombre} comenzó a ganar desde ${ciudad}` },
      { title: '🚀 Nuevo Inversor', body: `${nombre} tomó la decisión correcta y se registró` },
    ]
    notifications.push(templates[i % templates.length])
  }

  // Tipo 4: Paquetes VIP (30)
  for (let i = 0; i < 30; i++) {
    const nombre = randomName()
    const paquetes = ['VIP Bronce', 'VIP Plata', 'VIP Oro', 'VIP Platino', 'VIP Diamante']
    const paquete = paquetes[Math.floor(Math.random() * paquetes.length)]
    const templates = [
      { title: '⭐ Nuevo VIP', body: `${nombre} activó su paquete ${paquete}` },
      { title: '🏅 ¡Subió de nivel!', body: `¡${nombre} ahora es miembro ${paquete}!` },
      { title: '💎 Inversión Exitosa', body: `${nombre} invirtió en ${paquete}` },
    ]
    notifications.push(templates[i % templates.length])
  }

  // Tipo 5: Mensajes motivacionales (30)
  const motivacionales = [
    { title: '🤔 ¿Qué esperas?', body: '¿Y tú qué esperas para trabajar desde casa?' },
    { title: '👥 ¡Únete!', body: 'Ya hay personas como tú ganando plata desde casa' },
    { title: '🇧🇴 Oportunidad', body: 'Miles de bolivianos ya están generando ingresos extras' },
    { title: '⏰ ¡Es tu momento!', body: 'Tu vecino ya está ganando ¿y tú?' },
    { title: '🚀 ¡Empieza HOY!', body: 'El mejor momento para empezar es AHORA' },
    { title: '💸 No pierdas más', body: 'Cada día que pasa es dinero que pierdes' },
    { title: '🎯 Un clic', body: 'Tu futuro financiero está a un clic de distancia' },
    { title: '👨‍👩‍👧‍👦 Comunidad', body: 'Únete a la comunidad que está cambiando vidas' },
    { title: '⚡ Mientras lees...', body: 'Mientras lees esto, otros están ganando' },
    { title: '🏃 ¡No esperes más!', body: 'El éxito no espera, toma acción' },
    { title: '✨ Hoy es el día', body: 'Hoy puede ser el día que cambie tu vida' },
    { title: '❓ ¿Cuánto más?', body: '¿Cuánto más vas a esperar para empezar?' },
    { title: '❤️ Tu familia', body: 'Tu familia merece una mejor vida' },
    { title: '🧠 Trabaja inteligente', body: 'Trabaja inteligente, no trabajes duro' },
    { title: '🌱 Invierte hoy', body: 'Invierte hoy, cosecha mañana' },
    { title: '💤 El dinero no duerme', body: 'El dinero no duerme ¿por qué tú sí?' },
    { title: '🌟 Deja de soñar', body: 'Deja de soñar y empieza a ganar' },
    { title: '📱 Tu teléfono', body: 'Tu teléfono puede ser tu fuente de ingresos' },
    { title: '🎖️ Miles lo lograron', body: 'Miles ya lo lograron, tú puedes ser el próximo' },
    { title: '🔓 Libertad financiera', body: 'La libertad financiera está más cerca de lo que crees' },
    { title: '⏳ Cada minuto', body: 'Cada minuto cuenta, no lo desperdicies' },
    { title: '🙏 Tu futuro', body: 'Tu futuro te agradecerá por empezar hoy' },
    { title: '💪 Es decisión', body: 'El éxito no es suerte, es decisión' },
    { title: '⛓️ Rompe cadenas', body: 'Rompe las cadenas del trabajo tradicional' },
    { title: '😴 Ingresos pasivos', body: 'Genera ingresos mientras duermes' },
    { title: '🔥 ¡TU MOMENTO!', body: 'Tu momento es AHORA, no mañana' },
    { title: '📅 No dejes para mañana', body: 'No dejes para mañana lo que puedes ganar hoy' },
    { title: '🚪 La oportunidad', body: 'La oportunidad toca tu puerta ¿vas a abrir?' },
    { title: '💰 Invierte en ti', body: 'La mejor inversión es en ti mismo' },
    { title: '🎁 Regalo del día', body: 'SmartHogar: tu oportunidad de cambiar tu vida' },
  ]
  notifications.push(...motivacionales)

  // Tipo 6: Bonos de referidos (20)
  for (let i = 0; i < 20; i++) {
    const nombre = randomName()
    const cantidad = randomAmount(50, 500)
    const referidos = randomAmount(1, 10)
    const templates = [
      { title: '🤝 Bono de Referido', body: `${nombre} ganó Bs ${cantidad} por invitar ${referidos} amigos` },
      { title: '🎁 ¡Bono activado!', body: `${nombre} recibió Bs ${cantidad} por referidos` },
      { title: '👥 Red en crecimiento', body: `${nombre} sumó ${referidos} personas y ganó Bs ${cantidad}` },
    ]
    notifications.push(templates[i % templates.length])
  }

  return notifications.sort(() => Math.random() - 0.5)
}

// Obtener una notificación aleatoria
export function getRandomNotification(): { title: string; body: string } {
  const notifications = generateFakeNotifications()
  return notifications[Math.floor(Math.random() * notifications.length)]
}

// Enviar notificación push
export async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; url?: string; tag?: string }
) {
  console.log('📤 [PUSH] Enviando a:', subscription.endpoint.substring(0, 60) + '...')

  try {
    const push = getWebPush()

    // Verificar que las claves VAPID estén configuradas
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.VAPID_PRIVATE_KEY

    console.log('📤 [PUSH] VAPID Public Key existe:', !!publicKey, publicKey?.substring(0, 20) + '...')
    console.log('📤 [PUSH] VAPID Private Key existe:', !!privateKey)

    await push.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      },
      JSON.stringify(payload)
    )
    console.log('✅ [PUSH] Enviado exitosamente')
    return { success: true }
  } catch (error: any) {
    console.error('❌ [PUSH] Error:', error.message)
    console.error('❌ [PUSH] Status:', error.statusCode)
    console.error('❌ [PUSH] Body:', error.body)
    return { success: false, error: error.message, statusCode: error.statusCode }
  }
}
