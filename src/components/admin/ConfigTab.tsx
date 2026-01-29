'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

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

interface ConfigTabProps {
  token: string
}

export default function ConfigTab({ token }: ConfigTabProps) {
  const [packages, setPackages] = useState<VipPackage[]>([])
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [globalQr, setGlobalQr] = useState('')
  const { showToast } = useToast()

  useEffect(() => {
    if (token) {
      fetchData()
    }
  }, [token])

  const fetchData = async () => {
    setLoading(true)
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
        console.log('Paquetes VIP cargados:', pkgData)
        setPackages(pkgData)
        setGlobalQr(pkgData[0]?.qr_image_url || '')
      }
      if (bonusRes.ok) {
        const bonusData = await bonusRes.json()
        console.log('Bonos cargados:', bonusData)
        setBonusRules(bonusData)
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    } finally {
      setLoading(false)
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
        fetchData()
      } else {
        showToast('Error al actualizar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(null)
    }
  }

  const updateGlobalQr = async () => {
    setSaving('global-qr')
    try {
      const res = await fetch('/api/admin/vip-packages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_image_url: globalQr }),
      })

      if (res.ok) {
        showToast('QR actualizado para todos los paquetes', 'success')
        fetchData()
      } else {
        showToast('Error al actualizar el QR', 'error')
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
        fetchData()
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

  const calculatePercentage = (profit: number, investment: number) => {
    if (!investment || investment <= 0) return 0
    return (profit / investment) * 100
  }

  const calculateProfitFromPercentage = (investment: number, percentage: number) => {
    if (!investment || investment <= 0) return 0
    return (investment * percentage) / 100
  }

  if (loading) {
    return <p className="text-center text-gold">Cargando configuración...</p>
  }

  // Debug: show data status
  console.log('Packages:', packages.length, packages)
  console.log('Bonus Rules:', bonusRules.length, bonusRules)

  if (packages.length === 0) {
    return (
      <div className="text-center">
        <p className="text-red-500 mb-4">⚠️ No hay paquetes VIP en la base de datos</p>
        <p className="text-text-secondary">Por favor ejecuta: npm run prisma:seed</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* VIP Packages Table */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gold mb-2">⚙️ Paquetes VIP</h2>
          <p className="text-sm text-text-secondary">
            Modifica la inversión, ganancia diaria y porcentaje de retorno de cada paquete
          </p>
        </div>

        <Card glassEffect className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold border-opacity-30">
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Estado</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Paquete</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Inversión (Bs)</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Ganancia/Día (Bs)</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">% Diario</th>
                <th className="text-center py-3 px-4 text-gold font-bold uppercase text-sm">Acción</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => {
                const dailyPercentage = calculatePercentage(pkg.daily_profit_bs, pkg.investment_bs)
                return (
                  <tr key={pkg.id} className="border-b border-gold border-opacity-10 hover:bg-gold hover:bg-opacity-5 transition-colors">
                    <td className="py-3 px-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pkg.is_enabled}
                          onChange={(e) => {
                            const updated = { ...pkg, is_enabled: e.target.checked }
                            updatePackageField(pkg.id, 'is_enabled', e.target.checked)
                            updatePackage(updated)
                          }}
                          className="w-5 h-5 accent-gold"
                        />
                        <span className={`text-xs font-medium ${pkg.is_enabled ? 'text-green-500' : 'text-red-500'}`}>
                          {pkg.is_enabled ? '✓ Activo' : '✗ Inactivo'}
                        </span>
                      </label>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text-primary font-bold">{pkg.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.investment_bs}
                        onChange={(e) => updatePackageField(pkg.id, 'investment_bs', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 bg-dark-bg border border-gold border-opacity-30 rounded text-text-primary focus:outline-none focus:border-gold transition-all"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={pkg.daily_profit_bs}
                        onChange={(e) => updatePackageField(pkg.id, 'daily_profit_bs', parseFloat(e.target.value) || 0)}
                        className="w-28 px-3 py-2 bg-dark-bg border border-gold border-opacity-30 rounded text-text-primary focus:outline-none focus:border-gold transition-all"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={dailyPercentage.toFixed(2)}
                          onChange={(e) => {
                            const percentage = parseFloat(e.target.value) || 0
                            const newProfit = calculateProfitFromPercentage(pkg.investment_bs, percentage)
                            updatePackageField(pkg.id, 'daily_profit_bs', parseFloat(newProfit.toFixed(2)))
                          }}
                          className="w-24 px-3 py-2 bg-dark-bg border border-gold border-opacity-30 rounded text-text-primary text-center font-bold focus:outline-none focus:border-gold transition-all"
                        />
                        <span className="text-gold font-bold text-lg">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Button
                        variant="primary"
                        onClick={() => updatePackage(pkg)}
                        disabled={saving === `pkg-${pkg.id}`}
                        className="text-sm px-4 py-2"
                      >
                        {saving === `pkg-${pkg.id}` ? 'Guardando...' : 'Guardar'}
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card className="bg-dark-bg mt-4">
          <div className="text-sm text-text-secondary space-y-1">
            <p>💡 <strong className="text-gold">Inversión:</strong> Monto que el usuario debe pagar</p>
            <p>💡 <strong className="text-gold">Ganancia/Día:</strong> Monto que el usuario recibe diariamente</p>
            <p>💡 <strong className="text-gold">% Diario:</strong> Editable; actualiza automáticamente la ganancia/día</p>
            <p>⚠️ Los cambios se aplican inmediatamente a nuevas compras</p>
          </div>
        </Card>

      </div>

      {/* Bonus Rules Table */}
      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-gold mb-2">🎁 Bonos de Patrocinio</h2>
          <p className="text-sm text-text-secondary">
            Modifica el porcentaje de bono que recibe cada nivel de patrocinador
          </p>
        </div>

        <Card glassEffect className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold border-opacity-30">
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Nivel</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Descripción</th>
                <th className="text-left py-3 px-4 text-gold font-bold uppercase text-sm">Porcentaje (%)</th>
                <th className="text-center py-3 px-4 text-gold font-bold uppercase text-sm">Acción</th>
              </tr>
            </thead>
            <tbody>
              {bonusRules.filter(rule => rule.level <= 3).map((rule) => (
                <tr key={rule.id} className="border-b border-gold border-opacity-10 hover:bg-gold hover:bg-opacity-5 transition-colors">
                  <td className="py-3 px-4">
                    <span className="text-gold-bright font-bold text-xl">Nivel {rule.level}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-text-primary">
                      {rule.level === 1 ? '👤 Patrocinador directo (quien invitó al usuario)' :
                       rule.level === 2 ? '👥 Segundo nivel (patrocinador del patrocinador)' :
                       rule.level === 3 ? '👨‍👩‍👧 Tercer nivel (patrocinador del nivel 2)' :
                       null}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={rule.percentage}
                        onChange={(e) => updateBonusField(rule.id, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-24 px-3 py-2 bg-dark-bg border border-gold border-opacity-30 rounded text-text-primary text-center font-bold focus:outline-none focus:border-gold transition-all"
                      />
                      <span className="text-gold font-bold text-lg">%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <Button
                      variant="primary"
                      onClick={() => updateBonus(rule)}
                      disabled={saving === `bonus-${rule.id}`}
                      className="text-sm px-4 py-2"
                    >
                      {saving === `bonus-${rule.id}` ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="bg-dark-bg mt-4">
          <div className="text-sm text-text-secondary space-y-2">
            <p>💡 <strong className="text-gold">Ejemplo:</strong> Si un usuario compra VIP de Bs 1000 y el Nivel 1 tiene 12%:</p>
            <p className="pl-4">→ Su patrocinador directo recibe: 1000 × 12% = <span className="text-gold-bright font-bold">Bs 120</span></p>
            <p className="pl-4">→ El nivel 2 recibe: 1000 × 5% = <span className="text-gold-bright font-bold">Bs 50</span></p>
            <p className="pl-4">→ El nivel 3 recibe: 1000 × 1% = <span className="text-gold-bright font-bold">Bs 10</span></p>
            <p className="mt-3">⚠️ <strong className="text-gold">IMPORTANTE:</strong> Los cambios se aplican a TODAS las nuevas compras aprobadas.</p>
            <p>⚠️ Las compras anteriores mantienen el porcentaje con el que fueron calculadas.</p>
          </div>
        </Card>

        <Card className="bg-dark-bg mt-4">
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              QR global para todos los paquetes (se actualiza automaticamente).
            </p>
            <input
              type="text"
              value={globalQr}
              onChange={(e) => setGlobalQr(e.target.value)}
              className="w-full px-3 py-2 bg-dark-bg border border-gold border-opacity-30 rounded text-text-primary focus:outline-none focus:border-gold transition-all"
              placeholder="URL del QR"
            />
            <Button
              variant="primary"
              onClick={updateGlobalQr}
              disabled={saving === 'global-qr'}
              className="w-full"
            >
              {saving === 'global-qr' ? 'Guardando...' : 'Actualizar QR global'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
