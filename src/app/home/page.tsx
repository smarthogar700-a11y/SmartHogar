'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Carousel from '@/components/ui/Carousel'
import BottomNav from '@/components/ui/BottomNav'
import { useToast } from '@/components/ui/Toast'

interface DashboardData {
  user: {
    username: string
    full_name: string
    user_code: string
  }
  daily_profit: number
  daily_profit_total: number
  active_vip_daily: number
  active_vip_name: string | null
  active_vip_status: string | null
  has_active_vip: boolean
  active_purchases: {
    daily_profit_bs: number
    vip_package: {
      name: string
      level: number
    }
  }[]
  referral_bonus: number
  referral_bonus_total: number
  referral_bonus_levels: {
    level: number
    amount_bs: number
  }[]
  total_earnings: number
  network_count: number
  direct_referrals: number
  banners_top: any[]
  banners_bottom: any[]
  announcements: {
    id: number
    title: string
    body: string
    created_at: string
  }[]
}

export default function HomePage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingToken, setMissingToken] = useState(false)
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setError(null)
    setMissingToken(false)
    setLoading(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        setMissingToken(true)
        setError('Tu sesión expiró. Inicia sesión nuevamente.')
        return
      }

      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.status === 401 || res.status === 403) {
        document.cookie = 'auth_token=; path=/; max-age=0'
        router.push('/login')
        return
      }

      if (!res.ok) {
        const errorPayload = await res.json().catch(() => null)
        const message = errorPayload?.error || 'No se pudo cargar el dashboard. Intenta nuevamente.'
        setError(message)
        return
      }

      const result = await res.json()
      setData(result)
      setShowAnnouncements(!!result?.announcements?.length)
    } catch (error) {
      console.error('Error fetching dashboard:', error)
      setError('Ocurrió un error al cargar los datos.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    document.cookie = 'auth_token=; path=/; max-age=0'
    router.push('/login')
  }

  const topCarouselImages = [
    { id: 1, image_url: 'https://i.ibb.co/HL53VtPR/Chat-GPT-Image-11-ene-2026-16-15-56.png' },
    { id: 2, image_url: 'https://i.ibb.co/YBCMSfKN/Chat-GPT-Image-11-ene-2026-16-20-32.png' },
    { id: 3, image_url: 'https://i.ibb.co/MxkpXMQx/Chat-GPT-Image-11-ene-2026-16-41-30.png' },
    { id: 4, image_url: 'https://i.ibb.co/s9DLWBhL/Chat-GPT-Image-11-ene-2026-16-49-11.png' },
  ]

  const referralLink = data
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${data.user.user_code}`
    : ''

  const copyReferralLink = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(referralLink)
        showToast('Link copiado', 'success')
        return
      }
    } catch (err) {
      // Fallback below
    }

    const textarea = document.createElement('textarea')
    textarea.value = referralLink
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'absolute'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    showToast(ok ? 'Link copiado' : 'No se pudo copiar el link', ok ? 'success' : 'error')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gold text-xl">Cargando...</p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen pb-20">
        <div className="max-w-screen-xl mx-auto p-6 space-y-6">
          <Card glassEffect>
            <div className="space-y-4 text-center">
              <p className="text-text-secondary">
                {error || 'Cargando información del dashboard...'}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="primary" onClick={fetchDashboard}>
                  Reintentar
                </Button>
                {missingToken && (
                  <Button variant="outline" onClick={() => router.push('/login')}>
                    Ir a Login
                  </Button>
                )}
              </div>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold flex items-center justify-center text-dark-bg font-bold text-xl">
              {data.user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-text-primary">{data.user.full_name}</p>
              <p className="text-sm text-text-secondary">@{data.user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-gold hover:text-gold-bright transition-colors"
          >
            Salir
          </button>
        </div>

        {/* Top Carousel */}
        <div className="reveal-float">
          <Carousel images={topCarouselImages} />
        </div>

        {data.announcements.length > 0 && showAnnouncements && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60">
            <div className="max-w-xl w-full">
              <Card glassEffect>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gold text-center w-full">
                    {data.announcements[0]?.title || 'Noticia'}
                  </h2>
                  <button
                    onClick={() => setShowAnnouncements(false)}
                    className="text-text-secondary hover:text-gold transition-colors text-sm"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="space-y-3">
                  {data.announcements.map((item) => (
                    <div key={item.id} className="border-b border-gold border-opacity-20 pb-3 last:border-b-0 last:pb-0 text-center">
                      <p className="text-sm text-text-secondary">{item.body}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
        </div>
      )}

        {/* User Code */}
        <Card glassEffect>
          <div className="text-center space-y-3">
            <p className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Tu código de referido
            </p>
            <p className="text-2xl font-bold text-gold gold-glow">{data.user.user_code}</p>
            <div className="space-y-2">
              <p className="text-xs text-text-secondary uppercase tracking-wider font-light mb-2">
                Link de referido
              </p>
              <div className="bg-dark-card border border-gold border-opacity-20 rounded-btn px-3 py-2 text-xs text-text-secondary break-all">
                {referralLink}
              </div>
              <Button variant="outline" className="w-full" onClick={copyReferralLink}>
                Copiar link de referido
              </Button>
            </div>
          </div>
        </Card>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <h3 className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Ganancia Diaria
            </h3>
            <p className="text-3xl font-bold text-gold gold-glow">
              Bs {data.daily_profit.toFixed(2)}
            </p>
            {data.has_active_vip ? (
              <div className="mt-2">
                {data.active_purchases.map((purchase) => (
                  <div
                    key={`${purchase.vip_package.level}-${purchase.vip_package.name}`}
                    className="text-xs text-text-secondary flex justify-between gap-2"
                  >
                    <span>
                      ✓ {purchase.vip_package.name} ACTIVO
                    </span>
                    <span>
                      Bs {purchase.daily_profit_bs.toFixed(2)}/día
                    </span>
                  </div>
                ))}
                <p className="text-xs text-text-secondary">
                  Acumulado: Bs {data.daily_profit_total.toFixed(2)}
                </p>
              </div>
            ) : (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-text-secondary">
                  {data.active_vip_name
                    ? `${data.active_vip_name} ${data.active_vip_status === 'PENDING' ? 'PENDIENTE' : 'INACTIVO'}`
                    : 'Sin VIP activo'}
                </p>
                <p className="text-xs text-text-secondary">
                  Acumulado: Bs {data.daily_profit_total.toFixed(2)}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Bonos Patrocinio
            </h3>
            <p className="text-3xl font-bold text-gold gold-glow">
              Bs {data.referral_bonus_total.toFixed(2)}
            </p>
            {data.referral_bonus_levels.length > 0 && (
              <div className="mt-2 space-y-1 text-xs text-text-secondary">
                {data.referral_bonus_levels.map((item) => (
                  <div key={item.level} className="flex justify-between">
                    <span>Nivel {item.level}</span>
                    <span>Bs {item.amount_bs.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h3 className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Ganancias Totales
            </h3>
            <p className="text-3xl font-bold text-gold gold-glow">
              Bs {data.total_earnings.toFixed(2)}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Personas en Red
            </h3>
            <p className="text-3xl font-bold text-gold gold-glow">
              {data.network_count}
            </p>
          </Card>

          <Card>
            <h3 className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Registros Directos
            </h3>
            <p className="text-3xl font-bold text-gold gold-glow">
              {data.direct_referrals}
            </p>
          </Card>
        </div>

        <div className="profile-stage reveal-stagger">
          <div className="profile-header">
            <h2 className="profile-title">Comunidad en movimiento</h2>
            <p className="profile-subtitle">
              Nunca dejes para mañana lo que hoy puedes hacer
            </p>
          </div>
          <div className="profile-column">
            {Array.from({ length: 1000 }, (_, index) => {
              const names = [
                'Luna Vega',
                'Mateo Ruiz',
                'Sofia Rojas',
                'Diego Cruz',
                'Valeria Soto',
                'Andre Rivas',
                'Camila Paz',
                'Leo Vargas',
                'Nina Castillo',
                'Ruben Silva',
                'Adriana Flores',
                'Kevin Paredes',
              ]
              const name = names[index % names.length]
              const username = `${name.split(' ')[0].toLowerCase()}_${index + 1}`
              const email = `${username}@vip.com`
              const country = ['Bolivia', 'Peru', 'Chile', 'Colombia', 'Mexico'][index % 5]
              const vipLevel = (index % 7) + 1
              const avatarId = (index % 70) + 1
              return (
                <div key={`${name}-${index}`} className="profile-card">
                  <div className="profile-avatar">
                    <img
                      src={`https://i.pravatar.cc/80?img=${avatarId}`}
                      alt={name}
                      className="profile-avatar-img"
                      loading="lazy"
                    />
                  </div>
                  <div className="profile-info">
                    <p className="profile-name">{name}</p>
                    <p className="profile-meta">@{username} · {country}</p>
                    <p className="profile-meta">{email}</p>
                    <p className="profile-rank">Activo - VIP {vipLevel}</p>
                  </div>
                  <div className="profile-glow" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Bottom Carousel removed */}
      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 ULTRON. Todos los derechos reservados por ULTRON.
      </p>

      <BottomNav />
    </div>
  )
}
