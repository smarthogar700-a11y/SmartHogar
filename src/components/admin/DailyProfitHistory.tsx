'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'

interface VIPPackage {
  package_name: string
  daily_profit: number
}

interface ActivationDetail {
  package_name: string
  amount: number
  activated_at: string
}

interface UserData {
  user_id: string
  username: string
  full_name: string
  activated_today: boolean
  activation_time: string | null
  balance_before: number
  balance_after: number
  profit_today: number
  activations_detail: ActivationDetail[]
  total_accumulated: number
  active_vips: VIPPackage[]
}

interface HistoryData {
  day_start: string
  next_reset: string
  users: UserData[]
  summary: {
    total_users_with_vip: number
    activated_today: number
    not_activated_today: number
    total_profit_today: number
  }
}

type FilterType = 'all' | 'activated' | 'not_activated'

export default function DailyProfitHistory() {
  const [data, setData] = useState<HistoryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [searchTerm, setSearchTerm] = useState('')
  useEffect(() => {
    fetchHistory()
    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchHistory, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchHistory = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find((row) => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        setError('Sesión expirada')
        return
      }

      const res = await fetch('/api/admin/daily-profit-history', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        throw new Error('Error al cargar historial')
      }

      const result = await res.json()
      setData(result)
      setError(null)
    } catch (err) {
      console.error('Error fetching history:', err)
      setError('Error al cargar historial')
    } finally {
      setLoading(false)
    }
  }


  const filteredUsers = data?.users.filter((user) => {
    // Filtro por estado
    if (filter === 'activated' && !user.activated_today) return false
    if (filter === 'not_activated' && user.activated_today) return false

    // Filtro por búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        user.full_name.toLowerCase().includes(term) ||
        user.username.toLowerCase().includes(term)
      )
    }

    return true
  })

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-text-secondary">Cargando historial...</p>
        </div>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <div className="text-center py-8">
          <p className="text-red-400 mb-4">{error || 'Error al cargar datos'}</p>
          <Button variant="primary" onClick={fetchHistory}>
            Reintentar
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header y Resumen */}
      <Card glassEffect>
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gold mb-2">
              📊 Historial de Activaciones Diarias
            </h2>
            <p className="text-sm text-text-secondary">
              🕐 Día actual desde:{' '}
              {new Date(data.day_start).toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Resumen */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            <div className="bg-dark-card rounded-lg p-3 text-center border border-gold/20">
              <p className="text-xs text-text-secondary uppercase">Total Usuarios</p>
              <p className="text-2xl font-bold text-gold">
                {data.summary.total_users_with_vip}
              </p>
            </div>
            <div className="bg-green-500/10 rounded-lg p-3 text-center border border-green-500/30">
              <p className="text-xs text-text-secondary uppercase">✅ Activados</p>
              <p className="text-2xl font-bold text-green-400">
                {data.summary.activated_today}
              </p>
            </div>
            <div className="bg-red-500/10 rounded-lg p-3 text-center border border-red-500/30">
              <p className="text-xs text-text-secondary uppercase">❌ No Activados</p>
              <p className="text-2xl font-bold text-red-400">
                {data.summary.not_activated_today}
              </p>
            </div>
            <div className="bg-gold/10 rounded-lg p-3 text-center border border-gold/30">
              <p className="text-xs text-text-secondary uppercase">💰 Total Abonado Hoy</p>
              <p className="text-xl font-bold text-gold">
                Bs {data.summary.total_profit_today.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="text-center text-xs text-text-secondary">
            ⏰ Próximo reset:{' '}
            {new Date(data.next_reset).toLocaleString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            | 🔄 Auto-actualización: 30s
          </div>
        </div>
      </Card>

      {/* Filtros y búsqueda */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
              className="text-sm"
            >
              Todos ({data.users.length})
            </Button>
            <Button
              variant={filter === 'activated' ? 'primary' : 'outline'}
              onClick={() => setFilter('activated')}
              className="text-sm"
            >
              ✅ Activados ({data.summary.activated_today})
            </Button>
            <Button
              variant={filter === 'not_activated' ? 'primary' : 'outline'}
              onClick={() => setFilter('not_activated')}
              className="text-sm"
            >
              ❌ No Activados ({data.summary.not_activated_today})
            </Button>
          </div>

          <input
            type="text"
            placeholder="Buscar por nombre o usuario..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-dark-card border border-blue-bright/20 rounded-btn px-4 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:border-gold"
          />
        </div>
      </Card>

      {/* Lista de usuarios */}
      <div className="space-y-3">
        {filteredUsers && filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <Card
              key={user.user_id}
              className={`${
                user.activated_today
                  ? 'border-l-4 border-l-green-500 bg-green-500/10 border-t-2 border-t-green-500'
                  : 'border-l-4 border-l-red-500 bg-red-500/10 border-t-2 border-t-red-500'
              }`}
            >
              <div className="space-y-3">
                {/* Header del usuario */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {user.activated_today ? '✅' : '❌'}
                    </span>
                    <div>
                      <p className="font-bold text-text-primary">
                        {user.full_name}
                      </p>
                      <p className="text-sm text-text-secondary">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                  {user.activated_today && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        +Bs {user.profit_today.toFixed(2)}
                      </p>
                      <p className="text-xs text-text-secondary">
                        ⏰{' '}
                        {new Date(user.activation_time!).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                  {!user.activated_today && (
                    <div className="text-right">
                      <p className="text-sm text-red-400 font-semibold">
                        ⚠️ No ha activado
                      </p>
                    </div>
                  )}
                </div>

                {/* Saldo y ganancias */}
                {user.activated_today && (
                  <div className="bg-dark-card rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-text-secondary">💰 Saldo anterior:</span>
                      <span className="text-text-primary font-semibold">
                        Bs {user.balance_before.toFixed(2)}
                      </span>
                    </div>

                    <div className="border-t border-white/10 pt-2">
                      <p className="text-xs text-gold uppercase mb-2">
                        ✨ Ganancias activadas hoy:
                      </p>
                      <div className="space-y-1">
                        {user.activations_detail.map((activation, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between items-center text-sm pl-2"
                          >
                            <span className="text-blue-bright text-xs">
                              • {activation.package_name}
                            </span>
                            <span className="text-green-400 font-semibold">
                              +Bs {activation.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/10 pt-2 flex justify-between items-center text-sm">
                      <span className="text-text-secondary">💵 Saldo actual:</span>
                      <span className="text-gold font-bold text-base">
                        Bs {user.balance_after.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* VIPs activos (para los que no activaron) */}
                {!user.activated_today && (
                  <div>
                    <p className="text-xs text-text-secondary uppercase mb-2">
                      📦 VIPs Activos (sin activar):
                    </p>
                    <div className="space-y-1">
                      {user.active_vips.map((vip, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center bg-dark-card rounded px-3 py-1.5 text-sm"
                        >
                          <span className="text-blue-bright">{vip.package_name}</span>
                          <span className="text-gold font-semibold">
                            Bs {vip.daily_profit.toFixed(2)}/día
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-text-secondary mt-2">
                      💰 Saldo actual: Bs {user.balance_after.toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Acumulado total */}
                <div className="text-xs text-text-secondary text-right border-t border-white/10 pt-2">
                  📊 Acumulado histórico: Bs {user.total_accumulated.toFixed(2)}
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <p className="text-center text-text-secondary py-4">
              No se encontraron usuarios con los filtros seleccionados
            </p>
          </Card>
        )}
      </div>
    </div>
  )
}
