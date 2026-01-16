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
  vip_packages: { name: string; level: number; status: string; activated_at?: string }[]
  referrals: ReferralUser[]
}

export default function NetworkPage() {
  const router = useRouter()
  const [network, setNetwork] = useState<ReferralUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zoom, setZoom] = useState(100)
  const [panX, setPanX] = useState(0)
  const [panY, setPanY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedUser, setSelectedUser] = useState<ReferralUser | null>(null)

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

  const countReferrals = (user: ReferralUser): number => {
    return user.referrals.reduce((total, ref) => {
      return total + 1 + countReferrals(ref)
    }, 0)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setPanX(e.clientX - dragStart.x)
    setPanY(e.clientY - dragStart.y)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const resetView = () => {
    setZoom(100)
    setPanX(0)
    setPanY(0)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Pendiente'
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const renderUserNode = (user: ReferralUser) => {
    const hasChildren = user.referrals && user.referrals.length > 0

    return (
      <div key={user.id} className="flex flex-col items-center relative">
        {/* Usuario - clickeable */}
        <button
          onClick={() => setSelectedUser(user)}
          className="flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform"
        >
          <div className="relative flex flex-col items-center">
            <span className="text-3xl transition-all group-hover:scale-125">
              {getStatusIcon(user.status)}
            </span>
            {user.vip_packages.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full flex items-center justify-center text-[9px] font-bold text-black">
                {user.vip_packages.length}
              </div>
            )}
          </div>
          <span className="mt-2 text-[10px] font-semibold text-text-primary text-center max-w-[70px] truncate hover:text-gold transition-colors">
            @{user.username}
          </span>
          <span className="text-[8px] text-text-secondary text-center max-w-[70px] truncate">
            {user.full_name}
          </span>
        </button>

        {/* Conexión a referidos */}
        {hasChildren && (
          <div className="flex flex-col items-center w-full">
            <div className="w-0.5 h-6 bg-gold/40"></div>

            <div className="relative flex gap-8 justify-center items-start">
              {user.referrals.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-gold/40"
                  style={{
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: `calc(100% - ${100 / user.referrals.length}%)`
                  }}
                ></div>
              )}

              {user.referrals.map((child) => (
                <div key={child.id} className="relative flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-gold/40"></div>
                  {renderUserNode(child)}
                </div>
              ))}
            </div>
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
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Mi Red</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Red de referidos
          </p>
        </div>

        {!error && (
          <div className="space-y-6">
            {/* Header con controles y leyenda */}
            <div className="text-center space-y-4">
              <p className="text-text-secondary">
                Total de referidos: <span className="text-gold font-bold">{network ? countReferrals(network) : 0}</span>
              </p>

              {/* Controles de zoom */}
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <button
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                  className="px-3 py-2 bg-dark-card border border-gold/30 text-gold rounded hover:bg-gold/10 transition-colors text-sm font-semibold"
                >
                  − Reducir
                </button>
                <span className="text-text-primary font-semibold min-w-[60px] text-center">
                  {zoom}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(200, zoom + 10))}
                  className="px-3 py-2 bg-dark-card border border-gold/30 text-gold rounded hover:bg-gold/10 transition-colors text-sm font-semibold"
                >
                  + Ampliar
                </button>
                <button
                  onClick={resetView}
                  className="px-3 py-2 bg-dark-card border border-gold/30 text-gold rounded hover:bg-gold/10 transition-colors text-xs"
                >
                  Restablecer
                </button>
              </div>

              <p className="text-xs text-text-secondary text-center">
                💡 Arrastra para desplazarte • Usa los botones para hacer zoom
              </p>

              {/* Leyenda */}
              <div className="flex gap-6 justify-center text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🟢</span>
                  <span className="text-text-secondary">Activo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🔴</span>
                  <span className="text-text-secondary">Inactivo</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🟠</span>
                  <span className="text-text-secondary">Pendiente</span>
                </div>
              </div>
            </div>

            {/* Red visual */}
            <div
              className="flex justify-center overflow-hidden px-4 py-8 bg-dark-card rounded-btn border border-gold border-opacity-10 cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ height: '500px' }}
            >
              <div
                className="inline-block transition-transform duration-200"
                style={{
                  transform: `scale(${zoom / 100}) translate(${panX}px, ${panY}px)`,
                  transformOrigin: 'center top',
                }}
              >
                {network ? (
                  renderUserNode(network)
                ) : (
                  <p className="text-text-secondary">Sin datos</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de detalles */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <Card glassEffect className="max-w-md w-full">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-4xl">{getStatusIcon(selectedUser.status)}</span>
                  <div>
                    <h2 className="text-lg font-bold text-gold">{selectedUser.full_name}</h2>
                    <p className="text-sm text-text-secondary">@{selectedUser.username}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-text-secondary hover:text-gold text-2xl font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status */}
              <div className="border-t border-gold border-opacity-20 pt-4">
                <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold mb-2">
                  Estado
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gold font-semibold">
                    {selectedUser.status === 'ACTIVO'
                      ? '✓ Activo'
                      : selectedUser.status === 'PENDIENTE'
                      ? '⏳ Pendiente'
                      : '✗ Inactivo'}
                  </p>
                  <div className="text-xs text-text-secondary space-y-1">
                    {selectedUser.vip_packages.filter(p => p.status === 'ACTIVE').length > 0 && (
                      <p>🟢 <span className="font-semibold text-green-400">{selectedUser.vip_packages.filter(p => p.status === 'ACTIVE').length}</span> VIP Activo{selectedUser.vip_packages.filter(p => p.status === 'ACTIVE').length !== 1 ? 's' : ''}</p>
                    )}
                    {selectedUser.vip_packages.filter(p => p.status === 'PENDING').length > 0 && (
                      <p>🟠 <span className="font-semibold text-orange-400">{selectedUser.vip_packages.filter(p => p.status === 'PENDING').length}</span> VIP Pendiente{selectedUser.vip_packages.filter(p => p.status === 'PENDING').length !== 1 ? 's' : ''}</p>
                    )}
                    {selectedUser.vip_packages.length === 0 && (
                      <p className="italic">Sin paquetes VIP</p>
                    )}
                  </div>
                </div>
              </div>

              {/* VIP Packages */}
              {selectedUser.vip_packages.length > 0 ? (
                <div className="border-t border-gold border-opacity-20 pt-4 space-y-3">
                  {selectedUser.vip_packages.filter(p => p.status === 'ACTIVE').length > 0 && (
                    <div>
                      <p className="text-xs text-gold uppercase tracking-wide font-semibold mb-2">
                        ✓ Paquetes Activos
                      </p>
                      <div className="space-y-2">
                        {selectedUser.vip_packages.filter(p => p.status === 'ACTIVE').map((pkg, idx) => (
                          <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-btn p-2">
                            <p className="text-sm font-semibold text-green-400">{pkg.name}</p>
                            <p className="text-xs text-green-300">Nivel {pkg.level}</p>
                            {pkg.activated_at && (
                              <p className="text-xs text-green-200/70 mt-1">Activado: {formatDate(pkg.activated_at)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.vip_packages.filter(p => p.status === 'PENDING').length > 0 && (
                    <div>
                      <p className="text-xs text-orange-400 uppercase tracking-wide font-semibold mb-2">
                        ⏳ Paquetes Pendientes
                      </p>
                      <div className="space-y-2">
                        {selectedUser.vip_packages.filter(p => p.status === 'PENDING').map((pkg, idx) => (
                          <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-btn p-2">
                            <p className="text-sm font-semibold text-orange-400">{pkg.name}</p>
                            <p className="text-xs text-orange-300">Nivel {pkg.level}</p>
                            <p className="text-xs text-orange-200/70 mt-1">Pendiente de aprobación</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-gold border-opacity-20 pt-4">
                  <p className="text-xs text-text-secondary italic">Sin paquetes VIP</p>
                </div>
              )}

              {/* Referidos */}
              {selectedUser.referrals && selectedUser.referrals.length > 0 && (
                <div className="border-t border-gold border-opacity-20 pt-4">
                  <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">
                    Referidos directos: {selectedUser.referrals.length}
                  </p>
                </div>
              )}

              {/* Close button */}
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full mt-4 px-4 py-2 bg-gold text-dark-bg rounded-btn font-semibold hover:bg-gold-bright transition-colors"
              >
                Cerrar
              </button>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
