'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import BottomNav from '@/components/ui/BottomNav'

interface ReferralUser {
  id: string
  username: string
  full_name: string
  status: 'ACTIVO' | 'INACTIVO' | 'PENDIENTE'
  vip_packages: { name: string; level: number }[]
  referrals: ReferralUser[]
}

export default function NetworkPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<ReferralUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNetwork()
  }, [])

  const fetchNetwork = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/user/network', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setNetwork(data)
      } else {
        setError('No se pudo cargar tu red de referidos')
      }
    } catch (error) {
      console.error('Error fetching network:', error)
      setError('Error al cargar la red')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVO':
        return 'text-green-500'
      case 'INACTIVO':
        return 'text-red-500'
      case 'PENDIENTE':
        return 'text-orange-500'
      default:
        return 'text-text-secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVO':
        return '🟢'
      case 'INACTIVO':
        return '🔴'
      case 'PENDIENTE':
        return '🟠'
      default:
        return '⚪'
    }
  }

  const NetworkNode = ({ user, depth = 0 }: { user: ReferralUser; depth?: number }) => {
    const [expanded, setExpanded] = useState(depth === 0)

    return (
      <div className={`ml-${Math.min(depth * 4, 12)}`}>
        <div className="flex items-center gap-2 py-2">
          <span className={`text-xl ${getStatusColor(user.status)}`}>
            {getStatusIcon(user.status)}
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-text-primary">
              {user.full_name}
            </p>
            <p className="text-xs text-text-secondary">
              @{user.username}
              {user.vip_packages.length > 0 && (
                <span className="ml-2 text-gold">
                  {user.vip_packages.map(pkg => pkg.name).join(', ')}
                </span>
              )}
            </p>
          </div>
          {user.referrals && user.referrals.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gold text-sm font-bold px-2"
            >
              {expanded ? '▼' : '▶'}
            </button>
          )}
        </div>

        {expanded && user.referrals && user.referrals.length > 0 && (
          <div className="border-l border-gold border-opacity-30 ml-2 pl-2">
            {user.referrals.map((referral) => (
              <NetworkNode key={referral.id} user={referral} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <Card glassEffect>
          <div className="space-y-3 text-center">
            <p className="text-gold text-lg font-semibold">Cargando tu red...</p>
            <div className="flex gap-2 justify-center">
              <div className="w-2 h-2 bg-gold rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-screen-xl mx-auto p-6">
          <Card glassEffect>
            <div className="text-center space-y-4">
              <p className="text-red-400">{error}</p>
              <button
                onClick={fetchNetwork}
                className="px-4 py-2 bg-gold text-dark-bg rounded-btn font-semibold hover:bg-gold-bright transition-colors"
              >
                Reintentar
              </button>
            </div>
          </Card>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gold mb-2">Tu Red de Referidos</h1>
          <p className="text-text-secondary text-sm">
            🟢 Activo • 🔴 Inactivo • 🟠 Pendiente
          </p>
        </div>

        {/* Network Tree */}
        <Card glassEffect>
          {network ? (
            <NetworkNode user={network} />
          ) : (
            <p className="text-text-secondary text-center">Sin datos de red</p>
          )}
        </Card>
      </div>
      <BottomNav />
    </div>
  )
}
