'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Image from 'next/image'
import ManualAdjustTab from '@/components/admin/ManualAdjustTab'
import ConfigTab from '@/components/admin/ConfigTab'
import ShopTab from '@/components/admin/ShopTab'
import ChatTab from '@/components/admin/ChatTab'
import { useToast } from '@/components/ui/Toast'

type Tab =
  | 'purchases'
  | 'withdrawals'
  | 'adjust'
  | 'active-users'
  | 'news'
  | 'config'
  | 'daily-profit'
  | 'shop'
  | 'chat'

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
  bank_name?: string
  account_number?: string
  payout_method?: string
  qr_image_url: string
  receipt_url?: string
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
    created_at: string | null
    activated_at: string | null
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

interface EffortBonus {
  id: number
  title: string
  target_kpi: string
  level_description: string
  amount_bs: number
  requirement_description: string
  is_active: boolean
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
  const [effortBonuses, setEffortBonuses] = useState<EffortBonus[]>([])

  // New Bonus States
  const [newBonusTitle, setNewBonusTitle] = useState('')
  const [newBonusTarget, setNewBonusTarget] = useState('')
  const [newBonusLevelDesc, setNewBonusLevelDesc] = useState('')
  const [newBonusAmount, setNewBonusAmount] = useState('')
  const [newBonusReqDesc, setNewBonusReqDesc] = useState('')

  const [newsTitle, setNewsTitle] = useState('')
  const [newsBody, setNewsBody] = useState('')
  const [newsActive, setNewsActive] = useState(true)
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [token, setToken] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [purchaseSearch, setPurchaseSearch] = useState('')
  const [activeSearch, setActiveSearch] = useState('')
  // ...

  const [dailyProfitStatus, setDailyProfitStatus] = useState<{
    blocked: boolean
    last_run_at: string | null
    unlocks_at: string | null
    active_purchases?: number
    processed?: number
    synced?: number
  } | null>(null)
  const pageSize = 30
  const [purchasesOffset, setPurchasesOffset] = useState(0)
  const [purchasesHasMore, setPurchasesHasMore] = useState(true)
  const [withdrawalsOffset, setWithdrawalsOffset] = useState(0)
  const [withdrawalsHasMore, setWithdrawalsHasMore] = useState(true)
  const [activeOffset, setActiveOffset] = useState(0)
  const [activeHasMore, setActiveHasMore] = useState(true)

  // Config states
  const [packages, setPackages] = useState<VipPackage[]>([])
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([])
  const [configLoading, setConfigLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [adminVerified, setAdminVerified] = useState(false)
  const [adminChecking, setAdminChecking] = useState(true)
  const [selectedWithdrawalForReceipt, setSelectedWithdrawalForReceipt] = useState<Withdrawal | null>(null)
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptUploading, setReceiptUploading] = useState(false)
  const [unreadChatsCount, setUnreadChatsCount] = useState(0)

  // Fetch unread chats count
  const fetchUnreadChatsCount = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]
      if (!token) return

      const res = await fetch('/api/admin/chat', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const totalUnread = data.conversations?.reduce((sum: number, conv: any) => sum + (conv.unread_count || 0), 0) || 0
        setUnreadChatsCount(totalUnread)
      }
    } catch (error) {
      console.error('Error fetching unread chats:', error)
    }
  }

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
    if (!token) return
    if (tab === 'purchases') {
      setPurchases([])
      setPurchasesOffset(0)
      setPurchasesHasMore(true)
      fetchPurchases(0, false)
    } else if (tab === 'withdrawals') {
      setWithdrawals([])
      setWithdrawalsOffset(0)
      setWithdrawalsHasMore(true)
      fetchWithdrawals(0, false)
    } else if (tab === 'active-users') {
      setActiveUsers([])
      setActiveOffset(0)
      setActiveHasMore(true)
      fetchActiveUsers(0, false)
    } else if (tab === 'news') {
      fetchNews()
      fetchEffortBonuses()
    }
  }, [tab, token])

  // Auto-refresh removido - El panel se actualiza al aprobar/rechazar compras

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

  // Fetch unread chats count on mount and periodically
  useEffect(() => {
    if (token) {
      fetchUnreadChatsCount()
      const interval = setInterval(fetchUnreadChatsCount, 15000) // cada 15 segundos
      return () => clearInterval(interval)
    }
  }, [token])

  const getToken = () => {
    return token
  }

  const handleAuthRedirect = (status: number) => {
    if (status === 401) {
      router.push('/login')
      return
    }
    if (status === 403) {
      showToast('Acceso solo para administradores', 'error')
      router.push('/home')
    }
  }

  const fetchConfigData = async () => {
    setConfigLoading(true)
    setAdminChecking(true)
    try {
      const [pkgRes, bonusRes] = await Promise.all([
        fetch('/api/admin/vip-packages', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/bonus-rules', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (pkgRes.status === 401 || pkgRes.status === 403) {
        handleAuthRedirect(pkgRes.status)
        return
      }
      if (bonusRes.status === 401 || bonusRes.status === 403) {
        handleAuthRedirect(bonusRes.status)
        return
      }

      if (pkgRes.ok || bonusRes.ok) {
        setAdminVerified(true)
      }
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
      setAdminChecking(false)
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

  const fetchPurchases = async (offset = 0, append = false) => {
    setLoading(!append)
    setLoadingMore(append)
    setErrorMessage('')
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }
      const res = await fetch(`/api/admin/purchases?limit=${pageSize}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        handleAuthRedirect(res.status)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || 'Error al cargar compras')
        setPurchases([])
        setPurchasesTotal(0)
      } else {
        const data = await res.json()
        const items = data.purchases || []
        setPurchases((prev) => (append ? [...prev, ...items] : items))
        setPurchasesTotal(data.total_investment_bs || 0)
        setPurchasesHasMore(Boolean(data.has_more))
        setPurchasesOffset(data.next_offset || 0)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setErrorMessage('Error de conexión')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchWithdrawals = async (offset = 0, append = false) => {
    setLoading(!append)
    setLoadingMore(append)
    setErrorMessage('')
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }
      const res = await fetch(`/api/admin/withdrawals?limit=${pageSize}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        handleAuthRedirect(res.status)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || 'Error al cargar retiros')
        setWithdrawals([])
      } else {
        const data = await res.json()
        const items = data.withdrawals || []
        setWithdrawals((prev) => (append ? [...prev, ...items] : items))
        setWithdrawalsHasMore(Boolean(data.has_more))
        setWithdrawalsOffset(data.next_offset || 0)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setErrorMessage('Error de conexión')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchActiveUsers = async (offset = 0, append = false) => {
    setLoading(!append)
    setLoadingMore(append)
    setErrorMessage('')
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }
      const res = await fetch(`/api/admin/active-users?limit=${pageSize}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        handleAuthRedirect(res.status)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setErrorMessage(data?.error || 'Error al cargar usuarios activos')
        setActiveUsers([])
      } else {
        const data = await res.json()
        const items = data.users || []
        setActiveUsers((prev) => (append ? [...prev, ...items] : items))
        setActiveHasMore(Boolean(data.has_more))
        setActiveOffset(data.next_offset || 0)
      }
    } catch (error) {
      console.error('Fetch error:', error)
      setErrorMessage('Error de conexión')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const fetchNews = async () => {
    setLoading(true)
    setErrorMessage('')
    try {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }
      const res = await fetch('/api/admin/news', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401 || res.status === 403) {
        handleAuthRedirect(res.status)
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
    } catch (error) {
      console.error('Fetch error:', error)
      setErrorMessage('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  const fetchEffortBonuses = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/effort-bonuses', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setEffortBonuses(data)
      }
    } catch (error) {
      console.error('Error loading effort bonuses', error)
    }
  }

  const updateEffortBonus = async (bonus: EffortBonus) => {
    setSaving(`bonus-effort-${bonus.id}`)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/effort-bonuses', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bonus),
      })
      if (res.ok) {
        showToast('Bono actualizado', 'success')
        fetchEffortBonuses()
      } else {
        showToast('Error al actualizar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(null)
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
          blocked: !!data.blocked,
          last_run_at: data.last_run_at || null,
          unlocks_at: data.unlocks_at || null,
          active_purchases: data.active_purchases,
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
        fetchPurchases(0, false)
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
    if (!confirm('¿Rechazar esta compra? El usuario podrá volver a solicitar este paquete.')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/purchases/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast('Compra rechazada - Usuario puede solicitar nuevamente', 'info')
        fetchPurchases(0, false)
      } else {
        showToast('Error al rechazar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handlePayWithdrawal = async (receiptUrl?: string) => {
    if (!selectedWithdrawalForReceipt) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/withdrawals/${selectedWithdrawalForReceipt.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receipt_url: receiptUrl || null }),
      })

      if (res.ok) {
        showToast('Retiro marcado como pagado', 'success')
        setSelectedWithdrawalForReceipt(null)
        setReceiptFile(null)
        fetchWithdrawals(0, false)
      } else {
        showToast('Error al procesar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleUploadReceipt = async () => {
    if (!receiptFile) {
      showToast('Debes subir un comprobante de pago', 'error')
      return
    }

    setReceiptUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', receiptFile)

      const token = getToken()
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadRes.ok) {
        showToast('Error al subir comprobante', 'error')
        return
      }

      const { url } = await uploadRes.json()
      await handlePayWithdrawal(url)
    } catch (error) {
      showToast('Error al subir comprobante', 'error')
    } finally {
      setReceiptUploading(false)
    }
  }

  const handleRejectWithdrawal = async (id: string) => {
    if (!confirm('¿Rechazar este retiro? Los fondos serán devueltos al usuario.')) return

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch(`/api/admin/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast('Retiro rechazado - Fondos devueltos al usuario', 'info')
        fetchWithdrawals(0, false)
      } else {
        showToast('Error al rechazar', 'error')
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
    { key: 'shop' as const, label: 'Tienda', icon: '🛒' },
    { key: 'chat' as const, label: 'Chat', icon: '💬' },
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

      const data = await res.json().catch(() => null)

      if (res.status === 423) {
        // Bloqueado - ganancias ya procesadas hoy
        const unlockTime = data?.unlocks_at ? new Date(data.unlocks_at) : null
        const unlockMsg = unlockTime
          ? `Disponible a la 1:00 AM (Bolivia)`
          : ''
        showToast(`🔒 Ganancias ya procesadas hoy. ${unlockMsg}`, 'info')
        setDailyProfitStatus({
          blocked: true,
          last_run_at: data?.last_run_at || null,
          unlocks_at: data?.unlocks_at || null,
        })
      } else if (res.ok) {
        showToast(
          `✅ Ganancias procesadas: ${data?.processed ?? 0} usuarios | Sincronizados: ${data?.synced ?? 0}`,
          'success'
        )
        setDailyProfitStatus({
          blocked: true,
          last_run_at: data?.last_run_at || null,
          unlocks_at: data?.unlocks_at || null,
          processed: data?.processed,
          synced: data?.synced,
        })
      } else {
        showToast(data?.error || 'Error al procesar ganancias', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateBonus = async () => {
    if (!newBonusTitle || !newBonusTarget || !newBonusAmount) {
      setErrorMessage('Título, Target y Monto son requeridos')
      return
    }

    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/effort-bonuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newBonusTitle,
          target_kpi: newBonusTarget,
          level_description: newBonusLevelDesc,
          amount_bs: Number(newBonusAmount),
          requirement_description: newBonusReqDesc,
        }),
      })

      if (res.ok) {
        showToast('Bono creado exitosamente', 'success')
        setNewBonusTitle('')
        setNewBonusTarget('')
        setNewBonusLevelDesc('')
        setNewBonusAmount('')
        setNewBonusReqDesc('')
        fetchEffortBonuses()
      } else {
        const data = await res.json().catch(() => null)
        showToast(data?.error || 'Error al crear bono', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteBonus = async (id: number) => {
    if (!confirm('¿Eliminar este bono permanentemente?')) return
    setProcessing(true)
    try {
      const token = getToken()
      const res = await fetch('/api/admin/effort-bonuses', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        showToast('Bono eliminado', 'success')
        fetchEffortBonuses()
      } else {
        showToast('Error al eliminar', 'error')
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
        showToast('Noticia publicada exitosamente', 'success')
        setNewsTitle('')
        setNewsBody('')
        setNewsActive(true)
        fetchNews()
      } else {
        const data = await res.json().catch(() => null)
        showToast(data?.error || 'Error al crear noticia', 'error')
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

  const purchasesUsersList = purchases.reduce((acc, purchase) => {
    if (!acc.some((item) => item.user.id === purchase.user.id)) {
      acc.push(purchase)
    }
    return acc
  }, [] as Purchase[])

  const filteredActiveUsersList = purchaseSearch.trim()
    ? purchasesUsersList.filter((purchase) => {
      const query = purchaseSearch.trim().toLowerCase()
      return (
        purchase.user.username.toLowerCase().includes(query) ||
        purchase.user.full_name.toLowerCase().includes(query) ||
        purchase.user.email.toLowerCase().includes(query)
      )
    })
    : purchasesUsersList

  const filteredActiveUsers = activeSearch.trim()
    ? activeUsers.filter((entry) => {
      const query = activeSearch.trim().toLowerCase()
      return (
        entry.user.username.toLowerCase().includes(query) ||
        entry.user.full_name.toLowerCase().includes(query)
      )
    })
    : activeUsers

  if (!token || adminChecking || !adminVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card glassEffect>
          <p className="text-center text-text-secondary">
            Verificando acceso de administrador...
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 pb-24">
      <div className="max-w-screen-xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient-gold-blue">Panel Admin</h1>
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
                          <div className="flex items-center gap-2">
                            {purchases.filter(item => item.user.id === p.user.id && item.status === 'PENDING').length > 0 && (
                              <span className="text-xs font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 px-2 py-1 rounded-full animate-pulse">
                                ⚠️ {purchases.filter(item => item.user.id === p.user.id && item.status === 'PENDING').length} Pendiente{purchases.filter(item => item.user.id === p.user.id && item.status === 'PENDING').length > 1 ? 's' : ''}
                              </span>
                            )}
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
                                      className={`text-xs ${item.status === 'ACTIVE'
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

                                  <div className="bg-dark-card bg-opacity-50 rounded p-2 space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-text-secondary uppercase tracking-wider">Correo:</span>
                                      <span className="text-gold">{p.user.email}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-text-secondary uppercase tracking-wider">Fecha de solicitud:</span>
                                      <span className="text-gold">
                                        {new Date(item.created_at).toLocaleString('es-ES', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          second: '2-digit'
                                        })}
                                      </span>
                                    </div>
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
                                      Rechazar
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
                {purchasesHasMore && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fetchPurchases(purchasesOffset, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar mas'}
                  </Button>
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
                            <div className="mt-2 bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
                              <p className="text-[10px] text-text-secondary uppercase tracking-wider">Saldo en billetera</p>
                              <p className={`text-lg font-bold ${w.total_earnings_bs >= w.amount_bs ? 'text-green-400' : 'text-red-400'}`}>
                                Bs {w.total_earnings_bs.toFixed(2)}
                              </p>
                              {w.total_earnings_bs < w.amount_bs && (
                                <p className="text-[9px] text-red-400">Saldo insuficiente</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-text-secondary uppercase tracking-wider">Monto solicitado</p>
                            <p className="text-xl font-bold text-gold">
                              Bs {w.amount_bs.toFixed(2)}
                            </p>
                            <div className="mt-2 text-[10px] text-text-secondary space-y-1">
                              <div>
                                <span className="uppercase tracking-wider">Telefono:</span> {w.phone_number || 'No registrado'}
                              </div>
                              <div>
                                <span className="uppercase tracking-wider">Banco:</span> {w.bank_name || 'No registrado'}
                              </div>
                              <div>
                                <span className="uppercase tracking-wider">Modo:</span> {w.payout_method || 'No registrado'}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Imagen QR del usuario */}
                        {w.qr_image_url && (
                          <div className="bg-dark-card bg-opacity-50 rounded p-3">
                            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">QR para pagar:</p>
                            <div className="flex justify-center">
                              <img
                                src={w.qr_image_url}
                                alt="QR del usuario"
                                className="w-48 h-48 object-contain rounded-lg border border-gold/30"
                              />
                            </div>
                          </div>
                        )}

                        <div className="bg-dark-card bg-opacity-50 rounded p-2 space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-secondary uppercase tracking-wider">Correo:</span>
                            <span className="text-gold">{w.user.email}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-secondary uppercase tracking-wider">Fecha de solicitud:</span>
                            <span className="text-gold">
                              {new Date(w.created_at).toLocaleString('es-ES', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => {
                              // Set the selected withdrawal for receipt upload
                              setSelectedWithdrawalForReceipt(w)
                            }}
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
                {withdrawalsHasMore && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fetchWithdrawals(withdrawalsOffset, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar mas'}
                  </Button>
                )}
              </div>
            )}

            {/* Receipt Upload Modal */}
            {selectedWithdrawalForReceipt && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                <Card glassEffect className="max-w-md w-full">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gold">Marcar Retiro como Pagado</h3>
                    <div className="bg-dark-card bg-opacity-50 rounded p-3 space-y-2">
                      <p className="text-sm text-text-secondary">
                        <span className="font-bold text-text-primary">{selectedWithdrawalForReceipt.user.full_name}</span>
                      </p>
                      <p className="text-lg font-bold text-gold">Bs {selectedWithdrawalForReceipt.amount_bs.toFixed(2)}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm text-text-secondary">
                        Comprobante de Pago <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gold file:text-dark-bg hover:file:bg-gold/80"
                      />
                      {receiptFile && (
                        <p className="text-xs text-green-400">✓ {receiptFile.name}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setSelectedWithdrawalForReceipt(null)
                          setReceiptFile(null)
                        }}
                        disabled={processing || receiptUploading}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={handleUploadReceipt}
                        disabled={processing || receiptUploading || !receiptFile}
                      >
                        {receiptUploading ? 'Subiendo...' : processing ? 'Procesando...' : 'Confirmar Pago'}
                      </Button>
                    </div>
                  </div>
                </Card>
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

                    {dailyProfitStatus?.last_run_at && (
                      <div className="text-xs text-text-secondary space-y-1">
                        <p>
                          📅 Última actualización: <span className="text-gold">{new Date(dailyProfitStatus.last_run_at).toLocaleString('es-ES', { timeZone: 'America/La_Paz' })}</span>
                        </p>
                        {(dailyProfitStatus.processed !== undefined || dailyProfitStatus.synced !== undefined) && (
                          <div className="flex items-center justify-center gap-4 mt-2 text-sm">
                            {dailyProfitStatus.processed !== undefined && (
                              <span className="text-green-400">
                                👥 Procesados: <strong>{dailyProfitStatus.processed}</strong>
                              </span>
                            )}
                            {dailyProfitStatus.synced !== undefined && (
                              <span className="text-blue-400">
                                🔄 Sincronizados: <strong>{dailyProfitStatus.synced}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Estado de bloqueo */}
                    {dailyProfitStatus?.blocked && (
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-center gap-2">
                          <span className="text-2xl">🔒</span>
                          <span className="text-orange-400 font-bold">BLOQUEADO</span>
                        </div>
                        <p className="text-sm text-text-secondary">
                          Las ganancias ya fueron procesadas hoy.
                        </p>
                        {dailyProfitStatus.unlocks_at && (
                          <p className="text-xs text-orange-300">
                            Se desbloquea a la <strong>1:00 AM</strong> (hora Bolivia)
                          </p>
                        )}
                      </div>
                    )}

                    <Button
                      variant="primary"
                      className={`w-full py-4 text-lg ${dailyProfitStatus?.blocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                      onClick={handleRunDailyProfit}
                      disabled={processing || dailyProfitStatus?.blocked}
                    >
                      {processing
                        ? 'Procesando ganancias...'
                        : dailyProfitStatus?.blocked
                          ? '🔒 Bloqueado hasta 1:00 AM'
                          : '▶️ Actualizar Ganancias Ahora'}
                    </Button>
                  </div>
                </Card>

                <Card className="bg-dark-bg">
                  <div className="text-sm text-text-secondary space-y-2">
                    <p className="text-gold font-bold mb-3">ℹ️ Información del Proceso</p>
                    <p>• Solo se procesan usuarios con VIP activo</p>
                    <p>• Cada usuario recibe la ganancia diaria según su paquete VIP</p>
                    <p>• El proceso se ejecuta manualmente por el administrador</p>
                    <p>• <strong className="text-orange-400">Bloqueo:</strong> Después de actualizar, se bloquea hasta la 1:00 AM</p>
                    <p>• <strong className="text-gold">Procesados:</strong> Usuarios que recibieron ganancias diarias</p>
                    <p>• <strong className="text-blue-400">Sincronizados:</strong> Compras cuya ganancia se actualizó al paquete VIP</p>
                  </div>
                </Card>
              </div>
            )}

            {tab === 'active-users' && (
              <div className="space-y-4">
                <Card glassEffect>
                  <div className="space-y-2">
                    <Input
                      label="Buscar usuario"
                      type="text"
                      value={activeSearch}
                      onChange={(e) => setActiveSearch(e.target.value)}
                      placeholder="Usuario o nombre"
                    />
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveSearch((value) => value.trim())}
                    >
                      Buscar
                    </Button>
                  </div>
                </Card>
                {filteredActiveUsers.length === 0 ? (
                  <Card>
                    <p className="text-center text-text-secondary">
                      No hay usuarios activos
                    </p>
                  </Card>
                ) : (
                  filteredActiveUsers.map((entry) => (
                    <Card key={entry.user.username} glassEffect className="p-2">
                      <div className="space-y-2 text-[9px]">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xs font-bold text-gold">
                              {entry.user.full_name}
                            </h3>
                            <p className="text-text-secondary">@{entry.user.username}</p>
                            <p className="text-text-secondary">{entry.user.email}</p>
                          </div>
                        </div>

                        {/* Paquetes VIP con fechas */}
                        <div className="space-y-1">
                          {entry.active_packages.map((pkg, idx) => (
                            <div key={idx} className="bg-dark-card bg-opacity-50 rounded p-1.5 space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-gold">{pkg.name}</span>
                                <span className="text-[8px] text-text-secondary">· Nivel {pkg.level}</span>
                              </div>
                              <div className="text-[7px] text-text-secondary">
                                <div>
                                  Solicitado: {pkg.created_at
                                    ? new Date(pkg.created_at).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                    : 'N/A'}
                                </div>
                                <div>
                                  Activado: {pkg.activated_at
                                    ? new Date(pkg.activated_at).toLocaleString('es-ES', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })
                                    : 'N/A'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gold border-opacity-20 pt-1">
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
                {activeHasMore && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => fetchActiveUsers(activeOffset, true)}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Cargando...' : 'Cargar mas'}
                  </Button>
                )}
              </div>
            )}

            {tab === 'news' && (
              <div className="space-y-4">
                <Card glassEffect>
                  <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gold">📰 Crear Nueva Noticia</h2>
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
                      Mostrar en Home (usuarios verán esta noticia)
                    </label>
                    <Button
                      variant="primary"
                      className="w-full"
                      onClick={handleCreateNews}
                      disabled={processing}
                    >
                      {processing ? 'Guardando...' : '✅ Publicar Noticia'}
                    </Button>
                  </div>
                </Card>

                <div className="border-t border-gold border-opacity-20 pt-4">
                  <h3 className="text-lg font-bold text-gold mb-3">📋 Noticias Publicadas</h3>
                  {announcements.length === 0 ? (
                    <Card>
                      <p className="text-center text-text-secondary">
                        No hay noticias publicadas
                      </p>
                    </Card>
                  ) : (
                    announcements.map((item) => (
                      <Card key={item.id} glassEffect className="mb-3">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className="text-text-primary font-bold text-lg">{item.title}</h4>
                              <p className="text-xs text-text-secondary mt-1">
                                📅 {new Date(item.created_at).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${item.is_active
                              ? 'bg-green-500 bg-opacity-20 text-green-400 border border-green-500 border-opacity-30'
                              : 'bg-red-500 bg-opacity-20 text-red-400 border border-red-500 border-opacity-30'
                              }`}>
                              {item.is_active ? '✓ Visible' : '✗ Oculta'}
                            </div>
                          </div>

                          <p className="text-sm text-text-secondary whitespace-pre-wrap">{item.body}</p>

                          <div className="flex gap-2">
                            <Button
                              variant={item.is_active ? 'outline' : 'primary'}
                              className="flex-1"
                              onClick={async () => {
                                setProcessing(true)
                                try {
                                  const token = getToken()
                                  const res = await fetch('/api/admin/news', {
                                    method: 'PUT',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      Authorization: `Bearer ${token}`,
                                    },
                                    body: JSON.stringify({
                                      id: item.id,
                                      is_active: !item.is_active
                                    }),
                                  })
                                  if (res.ok) {
                                    showToast(
                                      item.is_active ? 'Noticia ocultada' : 'Noticia visible',
                                      'success'
                                    )
                                    fetchNews()
                                  } else {
                                    const data = await res.json().catch(() => null)
                                    showToast(data?.error || 'Error al actualizar', 'error')
                                  }
                                } catch (error) {
                                  showToast('Error de conexión', 'error')
                                } finally {
                                  setProcessing(false)
                                }
                              }}
                              disabled={processing}
                            >
                              {item.is_active ? '👁️ Ocultar' : '👁️ Mostrar'}
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1 text-red-400 border-red-500"
                              onClick={async () => {
                                if (!confirm('¿Eliminar esta noticia permanentemente?')) return
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
                                    fetchNews()
                                  } else {
                                    const data = await res.json().catch(() => null)
                                    showToast(data?.error || 'Error al eliminar', 'error')
                                  }
                                } catch (error) {
                                  showToast('Error de conexión', 'error')
                                } finally {
                                  setProcessing(false)
                                }
                              }}
                              disabled={processing}
                            >
                              🗑️ Eliminar
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>

                <div className="border-t border-gold border-opacity-20 pt-8 mt-8">
                  <h3 className="text-xl font-bold text-gold mb-4">🏆 Gestión de Bonos de Esfuerzo</h3>

                  {/* Formulario de Creación */}
                  {/* Formulario de Creación (Límite 3) */}
                  {effortBonuses.length < 3 ? (
                    <Card glassEffect className="mb-6">
                      <h4 className="text-lg font-bold text-gold mb-4">NUEVO BONO</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Título (Ej. Meta 1)"
                          value={newBonusTitle}
                          onChange={(e) => setNewBonusTitle(e.target.value)}
                          placeholder="Nombre de la meta"
                        />
                        <Input
                          label="Target (Ej. 30 activos)"
                          value={newBonusTarget}
                          onChange={(e) => setNewBonusTarget(e.target.value)}
                          placeholder="Objetivo numérico"
                        />
                        <Input
                          label="Descripción Nivel (Ej. Nivel 1)"
                          value={newBonusLevelDesc}
                          onChange={(e) => setNewBonusLevelDesc(e.target.value)}
                          placeholder="Donde aplica"
                        />
                        <Input
                          label="Monto (Bs)"
                          type="number"
                          value={newBonusAmount}
                          onChange={(e) => setNewBonusAmount(e.target.value)}
                          placeholder="Monto del premio"
                        />
                        <div className="md:col-span-2">
                          <label className="block text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
                            Descripción Requisito
                          </label>
                          <textarea
                            className="w-full bg-dark-bg border border-gold/30 rounded p-2 text-sm text-text-primary focus:border-gold outline-none"
                            rows={2}
                            value={newBonusReqDesc}
                            onChange={(e) => setNewBonusReqDesc(e.target.value)}
                            placeholder="Detalles de como ganar el bono"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={handleCreateBonus}
                            disabled={processing}
                          >
                            {processing ? 'Guardando...' : '➕ Crear Bono'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ) : (
                    <Card glassEffect className="mb-6 border-gold/50 bg-gold/5">
                      <div className="text-center py-6">
                        <div className="text-4xl mb-2">✅</div>
                        <h4 className="text-lg font-bold text-gold">Límite de Bonos Alcanzado (3/3)</h4>
                        <p className="text-sm text-text-secondary mt-2">
                          Para agregar un nuevo bono, primero elimina uno de la lista inferior.
                        </p>
                      </div>
                    </Card>
                  )}

                  <h4 className="text-lg font-bold text-gold mb-4">LISTA DE BONOS ({effortBonuses.length})</h4>
                  <div className="space-y-6">
                    {effortBonuses.map((bonus) => (
                      <Card key={bonus.id} glassEffect className={`relative overflow-hidden ${!bonus.is_active ? 'opacity-70 grayscale' : ''}`}>
                        <div className={`absolute top-0 left-0 w-1 h-full ${bonus.is_active ? 'bg-gold' : 'bg-red-500'}`}></div>
                        <div className="pl-3 space-y-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-lg text-gold">{bonus.title}</h4>
                              <span className={`text-[10px] px-2 py-0.5 rounded border ${bonus.is_active ? 'border-green-500 text-green-400' : 'border-red-500 text-red-500'}`}>
                                {bonus.is_active ? 'VISIBLE' : 'OCULTO'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {saving === `bonus-effort-${bonus.id}` && <span className="text-xs text-gold animate-pulse">Guardando...</span>}

                              <Button
                                variant="outline"
                                className={`text-xs py-1 px-3 ${bonus.is_active ? 'text-red-400 border-red-500' : 'text-green-400 border-green-500'}`}
                                onClick={() => updateEffortBonus({ ...bonus, is_active: !bonus.is_active })}
                                disabled={!!saving}
                              >
                                {bonus.is_active ? '👁️ Ocultar' : '👁️ Mostrar'}
                              </Button>

                              <Button
                                variant="outline"
                                className="text-xs py-1 px-3"
                                onClick={() => updateEffortBonus(bonus)}
                                disabled={!!saving}
                              >
                                💾 Actualizar Texto
                              </Button>

                              <Button
                                variant="outline"
                                className="text-xs py-1 px-3 text-red-500 border-red-500 hover:bg-red-500/10"
                                onClick={() => handleDeleteBonus(bonus.id)}
                                disabled={!!saving || processing}
                              >
                                🗑️ Eliminar
                              </Button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs uppercase text-text-secondary mb-1">Título</label>
                              <Input
                                value={bonus.title}
                                onChange={(e) => setEffortBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, title: e.target.value } : b))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-text-secondary mb-1">Target</label>
                              <Input
                                value={bonus.target_kpi}
                                onChange={(e) => setEffortBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, target_kpi: e.target.value } : b))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-text-secondary mb-1">Nivel Desc.</label>
                              <Input
                                value={bonus.level_description}
                                onChange={(e) => setEffortBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, level_description: e.target.value } : b))}
                              />
                            </div>
                            <div>
                              <label className="block text-xs uppercase text-text-secondary mb-1">Monto (Bs)</label>
                              <Input
                                type="number"
                                value={bonus.amount_bs}
                                onChange={(e) => setEffortBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, amount_bs: Number(e.target.value) } : b))}
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs uppercase text-text-secondary mb-1">Descripción</label>
                              <textarea
                                className="w-full bg-dark-bg border border-gold/30 rounded p-2 text-sm text-text-primary focus:border-gold outline-none"
                                rows={2}
                                value={bonus.requirement_description}
                                onChange={(e) => setEffortBonuses(prev => prev.map(b => b.id === bonus.id ? { ...b, requirement_description: e.target.value } : b))}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tab === 'shop' && <ShopTab token={token} />}

            {tab === 'chat' && <ChatTab token={token} />}
          </>
        )}

        {/* Configuración del Sistema removida por solicitud */}
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-dark-card border-t border-gold border-opacity-20 z-50">
        <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
          {adminTabs.map((item) => {
            const isActive = tab === item.key
            const hasNotification = item.key === 'chat' && unreadChatsCount > 0
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${isActive
                  ? 'text-gold'
                  : 'text-text-secondary hover:text-gold'
                  }`}
              >
                <span className="text-2xl mb-1 relative">
                  {item.icon}
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[6px] text-white font-bold items-center justify-center">
                        {unreadChatsCount > 9 ? '9+' : unreadChatsCount}
                      </span>
                    </span>
                  )}
                </span>
                <span className={`text-xs font-medium ${hasNotification ? 'text-red-400' : ''}`}>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
