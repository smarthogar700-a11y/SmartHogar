'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import { useToast } from '@/components/ui/Toast'

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
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Monto inválido')
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
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Retiros</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Solicita tu retiro
          </p>
          <p className="mt-2 text-[10px] text-text-secondary">
            Retiros desde Bs 30. Pagos de lunes a viernes. Se acreditan de 24 a 72 horas
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
            {[30, 100, 200, 500, 1000, 2000, 5000].map((mont) => (
              <button
                key={mont}
                onClick={() => setAmount(mont.toString())}
                className={`px-3 py-2 text-xs font-semibold rounded border-2 transition-all ${
                  amount === mont.toString()
                    ? 'bg-gold text-black border-gold'
                    : 'bg-transparent text-gold border-gold hover:bg-gold hover:text-black'
                }`}
              >
                {mont === 1000 ? '1.000' : mont === 2000 ? '2.000' : mont === 5000 ? '5.000' : mont}
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

            <Input
              label="Modo a retirar"
              type="text"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              placeholder="Ej: Transferencia bancaria"
              required
            />

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
                <div className="flex justify-between items-center">
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
              </Card>
            ))
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 ULTRON. Todos los derechos reservados por ULTRON.
      </p>

      <BottomNav />
    </div>
  )
}
