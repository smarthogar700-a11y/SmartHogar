'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import BottomNav from '@/components/ui/BottomNav'
import Carousel from '@/components/ui/Carousel'
import ScreenshotProtection from '@/components/ui/ScreenshotProtection'

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
  const [purchasedPackages, setPurchasedPackages] = useState<{ id: number; status: string }[]>([])
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
          const paks = purchases
            .map((purchase: { vip_package_id: number; status: string }) => ({
              id: purchase.vip_package_id,
              status: purchase.status,
            }))
            .filter((p: { id: number }) => typeof p.id === 'number')
          setPurchasedPackages(paks)
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

  const getPackageMotivation = (level: number) => {
    switch (level) {
      case 1:
        return 'Empieza con fuerza y construye tu base hoy.'
      case 2:
        return 'Sigue escalando: cada paso suma a tu meta.'
      case 3:
        return 'Equilibrio ideal para crecer con disciplina.'
      case 4:
        return 'Impulsa tus resultados con decision diaria.'
      case 5:
        return 'Acelera tu camino: nivel premium de progreso.'
      case 6:
        return 'Consolida liderazgo y expande tu red.'
      case 7:
        return 'Maximo nivel: vision, enfoque y constancia.'
      default:
        return 'Aprovecha esta oportunidad hoy.'
    }
  }

  const getPackageHook = (level: number) => {
    switch (level) {
      case 1:
        return 'Empieza con el pak que se ajuste a tu necesidad.'
      case 2:
        return 'Da el siguiente paso con una meta clara.'
      case 3:
        return 'Equilibrio ideal entre inversion y resultados.'
      case 4:
        return 'Mayor impulso diario para avanzar con firmeza.'
      case 5:
        return 'Nivel premium para acelerar tu progreso.'
      case 6:
        return 'Alta proyeccion para quienes buscan expandirse.'
      case 7:
        return 'Nivel superior para metas ambiciosas.'
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
      <ScreenshotProtection />
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">

        <div className="reveal-float">
          <Carousel
            images={[
              { id: 1, image_url: 'https://i.ibb.co/vvCT1Nw8/IMG-20260125-204722-207.jpg' },
              { id: 2, image_url: 'https://i.ibb.co/6RYtnH54/IMG-20260125-204721-945.jpg' },
              { id: 3, image_url: 'https://i.ibb.co/fVzQG86z/IMG-20260125-204721-462.jpg' },
              { id: 4, image_url: 'https://i.ibb.co/tMvNghCr/IMG-20260125-204721-506.jpg' },
              { id: 5, image_url: 'https://i.ibb.co/wNB0sGD2/IMG-20260125-204722-215.jpg' },
            ]}
          />
        </div>

        <div className="text-center">
          <h1 className="text-sm font-bold text-gold">Paquetes VIP</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Elige tu inversión
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const purchasedData = purchasedPackages.find(p => p.id === pkg.id)
            const isPurchased = !!purchasedData
            const isDisabled = !pkg.is_enabled || isPurchased
            return (
              <Card key={pkg.id} glassEffect>
                <div className="space-y-4">
                  <div className="text-center">
                    <h2 className="text-sm font-bold text-gold">{pkg.name}</h2>
                    <p className="text-sm text-text-secondary uppercase tracking-wider font-light mt-1">
                      Nivel {pkg.level}
                    </p>
                    <p className="text-xs text-text-secondary mt-2">
                      {getPackageMotivation(pkg.level)}
                    </p>
                    <p className="text-xs text-gold mt-1">
                      {getPackageHook(pkg.level)}
                    </p>
                  </div>

                  <div className="border-t border-b border-gold/20 py-4 space-y-2">
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
                      <span className="font-bold text-gold">
                        {calculatePercentage(pkg.daily_profit_bs, pkg.investment_bs)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">Ganancia mensual:</span>
                      <span className="font-bold text-gold">
                        Bs {calculateMonthly(pkg.daily_profit_bs)}
                      </span>
                    </div>
                  </div>

                  <div className="relative">

                    <Button
                      variant="primary"
                      className="w-full"
                      disabled={isDisabled}
                      onClick={() => router.push(`/paks/${pkg.id}/buy`)}
                    >
                      {isPurchased ? 'Comprado' : pkg.is_enabled ? 'Comprar' : 'No disponible'}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 SmartHogar. Todos los derechos reservados por SmartHogar.
      </p>

      <BottomNav />
    </div>
  )
}
