'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import { useToast } from '@/components/ui/Toast'

interface VipPackage {
  id: number
  level: number
  name: string
  investment_bs: number
  daily_profit_bs: number
  qr_image_url?: string
}

export default function BuyPackagePage() {
  const router = useRouter()
  const params = useParams()
  const packageId = params.id as string

  const [pkg, setPkg] = useState<VipPackage | null>(null)
  const [receipt, setReceipt] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    fetchPackage()
  }, [])

  const fetchPackage = async () => {
    try {
      const res = await fetch(`/api/packages/${packageId}`)
      if (res.ok) {
        const data = await res.json()
        setPkg(data)
      } else {
        setError('Paquete no encontrado')
      }
    } catch (error) {
      setError('Error al cargar el paquete')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceipt(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (!receipt) {
      showToast('Por favor sube el comprobante de pago', 'error')
      return
    }

    setUploading(true)
    setError('')

    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        router.push('/login')
        return
      }

      // Upload receipt to Supabase
      const formData = new FormData()
      formData.append('file', receipt)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadRes.ok) {
        const uploadError = await uploadRes.json().catch(() => null)
        throw new Error(uploadError?.error || 'Error al subir comprobante')
      }

      const uploadPayload = await uploadRes.json()
      const url = uploadPayload.url
      if (uploadPayload.warning) {
        showToast(uploadPayload.warning, 'info')
      }

      // Create purchase
      const purchaseRes = await fetch('/api/purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          vip_package_id: parseInt(packageId),
          receipt_url: url,
        }),
      })

      if (!purchaseRes.ok) {
        const data = await purchaseRes.json()
        throw new Error(data.error || 'Error al crear compra')
      }

      showToast('Compra registrada exitosamente. Pendiente de aprobación por el administrador.', 'success')
      router.push('/my-purchases')
    } catch (err: any) {
      setError(err.message || 'Error al procesar la compra')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gold text-xl">Cargando...</p>
      </div>
    )
  }

  if (error && !pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 text-xl">{error}</p>
      </div>
    )
  }

  if (!pkg) return null

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">{pkg.name}</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Completa tu compra
          </p>
        </div>

        <Card glassEffect>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-text-secondary">Inversión:</span>
                <span className="font-bold text-gold text-xl">
                  Bs {pkg.investment_bs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Ganancia diaria:</span>
                <span className="font-bold text-gold-bright text-xl">
                  Bs {pkg.daily_profit_bs}
                </span>
              </div>
            </div>

            <div className="border-t border-gold border-opacity-20 pt-6">
              <p className="text-text-secondary text-sm mb-4 text-center uppercase tracking-wider font-light">
                Escanea el QR para pagar
              </p>
              {pkg.qr_image_url ? (
                <div className="relative w-64 h-64 mx-auto bg-white rounded-card p-4">
                  <Image
                    src={pkg.qr_image_url}
                    alt="QR de pago"
                    fill
                    sizes="256px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 mx-auto bg-dark-card rounded-card flex items-center justify-center">
                  <p className="text-text-secondary text-center px-4">
                    QR no disponible. Contacta al administrador.
                  </p>
                </div>
              )}
            </div>

            <div className="border-t border-gold border-opacity-20 pt-6">
              <label className="block text-sm text-text-secondary uppercase tracking-wider font-light mb-3">
                Subir comprobante de pago
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-btn file:border-0 file:text-sm file:font-medium file:bg-gold file:text-dark-bg hover:file:bg-gold-bright cursor-pointer"
              />
              {receipt && (
                <p className="mt-2 text-sm text-green-500">
                  Archivo seleccionado: {receipt.name}
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-btn">
                {error}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              onClick={handleSubmit}
              disabled={uploading || !receipt}
            >
              {uploading ? 'Procesando...' : 'Confirmar Compra'}
            </Button>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 SmartHogar. Todos los derechos reservados por SmartHogar.
      </p>

      <BottomNav />
    </div>
  )
}
