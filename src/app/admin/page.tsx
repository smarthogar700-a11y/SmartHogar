'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Image from 'next/image'
import ManualAdjustTab from '@/components/admin/ManualAdjustTab'
import ConfigTab from '@/components/admin/ConfigTab'
import { useToast } from '@/components/ui/Toast'

type Tab =
  | 'purchases'
  | 'withdrawals'
  | 'adjust'
  | 'active-users'
  | 'news'
  | 'config'
  | 'daily-profit'

interface Purchase {
  id: string
  user: {
    id: string
    username: string
    full_name: string
    email: string
  }
  vip_package: {
    name: string
    level: number
  }
  investment_bs: number
  receipt_url: string
  created_at: string
  status: 'PENDING' | 'ACTIVE' | 'REJECTED'
}

interface Withdrawal {
  id: string
  user: {
    username: string
    full_name: string
    email: string
  }
  amount_bs: number
  total_earnings_bs: number
  phone_number: string
  qr_image_url: string
  created_at: string
}

interface ActiveUser {
  user: {
    username: string
    full_name: string
    email: string
  }
  active_packages: {
    name: string
    level: number
  }[]
  total_earnings_bs: number
}

interface Announcement {
  id: number
  title: string
  body: string
  is_active: boolean
  created_at: string
}

interface VipPackage {
  id: number
  level: number
  name: string
  investment_bs: number
  daily_profit_bs: number
  is_enabled: boolean
}

interface BonusRule {
  id: number
  level: number
  percentage: number
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('purchases')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [purchasesTotal, setPurchasesTotal] = useState(0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [newsTitle, setNewsTitle] = useState('')
  const [newsBody, setNewsBody] = useState('')
  const [newsActive, setNewsActive] = useState(true)
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [token, setToken] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [purchaseSearch, setPurchaseSearch] = useState('')
  const [dailyProfitStatus, setDailyProfitStatus] = useState<{
    already_run: boolean
    last_run_at: string | null
  } | null>(null)

  // Config states
  const [packages, setPackages] = useState<VipPackage[]>([])
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    // Get token only on client side
    if (typeof window !== 'undefined') {
      const cookieToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1] || ''
      setToken(cookieToken)
    }
  }, [])

  useEffect(() => {
    if (token && (tab === 'purchases' || tab === 'withdrawals' || tab === 'active-users' || tab === 'news')) {
      fetchData()
    }
  }, [tab, token])

  useEffect(() => {
    if (token && tab === 'daily-profit') {
      fetchDailyProfitStatus()
    }
  }, [tab, token])

  useEffect(() => {
    if (token) {
      fetchConfigData()
    }
  }, [token])

  const getToken = () => {
    return token
  }

  const fetchConfigData = async () => {
    setConfigLoading(true)
    try {
      const [pkgRes, bonusRes] = await Promise.all([
        fetch('/api/admin/vip-packages', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/bonus-rules', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (pkgRes.ok) {
        const pkgData = await pkgRes.json()
        setPackages(pkgData)
      }
      if (bonusRes.ok) {
        const bonusData = await bonusRes.json()
        setBonusRules(bonusData)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setConfigLoading(false)
    }
  }

  const updatePackage = async (pkg: VipPackage) => {
    setSaving(`pkg-${pkg.id}`)
    try {
      const res = await fetch('/api/admin/vip-packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(pkg),
      })

      if (res.ok) {
        showToast('Paquete actualizado correctamente', 'success')
        fetchConfigData()
      } else {
        showToast('Error al actualizar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(null)
    }
  }

  const updateBonus = async (rule: BonusRule) => {
    setSaving(`bonus-${rule.id}`)
    try {
      const res = await fetch('/api/admin/bonus-rules', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rule),
      })

      if (res.ok) {
        showToast('Bono actualizado correctamente. Aplica a todos los usuarios.', 'success')
        fetchConfigData()
      } else {
        showToast('Error al actualizar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(null)
    }
  }

  const updatePackageField = (pkgId: number, field: keyof VipPackage, value: any) => {
    setPackages(packages.map(p =>
      p.id === pkgId ? { ...p, [field]: value } : p
    ))
  }

  const updateBonusField = (ruleId: number, field: keyof BonusRule, value: any) => {
    setBonusRules(bonusRules.map(r =>
      r.id === ruleId ? { ...r, [field]: value } : r
    ))
  }

  const fetchData = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }

      if (tab === 'purchases') {
        const res = await fetch('/api/admin/purchases', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErrorMessage(data?.error || 'Error al cargar compras')
          setPurchases([])
          setPurchasesTotal(0)
        } else {
          const data = await res.json()
          if (Array.isArray(data)) {
            setPurchases(data)
            setPurchasesTotal(0)
          } else {
            setPurchases(data.purchases || [])
            setPurchasesTotal(data.total_investment_bs || 0)
          }
        }
      } else if (tab === 'withdrawals') {
        const res = await fetch('/api/admin/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErrorMessage(data?.error || 'Error al cargar retiros')
          setWithdrawals([])
        } else {
          const data = await res.json()
          setWithdrawals(data)
        }
      } else if (tab === 'active-users') {
        const res = await fetch('/api/admin/active-users', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErrorMessage(data?.error || 'Error al cargar usuarios activos')
          setActiveUsers([])
        } else {
          const data = await res.json()
          setActiveUsers(data)
        }
      } else if (tab === 'news') {
        const res = await fetch('/api/admin/news', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.status === 401 || res.status === 403) {
          router.push('/login')
          return
        }
        if (!res.ok) {
          const data = await res.json().catch(() => null)
          setErrorMessage(data?.error || 'Error al cargar noticias')
          setAnnouncements([])
        } else {
          const data = await res.json()
          setAnnouncements(data)
        }
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setErrorMessage('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const fetchDailyProfitStatus = async () => {
    try {
      const res = await fetch('/api/admin/run-daily-profit', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDailyProfitStatus({
          already_run: !!data.already_run,
          last_run_at: data.last_run_at || null,
        })
      }
    } catch (error) {
      console.error('Error fetching daily profit status:', error)
    }
  }

  const handleApprovePurchase = async (id: string) => {
    if (!confirm('¿Activar esta compra?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/purchases/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast('Compra aprobada exitosamente', 'success')
        fetchData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Error al aprobar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectPurchase = async (id: string) => {
    if (!confirm('¿Desactivar esta compra?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/purchases/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast('Compra rechazada', 'info')
        fetchData()
      } else {
        showToast('Error al rechazar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayWithdrawal = async (id: string) => {
    if (!confirm('¿Marcar como pagado?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/withdrawals/${id}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast('Retiro marcado como pagado', 'success')
        fetchData()
      } else {
        showToast('Error al procesar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const adminTabs = [
    { key: 'purchases' as const, label: 'Billetera', icon: '👛' },
    { key: 'withdrawals' as const, label: 'Retiros', icon: '💰' },
    { key: 'adjust' as const, label: 'Ajustes', icon: '🛠️' },
    { key: 'active-users' as const, label: 'Activos', icon: '✅' },
    { key: 'config' as const, label: 'Ganancias', icon: '📈' },
    { key: 'daily-profit' as const, label: 'Diarias', icon: '⏱️' },
    { key: 'news' as const, label: 'Noticias', icon: '📰' },
  ]

  const handleRunDailyProfit = async () => {
    if (!confirm('¿Actualizar ganancias diarias ahora?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/run-daily-profit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.already_run) {
          showToast('Ganancias diarias ya actualizadas', 'info')
        } else {
          showToast(`Ganancias procesadas: ${data?.processed ?? 0}`, 'success')
        }
        setDailyProfitStatus({
          already_run: !!data?.already_run,
          last_run_at: data?.last_run_at || null,
        })
      } else {
        showToast('Error al procesar ganancias', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateNews = async () => {
    if (!newsTitle || !newsBody) {
      setErrorMessage('Título y contenido son requeridos')
      return
    }

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newsTitle,
          body: newsBody,
          is_active: newsActive,
        }),
      })

      if (res.ok) {
        setNewsTitle('')
        setNewsBody('')
        setNewsActive(true)
        fetchData()
      } else {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || 'Error al crear noticia')
      }
    } catch (error) {
      setErrorMessage('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const purchasedNamesByUser = purchases.reduce((acc, purchase) => {
    const list = acc[purchase.user.id] || []
    if (!list.includes(purchase.vip_package.name)) {
      list.push(purchase.vip_package.name)
    }
    acc[purchase.user.id] = list
    return acc
  }, {} as Record<string, string[]>)

  const activeUsersList = purchases.reduce((acc, purchase) => {
    if (purchase.status !== 'ACTIVE') return acc
    if (!acc.some((item) => item.user.id === purchase.user.id)) {
      acc.push(purchase)
    }
    return acc
  }, [] as Purchase[])

  const filteredActiveUsersList = purchaseSearch.trim()
    ? activeUsersList.filter((purchase) => {
        const query = purchaseSearch.trim().toLowerCase()
        return (
          purchase.user.username.toLowerCase().includes(query) ||
          purchase.user.full_name.toLowerCase().includes(query) ||
          purchase.user.email.toLowerCase().includes(query)
        )
      })
    : activeUsersList

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Panel Admin</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            GESTIÓN DEL SISTEMA
          </p>
        </div>

        {loading ? (
          <p className="text-center text-gold">Cargando...</p>
        ) : (
          <>
            {errorMessage && (
              <Card>
                <p className="text-center text-red-500">{errorMessage}</p>
              </Card>
            )}
            {tab === 'purchases' && (
              <div className="space-y-4">
                <Card glassEffect>
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary uppercase tracking-wider text-sm">
                      Total de inversiones sumadas
                    </span>
                    <span className="text-2xl font-bold text-gold">
                      Bs {purchasesTotal.toFixed(2)}
                    </span>
                  </div>
                </Card>
                <Card glassEffect>
                  <div className="space-y-3">
                    <Input
                      label="Buscar usuario"
                      type="text"
                      value={purchaseSearch}
                      onChange={(e) => setPurchaseSearch(e.target.value)}
                      placeholder="Nombre o usuario"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setPurchaseSearch((value) => value.trim())}
                    >
                      Buscar
                    </Button>
                  </div>
                </Card>
                {filteredActiveUsersList.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay usuarios activos
                    </p>
                  </Card>
                ) : (
                  filteredActiveUsersList.map((p) => (
                    <Card key={p.id} glassEffect>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-xl font-bold text-gold">
                              {p.user.username}
                            </h3>
                            <p className="text-sm text-text-secondary">
                              {p.user.full_name}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            className="text-xs px-3 py-1"
                            onClick={() =>
                              setExpandedUserId(
                                expandedUserId === p.user.id ? null : p.user.id
                              )
                            }
                          >
                            Ver pak comprados
                          </Button>
                        </div>
                        {expandedUserId === p.user.id && (
                          <div className="border-t border-gold border-opacity-20 pt-4 space-y-4">
                            {purchases
                              .filter((item) => item.user.id === p.user.id)
                              .map((item) => (
                                <div key={item.id} className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-text-secondary">
                                      {item.vip_package.name}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        item.status === 'ACTIVE'
                                          ? 'text-green-500'
                                          : item.status === 'REJECTED'
                                            ? 'text-red-500'
                                            : 'text-yellow-500'
                                      }`}
                                    >
                                      {item.status === 'ACTIVE'
                                        ? 'ACTIVO'
                                        : item.status === 'REJECTED'
                                          ? 'RECHAZADO'
                                          : 'PENDIENTE'}
                                    </span>
                                  </div>

                                  {item.receipt_url ? (
                                    <div className="w-full h-56 bg-dark-card rounded-card overflow-hidden">
                                      <img
                                        src={item.receipt_url}
                                        alt="Comprobante"
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-full h-56 bg-dark-card rounded-card flex items-center justify-center">
                                      <p className="text-text-secondary text-sm">
                                        Comprobante no disponible
                                      </p>
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      variant="primary"
                                      className="flex-1"
                                      onClick={() => handleApprovePurchase(item.id)}
                                      disabled={processing}
                                    >
                                      Activar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="flex-1"
                                      onClick={() => handleRejectPurchase(item.id)}
                                      disabled={processing}
                                    >
                                      Desactivar
                                    </Button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === 'withdrawals' && (
              <div className="space-y-4">
                {withdrawals.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay solicitudes de retiro
                    </p>
                  </Card>
                ) : (
                  withdrawals.map((w) => (
                    <Card key={w.id} glassEffect>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-text-primary">
                              {w.user.full_name}
                            </h3>
                            <p className="text-text-secondary">@{w.user.username}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary uppercase tracking-wider">Monto solicitado</p>
                            <p className="text-2xl font-bold text-gold">
                              Bs {w.amount_bs.toFixed(2)}
                            </p>
                            <p className="text-xs text-text-secondary uppercase tracking-wider mt-2">Teléfono</p>
                            <p className="text-sm text-text-primary">{w.phone_number || 'No registrado'}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => handlePayWithdrawal(w.id)}
                            disabled={processing}
                          >
                            Marcar Pagado
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === 'adjust' && <ManualAdjustTab token={token} />}

            {tab === 'config' && <ConfigTab token={token} />}

            {tab === 'daily-profit' && (
              <div className="space-y-4">
                <Card glassEffect>
                  <div className="space-y-4 text-center">
                    <h2 className="text-2xl font-bold text-gold">Actualizar Ganancias Diarias</h2>
                    <p className="text-sm text-text-secondary">
                      Aplica las ganancias diarias a todos los usuarios con VIP activo. Usa el porcentaje actual de cada paquete.
                    </p>
                    {dailyProfitStatus?.already_run && (
                      <p className="text-sm text-green-400">
                        Ganancias diarias ya actualizadas hoy.
                      </p>
                    )}
                    {dailyProfitStatus?.last_run_at && (
                      <p className="text-xs text-text-secondary">
                        Última actualización: {new Date(dailyProfitStatus.last_run_at).toLocaleString('es-ES')}
                      </p>
                    )}
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleRunDailyProfit}
                      disabled={processing || dailyProfitStatus?.already_run}
                    >
                      {processing
                        ? 'Procesando...'
                        : dailyProfitStatus?.already_run
                          ? 'Ganancias ya actualizadas'
                          : 'Actualizar Ganancias'}
                    </Button>
                  </div>
                </Card>
              </div>
            )}

            {tab === 'active-users' && (
              <div className="space-y-4">
                {activeUsers.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay usuarios activos
                    </p>
                  </Card>
                ) : (
                  activeUsers.map((entry) => (
                    <Card key={entry.user.username} glassEffect>
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gold">
                              {entry.user.full_name}
                            </h3>
                            <p className="text-text-secondary">@{entry.user.username}</p>
                            <p className="text-sm text-text-secondary">{entry.user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-text-secondary uppercase tracking-wider">
                              Paquetes Activos
                            </p>
                            <p className="text-sm text-gold">
                              {entry.active_packages.map((pkg) => pkg.name).join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-xs text-text-secondary">
                          {entry.active_packages.map((pkg) => `Nivel ${pkg.level}`).join(' · ')}
                        </div>
                        <div className="border-t border-gold border-opacity-20 pt-3">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Ganancias totales:</span>
                            <span className="font-bold text-gold-bright">
                              Bs {entry.total_earnings_bs.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === 'news' && (
              <div className="space-y-4">
                <Card glassEffect>
                  <div className="space-y-4">
                    <Input
                      label="Título"
                      type="text"
                      value={newsTitle}
                      onChange={(e) => setNewsTitle(e.target.value)}
                      placeholder="Título de la noticia"
                      required
                    />
                    <div>
                      <label className="block text-sm text-text-secondary uppercase tracking-wider font-light mb-3">
                        Contenido
                      </label>
                      <textarea
                        value={newsBody}
                        onChange={(e) => setNewsBody(e.target.value)}
                        className="w-full min-h-[120px] px-4 py-3 bg-dark-card border border-gold border-opacity-30 rounded-btn text-text-primary focus:outline-none focus:border-gold transition-all"
                        placeholder="Escribe la noticia"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-text-secondary">
                      <input
                        type="checkbox"
                        checked={newsActive}
                        onChange={(e) => setNewsActive(e.target.checked)}
                        className="w-4 h-4 accent-gold"
                      />
                      Mostrar en Home
                    </label>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleCreateNews}
                      disabled={processing}
                    >
                      {processing ? 'Guardando...' : 'Publicar Noticia'}
                    </Button>
                  </div>
                </Card>

                {announcements.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay noticias
                    </p>
                  </Card>
                ) : (
                  announcements.map((item) => (
                    <Card key={item.id} glassEffect>
                      <div className="space-y-2">
                        <p className="text-text-primary font-medium">{item.title}</p>
                        <p className="text-sm text-text-secondary">{item.body}</p>
                        <p className="text-xs text-text-secondary">
                          {item.is_active ? 'Visible en Home' : 'Oculta'}
                        </p>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            setProcessing(true)
                            try {
                              const token = getToken()
                              const res = await fetch('/api/admin/news', {
                                method: 'DELETE',
                                headers: {
                                  'Content-Type': 'application/json',
                                  Authorization: `Bearer ${token}`,
                                },
                                body: JSON.stringify({ id: item.id }),
                              })
                              if (res.ok) {
                                showToast('Noticia eliminada', 'success')
                                fetchData()
                              } else {
                                const data = await res.json().catch(() => null)
                                showToast(data?.error || 'Error al eliminar noticia', 'error')
                              }
                            } catch (error) {
                              showToast('Error de conexión', 'error')
                            } finally {
                              setProcessing(false)
                            }
                          }}
                          disabled={processing}
                        >
                          Eliminar noticia
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Configuración del Sistema removida por solicitud */}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-gold border-opacity-20 z-50">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
          {adminTabs.map((item) => {
            const isActive = tab === item.key
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-gold'
                    : 'text-text-secondary hover:text-gold'
                }`}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
