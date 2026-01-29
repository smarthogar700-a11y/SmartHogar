'use client'

import { useState, useEffect } from 'react'

interface NotificationPermissionProps {
  onClose: () => void
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BDxcbJY39RE-zb720OZC4XdnUSPx0ZAd72zxqtJOwFgz2Vl9_8erqneOT3ifTw7kAK-ZfhIMzWltEYSmx0YPWig'

// Convertir base64 a Uint8Array para VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Posiciones fijas para las partículas (evitar Math.random en render)
const PARTICLE_POSITIONS = [
  { left: 10, top: 15, delay: 0.5, duration: 3 },
  { left: 25, top: 80, delay: 1.2, duration: 4 },
  { left: 40, top: 30, delay: 0.8, duration: 3.5 },
  { left: 55, top: 60, delay: 2.0, duration: 4.5 },
  { left: 70, top: 20, delay: 0.3, duration: 3 },
  { left: 85, top: 45, delay: 1.5, duration: 4 },
  { left: 15, top: 70, delay: 2.5, duration: 3.5 },
  { left: 30, top: 50, delay: 0.7, duration: 4 },
  { left: 45, top: 85, delay: 1.8, duration: 3 },
  { left: 60, top: 10, delay: 0.4, duration: 4.5 },
  { left: 75, top: 75, delay: 2.2, duration: 3.5 },
  { left: 90, top: 35, delay: 1.0, duration: 4 },
  { left: 5, top: 55, delay: 1.6, duration: 3 },
  { left: 20, top: 25, delay: 2.8, duration: 4.5 },
  { left: 35, top: 90, delay: 0.6, duration: 3.5 },
  { left: 50, top: 40, delay: 1.3, duration: 4 },
  { left: 65, top: 65, delay: 2.4, duration: 3 },
  { left: 80, top: 5, delay: 0.9, duration: 4.5 },
  { left: 95, top: 55, delay: 1.7, duration: 3.5 },
  { left: 12, top: 38, delay: 2.1, duration: 4 },
]

export default function NotificationPermission({ onClose }: NotificationPermissionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [showDeniedMessage, setShowDeniedMessage] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)

  useEffect(() => {
    // Verificar estado del permiso al cargar
    if ('Notification' in window) {
      const permission = Notification.permission

      if (permission === 'granted') {
        // Ya tiene permiso, cerrar modal inmediatamente
        localStorage.setItem('notification_modal_shown', 'true')
        localStorage.setItem('notifications_enabled', 'true')
        onClose()
        return
      }

      if (permission === 'denied') {
        // Bloqueadas, mostrar instrucciones
        setIsBlocked(true)
        setShowDeniedMessage(true)
      }
    }

    setTimeout(() => setIsVisible(true), 100)
  }, [onClose])

  const handleAccept = async () => {
    // Si ya está bloqueado, solo mostrar instrucciones
    if (isBlocked || Notification.permission === 'denied') {
      setShowDeniedMessage(true)
      setIsRequesting(false)
      return
    }

    setIsRequesting(true)
    setShowDeniedMessage(false)

    // Pedir permiso real del navegador
    let permission: NotificationPermission = 'default'

    try {
      permission = await Notification.requestPermission()
    } catch (error) {
      console.error('Error solicitando permiso:', error)
      // En algunos navegadores antiguos, requestPermission puede fallar
      // pero el permiso puede haberse otorgado
      permission = Notification.permission
    }

    console.log('Permiso obtenido:', permission)

    // Verificar el estado actual del permiso
    if (permission === 'granted' || Notification.permission === 'granted') {
      // ¡PERMISO OTORGADO! Guardar inmediatamente
      localStorage.setItem('notifications_enabled', 'true')
      localStorage.setItem('notification_modal_shown', 'true')

      // Intentar registrar Service Worker y suscribirse
      try {
        if ('serviceWorker' in navigator) {
          console.log('1. Registrando Service Worker...')
          const registration = await navigator.serviceWorker.register('/sw.js')
          console.log('2. Service Worker registrado:', registration.scope)

          console.log('3. Esperando que SW esté listo...')
          const ready = await navigator.serviceWorker.ready
          console.log('4. SW listo:', ready.active?.state)

          console.log('5. Suscribiendo a push...')
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
          })
          console.log('6. Suscripción creada:', subscription.endpoint.substring(0, 50) + '...')

          const token = document.cookie
            .split('; ')
            .find(row => row.startsWith('auth_token='))
            ?.split('=')[1]

          console.log('7. Enviando suscripción al servidor...')
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify({ subscription: subscription.toJSON() }),
          })

          const result = await response.json()
          console.log('8. Respuesta del servidor:', result)

          if (!response.ok) {
            console.error('Error guardando suscripción:', result)
          } else {
            console.log('✅ Suscripción guardada correctamente')
          }
        }
      } catch (swError) {
        console.error('❌ Error en el proceso de suscripción:', swError)
      }

      // Mostrar notificación de prueba (puede fallar, no importa)
      try {
        new Notification('¡Bienvenido a SmartHogar!', {
          body: 'Notificaciones activadas correctamente.',
        })
      } catch (e) {
        console.log('No se pudo mostrar notificación de prueba')
      }

      // CERRAR EL MODAL - Esto es lo importante
      setIsVisible(false)
      setTimeout(() => {
        onClose()
      }, 300)
      return
    }

    // Si llegamos aquí, el permiso fue denegado
    console.log('Permiso denegado o bloqueado')
    setIsBlocked(true)
    setShowDeniedMessage(true)
    setIsRequesting(false)
  }


  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Fondo con gradiente animado que llena toda la pantalla */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#021024] via-[#052659] to-[#0a3a7a]">
        {/* Efecto de partículas/estrellas */}
        <div className="absolute inset-0 overflow-hidden">
          {PARTICLE_POSITIONS.map((particle, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full animate-pulse"
              style={{
                left: `${particle.left}%`,
                top: `${particle.top}%`,
                animationDelay: `${particle.delay}s`,
                animationDuration: `${particle.duration}s`,
              }}
            />
          ))}
        </div>

        {/* Círculos decorativos con glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-azul-acero/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-azul-claro/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Contenido principal - Reducido al 50% */}
      <div
        className={`relative z-10 w-full max-w-xs px-4 transform transition-all duration-700 ${
          isVisible ? 'scale-100 translate-y-0' : 'scale-90 translate-y-12'
        }`}
      >
        {/* Icono de campana con animación */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            {/* Ondas de animación */}
            <div className="absolute inset-0 w-16 h-16 bg-azul-acero/30 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-0 w-16 h-16 bg-azul-claro/20 rounded-full animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />

            {/* Círculo principal */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-azul-acero via-azul-claro to-azul-hielo rounded-full flex items-center justify-center shadow-xl shadow-azul-acero/50">
              <svg className="w-8 h-8 text-white drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            {/* Badge de notificación */}
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 animate-bounce">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </div>
        </div>

        {/* Título principal */}
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-white mb-1 drop-shadow-lg">
            ¡Mantente Conectado!
          </h1>
          <p className="text-azul-hielo text-xs leading-relaxed">
            Activa las notificaciones para no perderte ninguna oportunidad
          </p>
        </div>

        {/* Beneficios con iconos - Compactos */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm">💰</span>
            </div>
            <div>
              <p className="text-white font-semibold text-xs">Ganancias Diarias</p>
              <p className="text-azul-hielo/80 text-[10px]">Alertas de acreditación</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🎁</span>
            </div>
            <div>
              <p className="text-white font-semibold text-xs">Bonos Especiales</p>
              <p className="text-azul-hielo/80 text-[10px]">Promociones exclusivas</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sm">📢</span>
            </div>
            <div>
              <p className="text-white font-semibold text-xs">Noticias</p>
              <p className="text-azul-hielo/80 text-[10px]">Anuncios importantes</p>
            </div>
          </div>
        </div>

        {/* Botón de activar */}
        <button
          onClick={handleAccept}
          disabled={isRequesting}
          className="w-full py-3 bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white text-sm font-bold rounded-xl shadow-xl shadow-green-500/40 hover:shadow-green-500/60 transform hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

          {isRequesting ? (
            <span className="flex items-center justify-center gap-2 relative z-10">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Activando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2 relative z-10">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Activar Notificaciones
            </span>
          )}
        </button>

        {/* Mensaje si rechazó o bloqueó */}
        {showDeniedMessage && (
          <div className="mt-3 p-3 bg-red-500/20 border border-red-500/40 rounded-lg">
            <p className="text-center text-red-300 text-sm font-bold mb-2">
              🚫 Notificaciones Bloqueadas
            </p>
            <p className="text-center text-red-200 text-xs mb-3">
              Sin notificaciones no puedes acceder a tu cuenta
            </p>
            <div className="bg-black/30 rounded-lg p-2 text-left">
              <p className="text-yellow-300 text-[10px] font-bold mb-1">📱 Para desbloquear:</p>
              <p className="text-white/80 text-[10px]">1. Toca el icono 🔒 en la barra de direcciones</p>
              <p className="text-white/80 text-[10px]">2. Busca "Notificaciones"</p>
              <p className="text-white/80 text-[10px]">3. Cambia a "Permitir"</p>
              <p className="text-white/80 text-[10px]">4. Recarga la página</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full mt-2 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold rounded-lg transition-colors"
            >
              🔄 Ya las desbloqueé, recargar
            </button>
          </div>
        )}

        {/* Nota al pie - Obligatorio */}
        <div className="mt-3 text-center">
          <p className="text-red-400 text-[11px] font-semibold">
            ⚠️ OBLIGATORIO para acceder a tu cuenta
          </p>
          <p className="text-azul-hielo/60 text-[10px] mt-1">
            Sin notificaciones no podrás usar SmartHogar
          </p>
        </div>
      </div>

      {/* Logo SmartHogar en la parte inferior */}
      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-azul-hielo/40 text-xs font-medium">SmartHogar</p>
      </div>
    </div>
  )
}
