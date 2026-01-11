'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'

interface User {
  id: string
  username: string
  full_name: string
  email: string
  user_code: string
  balance: number
  active_vip: string | null
  created_at: string
}

interface UsersTabProps {
  token: string
}

export default function UsersTab({ token }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <p className="text-center text-gold">Cargando usuarios...</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gold mb-4">Usuarios Registrados</h2>

      {users.length === 0 ? (
        <Card>
          <p className="text-center text-text-secondary">No hay usuarios registrados</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id} glassEffect>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-text-primary">{user.full_name}</h3>
                  <p className="text-sm text-text-secondary">@{user.username}</p>
                  <p className="text-xs text-text-secondary">{user.email}</p>
                  <p className="text-xs text-gold mt-1">Código: {user.user_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-gold">
                    Bs {user.balance.toFixed(2)}
                  </p>
                  {user.active_vip ? (
                    <p className="text-xs text-green-500 mt-1">
                      {user.active_vip} ACTIVO
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary mt-1">Sin VIP</p>
                  )}
                  <p className="text-xs text-text-secondary mt-1">
                    {new Date(user.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
