import Link from 'next/link'
import Button from '@/components/ui/Button'

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <img
            src="https://i.ibb.co/fVVzyKHQ/d8ec2485d1667e16cb4cb5dbe792dfbe-Photoroom.png"
            alt="Ultron"
            className="mx-auto h-40 w-auto"
          />
          <h1 className="text-5xl font-bold text-gold gold-glow">ULTRON</h1>
          <p className="text-sm text-text-secondary font-light tracking-wider">
            Impulsa tus ganancias y construye tu emprendimiento con resultados reales
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <Link href="/login" className="block">
            <Button variant="primary" className="w-full text-lg">
              Iniciar Sesión
            </Button>
          </Link>

          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full text-lg">
              Registrarse
            </Button>
          </Link>
        </div>

        <p className="text-sm text-text-secondary pt-4">
          Tu camino hacia el éxito financiero
        </p>
      </div>
      <p className="mt-8 text-xs text-text-secondary">© 2026 ULTRON. Todos los derechos reservados por ULTRON.</p>
    </div>
  )
}
