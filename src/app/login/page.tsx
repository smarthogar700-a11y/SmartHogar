'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      document.cookie = `auth_token=${data.token}; path=/; max-age=${30 * 24 * 60 * 60}`
      router.push('/home')
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gradient-gold-blue">Bienvenido</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Inicia sesión en tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Usuario o Email"
            type="text"
            required
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
          />

          <Input
            label="Contraseña"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-btn">
              {error}
            </div>
          )}

          <div className="text-right">
            <Link href="/forgot-password" className="text-sm text-blue-bright hover:text-gold">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </Button>

          <p className="text-center text-text-secondary">
            ¿No tienes cuenta?{' '}
            <Link href="/signup" className="text-blue-bright hover:text-gold">
              Regístrate
            </Link>
          </p>
        </form>

        <p className="mt-8 text-xs text-text-secondary text-center">
          © 2026 SmartHogar. Todos los derechos reservados por SmartHogar.
        </p>
      </div>
    </div>
  )
}
