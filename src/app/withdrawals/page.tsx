'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import { useToast } from '@/components/ui/Toast'
import ScreenshotProtection from '@/components/ui/ScreenshotProtection'

interface Withdrawal {
  id: string
  amount_bs: number
  status: string
  created_at: string
}

export default function WithdrawalsPage() {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [bankName, setBankName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [payoutMethod, setPayoutMethod] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [balance, setBalance] = useState(0)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedReceiptImage, setSelectedReceiptImage] = useState<string | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('/api/withdrawals', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setBalance(data.balance)
        setWithdrawals(data.withdrawals)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amountNum = parseFloat(amount)
    if (isNaN(amountNum) || amountNum < 10) {
      setError('El monto mínimo de retiro es Bs 10')
      return
    }

    if (amountNum > balance) {
      setError('Saldo insuficiente')
      return
    }

    if (!bankName || !accountNumber || !payoutMethod || !phoneNumber) {
      setError('Completa los datos bancarios')
      return
    }

    // ... (rest of function)

    // And later in the JSX:
    setLoading(true)

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      // Create withdrawal
      const withdrawalRes = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount_bs: amountNum,
          bank_name: bankName,
          account_number: accountNumber,
          payout_method: payoutMethod,
          phone_number: phoneNumber,
        }),
      })

      if (!withdrawalRes.ok) {
        const data = await withdrawalRes.json()
        throw new Error(data.error || 'Error al solicitar retiro')
      }

      showToast('Solicitud exitosa. Tu pago se abonara en 24 a 72 horas.', 'success')
      setAmount('')
      setBankName('')
      setAccountNumber('')
      setPayoutMethod('')
      setPhoneNumber('')
      fetchData()
    } catch (err: any) {
      setError(err.message || 'Error al procesar retiro')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-500'
      case 'PAID':
        return 'text-green-500'
      case 'REJECTED':
        return 'text-red-500'
      default:
        return 'text-text-secondary'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente'
      case 'PAID':
        return 'Pagado'
      case 'REJECTED':
        return 'Rechazado'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen pb-20">
      <ScreenshotProtection />
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Retiros</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Solicita tu retiro
          </p>
          <p className="mt-2 text-[10px] text-text-secondary">
            Retiros desde Bs 10. Pagos de lunes a viernes. Se acreditan de 24 a 72 horas
            despues de la solicitud.
          </p>
          <p className="mt-2 text-[10px] text-text-secondary">
            ⚠️ Se aplicará un 10 % de descuento a toda la solicitud de pago. ⚠️
          </p>
        </div>

        <Card glassEffect>
          <p className="text-xs font-semibold text-red-400 text-center mb-4">
            Las solicitudes deben realizarse únicamente con montos exactos:
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {[10, 50, 100, 200, 500, 1000].map((mont) => (
              <button
                key={mont}
                onClick={() => setAmount(mont.toString())}
                className={`px-3 py-2 text-xs font-semibold rounded border-2 transition-all ${amount === mont.toString()
                  ? 'bg-gold text-black border-gold'
                  : 'bg-transparent text-gold border-gold hover:bg-gold hover:text-black'
                  }`}
              >
                {mont === 1000 ? '1.000' : mont}
              </button>
            ))}
          </div>
          <div className="text-center mb-6">
            <p className="text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
              Saldo disponible
            </p>
            <p className="text-4xl font-bold text-gold gold-glow">
              Bs {balance.toFixed(2)}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Monto a retirar"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />

            <div>
              <Input
                label="Nombre del banco"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: Banco Union"
                required
              />
            </div>

            <Input
              label="Número de cuenta"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Ej: 1234567890"
              required
            />

            <div className="space-y-1">
              <label className="text-xs text-text-secondary font-medium ml-1">Método de retiro</label>
              <select
                value={payoutMethod}
                onChange={(e) => setPayoutMethod(e.target.value)}
                className="w-full bg-dark-bg border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold/50 transition-colors appearance-none"
                required
              >
                <option value="" disabled>Selecciona un método</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="QR Simple">QR Simple</option>
                <option value="Tigo Money">Tigo Money</option>
                <option value="USDT">USDT (Cripto)</option>
              </select>
            </div>

            <Input
              label="Número de teléfono"
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Ej: 7XXXXXXX"
              required
            />

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-btn">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" className="w-full" disabled={loading}>
              {loading ? 'Procesando...' : 'Solicitar Retiro'}
            </Button>
          </form>
        </Card>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gold">Historial de Retiros</h2>
          {withdrawals.length === 0 ? (
            <Card>
              <p className="text-center text-text-secondary">
                No tienes retiros registrados
              </p>
            </Card>
          ) : (
            withdrawals.map((w) => (
              <Card key={w.id}>
                <div className="flex gap-3">
                  {/* Miniatura del comprobante */}
                  {w.status === 'PAID' && w.receipt_url && (
                    <div
                      onClick={() => setSelectedReceiptImage(w.receipt_url!)}
                      className="flex-shrink-0 cursor-pointer"
                    >
                      <img
                        src={w.receipt_url}
                        alt="Comprobante"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gold/30 hover:border-gold transition-colors select-none"
                      />
                    </div>
                  )}

                  {/* Información del retiro */}
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-text-primary">
                          Bs {w.amount_bs.toFixed(2)}
                        </p>
                        <p className="text-sm text-text-secondary">
                          {new Date(w.created_at).toLocaleDateString('es-ES')}
                        </p>
                      </div>
                      <span className={`font-medium ${getStatusColor(w.status)}`}>
                        {getStatusText(w.status)}
                      </span>
                    </div>
                    {w.status === 'PAID' && w.receipt_url && (
                      <p className="text-xs text-green-400">
                        ✓ Comprobante adjunto
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Modal de imagen en grande */}
      {selectedReceiptImage && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedReceiptImage(null)}
        >
          <div className="relative max-w-4xl w-full">
            <button
              onClick={() => setSelectedReceiptImage(null)}
              className="absolute -top-12 right-0 text-white text-4xl hover:text-gold transition-colors"
            >
              ×
            </button>
            <img
              src={selectedReceiptImage}
              alt="Comprobante de Pago"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              className="w-full h-auto rounded-lg select-none"
              onClick={(e) => e.stopPropagation()}
            />
            <p className="text-center text-sm text-text-secondary mt-4">
              Comprobante de Pago
            </p>
          </div>
        </div>
      )}

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 ULTRON. Todos los derechos reservados por ULTRON.
      </p>

      <BottomNav />
    </div>
  )
}
