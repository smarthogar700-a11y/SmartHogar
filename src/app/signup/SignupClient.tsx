'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import Card from '@/components/ui/Card'

export default function SignupClient({
  initialSponsorCode = '',
}: {
  initialSponsorCode?: string
}) {
  const router = useRouter()
  // Establecer 'CARLOS9092' como patrocinador por defecto si no viene de URL referida
  const defaultSponsorCode = initialSponsorCode || 'ZOE9092'
  const [formData, setFormData] = useState({
    sponsor_code: defaultSponsorCode,
    full_name: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState({ username: '', password: '' })
  const { showToast } = useToast()
  // Siempre bloquear el campo de patrocinador
  const lockSponsor = true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sponsor_code: formData.sponsor_code,
          full_name: formData.full_name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al registrarse')
        return
      }

      // Guardar credenciales y mostrar modal
      setCreatedCredentials({
        username: formData.username,
        password: formData.password,
      })
      setShowSuccessModal(true)
    } catch (err) {
      setError('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gold gold-glow">Registro</h1>
          <p className="mt-2 text-text-secondary uppercase tracking-wider text-sm font-light">
            Únete a la comunidad VIP
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Código de Patrocinador"
            type="text"
            value={formData.sponsor_code}
            onChange={(e) => setFormData({ ...formData, sponsor_code: e.target.value })}
            placeholder="Código de quien te invitó"
            readOnly={true}
            disabled={true}
          />

          <Input
            label="Nombre Completo"
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <Input
            label="Usuario"
            type="text"
            required
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />

          <Input
            label="Email"
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Contraseña"
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <Input
            label="Confirmar Contraseña"
            type="password"
            required
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          />

          {error && (
            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-4 py-3 rounded-btn">
              {error}
            </div>
          )}

          <Button type="submit" variant="primary" className="w-full" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>

          <p className="text-center text-text-secondary">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-gold hover:text-gold-bright">
              Inicia sesión
            </Link>
          </p>
        </form>
      </div>
      <p className="mt-8 text-xs text-text-secondary">
        © 2026 SmartHogar. Todos los derechos reservados por SmartHogar.
      </p>

      {/* Modal de registro exitoso */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <Card glassEffect>
            <div className="text-center space-y-4 p-2">
              <div className="text-5xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gold">¡Registro Exitoso!</h2>
              <p className="text-text-secondary text-sm">
                Tu cuenta ha sido creada correctamente. Guarda tus credenciales:
              </p>

              <div className="bg-dark-card border border-gold/30 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-xs text-text-secondary uppercase">Usuario</p>
                  <p className="text-gold font-bold text-lg">{createdCredentials.username}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase">Contraseña</p>
                  <p className="text-gold font-bold text-lg">{createdCredentials.password}</p>
                </div>
              </div>

              <p className="text-xs text-text-secondary">
                Recuerda guardar estos datos en un lugar seguro
              </p>

              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setShowSuccessModal(false)
                  router.push('/login')
                }}
              >
                Aceptar e Iniciar Sesión
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
