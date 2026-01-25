'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import BottomNav from '@/components/ui/BottomNav'
import ScreenshotProtection from '@/components/ui/ScreenshotProtection'

interface ChatMessage {
  id: string
  sender_role: 'USER' | 'ADMIN'
  message: string
  is_read: boolean
  created_at: string
}

export default function ChatPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [hasActiveVip, setHasActiveVip] = useState<boolean | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkVipAndFetchMessages()
    // Auto-refresh cada 15 segundos
    const interval = setInterval(fetchMessages, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const checkVipAndFetchMessages = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      // Verificar si tiene VIP activo
      const dashRes = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      if (dashRes.ok) {
        const dashData = await dashRes.json()
        const hasVip = dashData.active_packages && dashData.active_packages.length > 0
        setHasActiveVip(hasVip)

        if (hasVip) {
          fetchMessages()
        }
      }
    } catch (error) {
      console.error('Error checking VIP:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })

      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  // Agrupar mensajes por fecha
  const groupedMessages: { [key: string]: ChatMessage[] } = {}
  messages.forEach(msg => {
    const dateKey = formatDate(msg.created_at)
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = []
    }
    groupedMessages[dateKey].push(msg)
  })

  // Mostrar mensaje si no tiene VIP
  if (!loading && hasActiveVip === false) {
    return (
      <div className="min-h-screen pb-20 flex flex-col">
        <ScreenshotProtection />

        {/* Header */}
        <div className="bg-dark-card border-b border-white/10 p-4 sticky top-0 z-10">
          <div className="max-w-screen-xl mx-auto">
            <h1 className="text-base font-bold text-gold">Soporte</h1>
            <p className="text-xs text-text-secondary">Chat con el administrador</p>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6">
          <Card glassEffect className="text-center max-w-md">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-base font-bold text-gold mb-2">Chat no disponible</h2>
            <p className="text-text-secondary mb-4">
              Para acceder al chat de soporte, necesitas tener al menos un paquete VIP activo.
            </p>
            <Button
              variant="primary"
              onClick={() => router.push('/paks')}
            >
              Ver Paquetes VIP
            </Button>
          </Card>
        </div>

        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 flex flex-col">
      <ScreenshotProtection />

      {/* Header */}
      <div className="bg-dark-card border-b border-white/10 p-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-base font-bold text-gold">Soporte</h1>
          <p className="text-xs text-text-secondary">Chat con el administrador</p>
        </div>
      </div>

      {/* Messages Area - with padding for fixed input */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4 max-w-screen-xl mx-auto w-full">
        {loading ? (
          <div className="text-center text-text-secondary py-8">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-text-secondary py-8">
            <p className="text-sm mb-4">💬</p>
            <p>No hay mensajes aun</p>
            <p className="text-xs mt-2">Escribe tu primer mensaje para iniciar la conversacion</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-dark-card px-3 py-1 rounded-full text-xs text-text-secondary">
                  {date}
                </span>
              </div>

              {/* Messages */}
              {msgs.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex mb-3 ${msg.sender_role === 'USER' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.sender_role === 'USER'
                        ? 'bg-gold text-dark-bg rounded-br-sm'
                        : 'bg-dark-card text-text-primary rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                    <p className={`text-[10px] mt-1 ${msg.sender_role === 'USER' ? 'text-dark-bg/70' : 'text-text-secondary'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Fixed at bottom above nav */}
      <div className="bg-dark-card border-t border-white/10 p-3 fixed bottom-16 left-0 right-0 z-10">
        <form onSubmit={sendMessage} className="max-w-screen-xl mx-auto flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 min-w-0 bg-dark-bg border border-white/10 rounded-full px-4 py-2.5 text-white text-sm focus:outline-none focus:border-gold/50"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="flex-shrink-0 bg-gold text-dark-bg font-semibold rounded-full px-4 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold/90 transition-colors"
          >
            {sending ? '...' : 'Enviar'}
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
