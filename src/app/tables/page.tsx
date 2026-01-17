'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import BottomNav from '@/components/ui/BottomNav'
import ScreenshotProtection from '@/components/ui/ScreenshotProtection'

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

export default function TablesPage() {
    const router = useRouter()
    const [packages, setPackages] = useState<VipPackage[]>([])
    const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
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

            const [pkgRes, bonusRes] = await Promise.all([
                fetch('/api/packages'),
                fetch('/api/bonus-rules'),
            ])

            if (pkgRes.ok) {
                const data = await pkgRes.json()
                setPackages(data.filter((p: VipPackage) => p.is_enabled))
            }

            if (bonusRes.ok) {
                const data = await bonusRes.json()
                setBonusRules(data)
            }
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculatePercentage = (profit: number, investment: number) => {
        if (!investment || investment <= 0) return 0
        return (profit / investment) * 100
    }

    const calculateMonthly = (dailyProfit: number) => {
        return dailyProfit * 30
    }

    if (loading) {
        return (
            <div className="min-h-screen pb-20 flex items-center justify-center">
                <ScreenshotProtection />
                <p className="text-gold text-xl">Cargando tablas...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen pb-20">
            <ScreenshotProtection />
            <div className="max-w-screen-xl mx-auto p-6 space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gold gold-glow mb-2">📊 Tablas de Inversión</h1>
                    <p className="text-text-secondary">
                        Consulta los paquetes VIP disponibles y los bonos de patrocinio
                    </p>
                </div>

                {/* Paquetes VIP Table */}
                <Card glassEffect>
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gold mb-2">💎 Paquetes VIP Disponibles</h2>
                            <p className="text-sm text-text-secondary">
                                Inversiones y retornos diarios garantizados
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gold border-opacity-30">
                                        <th className="text-left py-2 px-2 text-gold font-bold uppercase text-[10px]">Paquete</th>
                                        <th className="text-right py-2 px-2 text-gold font-bold uppercase text-[10px]">Inversión</th>
                                        <th className="text-right py-2 px-2 text-gold font-bold uppercase text-[10px]">Ganancia/Día</th>
                                        <th className="text-right py-2 px-2 text-gold font-bold uppercase text-[10px]">% Diario</th>
                                        <th className="text-right py-2 px-2 text-gold font-bold uppercase text-[10px]">Ganancia/Mes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {packages.map((pkg) => {
                                        const dailyPercentage = calculatePercentage(pkg.daily_profit_bs, pkg.investment_bs)
                                        const monthlyProfit = calculateMonthly(pkg.daily_profit_bs)
                                        return (
                                            <tr key={pkg.id} className="border-b border-gold border-opacity-10 hover:bg-gold hover:bg-opacity-5 transition-colors">
                                                <td className="py-2 px-2">
                                                    <span className="text-text-primary font-bold text-xs">{pkg.name}</span>
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <span className="text-text-primary font-medium text-xs">Bs {pkg.investment_bs.toFixed(2)}</span>
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <span className="text-gold font-bold text-xs">Bs {pkg.daily_profit_bs.toFixed(2)}</span>
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <span className="text-green-400 font-bold text-sm">{dailyPercentage.toFixed(2)}%</span>
                                                </td>
                                                <td className="py-2 px-2 text-right">
                                                    <span className="text-gold-bright font-bold text-xs">Bs {monthlyProfit.toFixed(2)}</span>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-dark-card bg-opacity-50 rounded p-2 text-[10px] text-text-secondary space-y-0.5">
                            <p>💡 <strong className="text-gold">Inversión:</strong> Monto a pagar para activar el paquete</p>
                            <p>💡 <strong className="text-gold">Ganancia/Día:</strong> Monto que recibes diariamente en tu billetera</p>
                            <p>💡 <strong className="text-gold">% Diario:</strong> Porcentaje de retorno sobre tu inversión por día</p>
                            <p>💡 <strong className="text-gold">Ganancia/Mes:</strong> Proyección de ganancia mensual (30 días)</p>
                        </div>
                    </div>
                </Card>

                {/* Bonos de Patrocinio Table */}
                <Card glassEffect>
                    <div className="space-y-4">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-gold mb-2">🎁 Bonos de Patrocinio</h2>
                            <p className="text-sm text-text-secondary">
                                Gana bonos cuando tus referidos compran paquetes VIP
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    <tr className="border-b border-gold border-opacity-30">
                                        <th className="text-left py-2 px-2 text-gold font-bold uppercase text-[10px]">Nivel</th>
                                        <th className="text-left py-2 px-2 text-gold font-bold uppercase text-[10px]">Descripción</th>
                                        <th className="text-right py-2 px-2 text-gold font-bold uppercase text-[10px]">Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bonusRules.map((rule) => (
                                        <tr key={rule.id} className="border-b border-gold border-opacity-10 hover:bg-gold hover:bg-opacity-5 transition-colors">
                                            <td className="py-2 px-2">
                                                <span className="text-gold-bright font-bold text-sm">Nivel {rule.level}</span>
                                            </td>
                                            <td className="py-2 px-2">
                                                <span className="text-text-primary text-xs">
                                                    {rule.level === 1 ? '👤 Patrocinador directo (quien invitaste)' :
                                                        rule.level === 2 ? '👥 Segundo nivel (referidos de tus referidos)' :
                                                            rule.level === 3 ? '👨‍👩‍👧 Tercer nivel' :
                                                                `Nivel ${rule.level}`}
                                                </span>
                                            </td>
                                            <td className="py-2 px-2 text-right">
                                                <span className="text-gold font-bold text-lg">{rule.percentage.toFixed(2)}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Card>

                <p className="mt-6 text-xs text-text-secondary text-center">
                    © 2026 ULTRON. Todos los derechos reservados por ULTRON.
                </p>
            </div>

            <BottomNav />
        </div>
    )
}
