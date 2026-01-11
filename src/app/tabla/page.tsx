'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import BottomNav from '@/components/ui/BottomNav'

interface VipPackage {
  id: number
  level: number
  name: string
  investment_bs: number
  daily_profit_bs: number
}

interface BonusRule {
  id: number
  level: number
  percentage: number
}

export default function TablaPage() {
  const [packages, setPackages] = useState<VipPackage[]>([])
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const pkgRes = await fetch('/api/packages')
        if (pkgRes.ok) {
          const data = await pkgRes.json()
          setPackages(data)
        }

        const bonusRes = await fetch('/api/bonus-rules')
        if (bonusRes.ok) {
          const bonusData = await bonusRes.json()
          setBonusRules(bonusData)
        }
      } catch (error) {
        console.error('Error fetching tables:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const calculatePercentage = (profit: number, investment: number) => {
    if (!investment || investment <= 0) return '0.00'
    return ((profit / investment) * 100).toFixed(2)
  }

  const calculateMonthly = (profit: number) => {
    return (profit * 30).toFixed(2)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-gold text-xl">Cargando tablas...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-screen-xl mx-auto p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Tabla de Ganancias</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Resumen de paquetes y bonos
          </p>
        </div>

        <Card glassEffect className="overflow-x-auto">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gold mb-2">Tabla de Paquetes</h2>
            <p className="text-sm text-text-secondary mb-4">
              Inversión, ganancia diaria, porcentaje y ganancia mensual estimada.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold border-opacity-30">
                  <th className="text-left py-2 px-3 text-gold uppercase">Paquete</th>
                  <th className="text-left py-2 px-3 text-gold uppercase">Inversión</th>
                  <th className="text-left py-2 px-3 text-gold uppercase">Diario</th>
                  <th className="text-left py-2 px-3 text-gold uppercase">% Diario</th>
                  <th className="text-left py-2 px-3 text-gold uppercase">Mensual</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={`table-${pkg.id}`} className="border-b border-gold border-opacity-10">
                    <td className="py-2 px-3 text-text-primary">{pkg.name}</td>
                    <td className="py-2 px-3 text-text-secondary">Bs {pkg.investment_bs}</td>
                    <td className="py-2 px-3 text-text-secondary">Bs {pkg.daily_profit_bs}</td>
                    <td className="py-2 px-3 text-text-secondary">
                      {calculatePercentage(pkg.daily_profit_bs, pkg.investment_bs)}%
                    </td>
                    <td className="py-2 px-3 text-gold-bright">
                      Bs {calculateMonthly(pkg.daily_profit_bs)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card glassEffect className="overflow-x-auto">
          <div className="p-4">
            <h2 className="text-2xl font-bold text-gold mb-2">Bono de Patrocinio</h2>
            <p className="text-sm text-text-secondary mb-4">
              Bonos por niveles calculados sobre la inversión de cada paquete.
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold border-opacity-30">
                  <th className="text-left py-2 px-3 text-gold uppercase">Nivel</th>
                  <th className="text-left py-2 px-3 text-gold uppercase">% Bono</th>
                  {packages.map((pkg) => (
                    <th key={`bonus-head-${pkg.id}`} className="text-left py-2 px-3 text-gold uppercase">
                      {pkg.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bonusRules.map((rule) => (
                  <tr key={`bonus-${rule.id}`} className="border-b border-gold border-opacity-10">
                    <td className="py-2 px-3 text-text-primary">Nivel {rule.level}</td>
                    <td className="py-2 px-3 text-text-secondary">{rule.percentage}%</td>
                    {packages.map((pkg) => (
                      <td key={`bonus-${rule.id}-${pkg.id}`} className="py-2 px-3 text-text-secondary">
                        Bs {((pkg.investment_bs * rule.percentage) / 100).toFixed(2)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <p className="mt-6 text-xs text-text-secondary text-center">
        © 2026 ULTRON. Todos los derechos reservados por ULTRON.
      </p>

      <BottomNav />
    </div>
  )
}
