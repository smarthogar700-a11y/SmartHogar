'use client'

import { useEffect, useState, useRef } from 'react'
import Card from '@/components/ui/Card'

interface ChatMessage {
  id: string
  user_id: string
  sender_role: 'USER' | 'ADMIN'
  message: string
  is_read: boolean
  created_at: string
}

interface Conversation {
  user_id: string
  user: {
    id: string
    username: string
    full_name: string
  } | null
  last_message: ChatMessage | null
  unread_count: number
}

interface ChatTabProps {
  token: string
}

export default function ChatTab({ token }: ChatTabProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<{ username: string; full_name: string } | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 30000) // 30 segundos - mas eficiente
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedUserId) {
      fetchMessages(selectedUserId)
      const interval = setInterval(() => fetchMessages(selectedUserId), 15000) // 15 segundos
      return () => clearInterval(interval)
    }
  }, [selectedUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/admin/chat', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setConversations(data.conversations)
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(data.messages)
        setSelectedUser(data.user)
        // Actualizar conversaciones para reflejar mensajes leidos
        fetchConversations()
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || sending || !selectedUserId) return

    setSending(true)
    try {
      const res = await fetch(`/api/admin/chat/${selectedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      })

      if (res.ok) {
        setNewMessage('')
        fetchMessages(selectedUserId)
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const deleteHistory = async () => {
    if (!selectedUserId) return

    const confirmed = confirm('¿Estás seguro de eliminar todo el historial de chat con este usuario? Esta acción no se puede deshacer.')
    if (!confirmed) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/chat/${selectedUserId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (res.ok) {
        setMessages([])
        fetchConversations()
        alert('Historial eliminado exitosamente')
      } else {
        alert('Error al eliminar el historial')
      }
    } catch (error) {
      console.error('Error deleting history:', error)
      alert('Error al eliminar el historial')
    } finally {
      setDeleting(false)
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

  if (loading) {
    return (
      <Card>
        <p className="text-center text-text-secondary py-8">Cargando chats...</p>
      </Card>
    )
  }

  return (
    <div className="flex gap-1 h-[calc(100vh-200px)]">
      {/* Lista de conversaciones - muy delgada */}
      <div className="w-28 flex-shrink-0 bg-dark-card rounded-lg overflow-hidden flex flex-col">
        <div className="px-2 py-1.5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-gold font-bold text-xs">Chats</h3>
          {conversations.filter(c => c.unread_count > 0).length > 0 && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-center text-text-secondary py-3 text-[10px]">
              Sin chats
            </p>
          ) : (
            [...conversations]
              .sort((a, b) => b.unread_count - a.unread_count)
              .map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setSelectedUserId(conv.user_id)}
                className={`w-full px-1.5 py-1.5 text-left border-b border-white/5 hover:bg-white/5 transition-colors relative ${selectedUserId === conv.user_id ? 'bg-gold/10 border-l-2 border-l-gold' : ''
                  } ${conv.unread_count > 0 ? 'bg-red-500/10' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0 flex items-center gap-1">
                    {/* Punto rojo pulsante si hay mensajes no leídos */}
                    {conv.unread_count > 0 && (
                      <span className="relative flex h-2 w-2 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                    )}
                    <p className={`font-medium truncate text-[11px] ${conv.unread_count > 0 ? 'text-white font-bold' : 'text-text-primary'}`}>
                      {conv.user?.full_name?.split(' ')[0] || 'Usuario'}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <span className="bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center ml-0.5 px-1">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                {/* Preview del último mensaje */}
                {conv.last_message && (
                  <p className={`text-[9px] truncate mt-0.5 ${conv.unread_count > 0 ? 'text-red-300' : 'text-text-secondary'}`}>
                    {conv.last_message.sender_role === 'ADMIN' ? 'Tú: ' : ''}{conv.last_message.message.substring(0, 20)}...
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Area de chat */}
      <div className="flex-1 bg-dark-card rounded-xl overflow-hidden flex flex-col">
        {!selectedUserId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-text-secondary">
              <p className="text-4xl mb-4">💬</p>
              <p>Selecciona una conversacion</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header del chat */}
            <div className="p-3 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedUserId(null)}
                  className="text-text-secondary hover:text-gold md:hidden"
                >
                  ←
                </button>
                <div>
                  <p className="font-medium text-text-primary">
                    {selectedUser?.full_name || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-secondary">
                    @{selectedUser?.username || 'desconocido'}
                  </p>
                </div>
              </div>
              <button
                onClick={deleteHistory}
                disabled={deleting}
                className="text-xs px-3 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/30 transition-colors disabled:opacity-50"
              >
                {deleting ? '...' : '🗑️ Eliminar Historial'}
              </button>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.length === 0 ? (
                <p className="text-center text-text-secondary py-8 text-sm">
                  No hay mensajes
                </p>
              ) : (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex items-center justify-center my-3">
                      <span className="bg-dark-bg px-3 py-1 rounded-full text-[10px] text-text-secondary">
                        {date}
                      </span>
                    </div>
                    {msgs.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex mb-2 ${msg.sender_role === 'ADMIN' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-3 py-2 ${msg.sender_role === 'ADMIN'
                            ? 'bg-gold text-dark-bg rounded-br-sm'
                            : 'bg-dark-bg text-text-primary rounded-bl-sm'
                            }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                          <p className={`text-[9px] mt-1 ${msg.sender_role === 'ADMIN' ? 'text-dark-bg/70' : 'text-text-secondary'}`}>
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

            {/* Input - compacto */}
            <div className="p-2 border-t border-white/10">
              <form onSubmit={sendMessage} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe..."
                  className="flex-1 min-w-0 bg-dark-bg border border-white/20 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold/50"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="flex-shrink-0 bg-gold text-dark-bg font-semibold rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold/90 transition-colors"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
