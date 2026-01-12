import { Suspense } from 'react'
import SignupClient from './SignupClient'

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6">
          <p className="text-gold text-xl">Cargando...</p>
        </div>
      }
    >
      <SignupClient />
    </Suspense>
  )
}
