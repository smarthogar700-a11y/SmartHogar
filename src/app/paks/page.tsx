'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import Carousel from '@/components/ui/Carousel'

interface VipPackage {
  id: number
  level: number
  name: string
  investment_bs: number
  daily_profit_bs: number
  is_enabled: boolean
}

export default function PaksPage() {
  const router = useRouter()
  const [packages, setPackages] = useState<VipPackage[]>([])
  const [purchasedPackageIds, setPurchasedPackageIds] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (token) {
        const purchasesRes = await fetch('/api/purchases/my', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (purchasesRes.ok) {
          const purchases = await purchasesRes.json()
          const ids = purchases
            .map((purchase: { vip_package_id: number }) => purchase.vip_package_id)
            .filter((id: number) => typeof id === 'number')
          setPurchasedPackageIds(ids)
        }
      }

      const res = await fetch('/api/packages', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (res.ok) {
        const data = await res.json()
        setPackages(data)
      }

    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePercentage = (profit: number, investment: number) => {
    if (!investment || investment <= 0) return '0.00'
    return ((profit / investment) * 100).toFixed(2)
  }

  const calculateMonthly = (profit: number) => {
    return (profit * 30).toFixed(2)
  }

  const getPackageHook = (level: number) => {
    switch (level) {
      case 1:
        return 'Empieza hoy: cupos limitados en este nivel.'
      case 2:
        return 'Sube de nivel y acelera tu crecimiento.'
      case 3:
        return 'El mas elegido: equilibrio entre costo y retorno.'
      case 4:
        return 'Mas retorno diario para quienes van en serio.'
      case 5:
        return 'Nivel premium: resultados mas rapidos.'
      case 6:
        return 'Maxima proyeccion, para lideres.'
      case 7:
        return 'Exclusivo: el nivel mas alto del programa.'
      default:
        return 'Aprovecha esta oportunidad hoy.'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-gold text-xl">Cargando paquetes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">

        <div className="reveal-float">
          <Carousel
            images={[
              { id: 1, image_url: 'https://i.ibb.co/HL53VtPR/Chat-GPT-Image-11-ene-2026-16-15-56.png' },
              { id: 2, image_url: 'https://i.ibb.co/YBCMSfKN/Chat-GPT-Image-11-ene-2026-16-20-32.png' },
              { id: 3, image_url: 'https://i.ibb.co/MxkpXMQx/Chat-GPT-Image-11-ene-2026-16-41-30.png' },
              { id: 4, image_url: 'https://i.ibb.co/s9DLWBhL/Chat-GPT-Image-11-ene-2026-16-49-11.png' },
            ]}
          />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Paquetes VIP</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Elige tu inversión
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isPurchased = purchasedPackageIds.includes(pkg.id)
            const isDisabled = !pkg.is_enabled || isPurchased
            return (
            <Card key={pkg.id} glassEffect>
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gold">{pkg.name}</h2>
                  <p className="text-sm text-text-secondary uppercase tracking-wider font-light mt-1">
                    Nivel {pkg.level}
                  </p>
                  <p className="text-xs text-text-secondary mt-2">
                    Por la compra de este pak participas sorteo de una moto
                  </p>
                  <p className="text-xs text-gold mt-1">
                    {getPackageHook(pkg.level)}
                  </p>
                </div>

                <div className="border-t border-b border-gold border-opacity-20 py-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Inversión:</span>
                    <span className="font-bold text-text-primary">
                      Bs {pkg.investment_bs}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ganancia diaria:</span>
                    <span className="font-bold text-gold">
                      Bs {pkg.daily_profit_bs}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Porcentaje:</span>
                    <span className="font-bold text-gold-bright">
                      {calculatePercentage(pkg.daily_profit_bs, pkg.investment_bs)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Ganancia mensual:</span>
                    <span className="font-bold text-gold-bright">
                      Bs {calculateMonthly(pkg.daily_profit_bs)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  disabled={isDisabled}
                  onClick={() => router.push(`/paks/${pkg.id}/buy`)}
                >
                  {isPurchased ? 'Comprado' : pkg.is_enabled ? 'Comprar' : 'No disponible'}
                </Button>
              </div>
            </Card>
          )})}
        </div>

      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 ULTRON. Todos los derechos reservados por ULTRON.
      </p>

      <BottomNav />
    </div>
  )
}
