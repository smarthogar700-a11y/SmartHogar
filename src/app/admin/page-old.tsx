'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Image from 'next/image'

interface Purchase {
  id: string
  user: {
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
}

interface Withdrawal {
  id: string
  user: {
    username: string
    full_name: string
    email: string
  }
  amount_bs: number
  qr_image_url: string
  created_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'purchases' | 'withdrawals' | 'daily'>('purchases')
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [tab])

  const getToken = () => {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1]
  }

  const fetchData = async () => {
    setLoading(true)
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
        if (res.ok) {
          const data = await res.json()
          setPurchases(data)
        }
      } else if (tab === 'withdrawals') {
        const res = await fetch('/api/admin/withdrawals', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setWithdrawals(data)
        }
      }
    } catch (error) {
      console.error('Fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprovePurchase = async (id: string) => {
    if (!confirm('¿Aprobar esta compra?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/purchases/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        alert('Compra aprobada exitosamente')
        fetchData()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al aprobar')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectPurchase = async (id: string) => {
    if (!confirm('¿Rechazar esta compra?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/purchases/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        alert('Compra rechazada')
        fetchData()
      } else {
        alert('Error al rechazar')
      }
    } catch (error) {
      alert('Error de conexión')
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
        alert('Retiro marcado como pagado')
        fetchData()
      } else {
        alert('Error al procesar')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm('¿Rechazar este retiro?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        alert('Retiro rechazado y fondos devueltos')
        fetchData()
      } else {
        alert('Error al rechazar')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  const handleRunDailyProfit = async () => {
    if (!confirm('¿Ejecutar proceso de ganancias diarias?')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/run-daily-profit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        alert(`${data.message}\nProcesados: ${data.processed}`)
      } else {
        alert('Error al procesar')
      }
    } catch (error) {
      alert('Error de conexión')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Panel Admin</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Gestión del sistema
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            variant={tab === 'purchases' ? 'primary' : 'outline'}
            onClick={() => setTab('purchases')}
          >
            Compras Pendientes
          </Button>
          <Button
            variant={tab === 'withdrawals' ? 'primary' : 'outline'}
            onClick={() => setTab('withdrawals')}
          >
            Retiros Pendientes
          </Button>
          <Button
            variant={tab === 'daily' ? 'primary' : 'outline'}
            onClick={() => setTab('daily')}
          >
            Ganancias Diarias
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-gold">Cargando...</p>
        ) : (
          <>
            {tab === 'purchases' && (
              <div className="space-y-4">
                {purchases.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay compras pendientes
                    </p>
                  </Card>
                ) : (
                  purchases.map((p) => (
                    <Card key={p.id} glassEffect>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-gold">
                              {p.vip_package.name}
                            </h3>
                            <p className="text-text-secondary">{p.user.full_name}</p>
                            <p className="text-sm text-text-secondary">@{p.user.username}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gold">
                              Bs {p.investment_bs}
                            </p>
                          </div>
                        </div>

                        <div className="relative w-full h-64">
                          <Image
                            src={p.receipt_url}
                            alt="Comprobante"
                            fill
                            className="object-contain rounded-card"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => handleApprovePurchase(p.id)}
                            disabled={processing}
                          >
                            Aprobar
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRejectPurchase(p.id)}
                            disabled={processing}
                          >
                            Rechazar
                          </Button>
                        </div>
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
                      No hay retiros pendientes
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
                            <p className="text-sm text-text-secondary">{w.user.email}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-gold">
                              Bs {w.amount_bs.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="relative w-full h-64">
                          <Image
                            src={w.qr_image_url}
                            alt="QR destino"
                            fill
                            className="object-contain rounded-card"
                          />
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
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleRejectWithdrawal(w.id)}
                            disabled={processing}
                          >
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            )}

            {tab === 'daily' && (
              <Card glassEffect>
                <div className="space-y-4 text-center">
                  <h3 className="text-2xl font-bold text-gold">
                    Ejecutar Ganancias Diarias
                  </h3>
                  <p className="text-text-secondary">
                    Este proceso agregará ganancias a todos los usuarios con VIP activos
                    que hayan pasado 24 horas desde su última ganancia.
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleRunDailyProfit}
                    disabled={processing}
                    className="px-12"
                  >
                    {processing ? 'Procesando...' : 'Ejecutar Proceso'}
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
