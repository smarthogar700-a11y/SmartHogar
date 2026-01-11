import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

export const metadata: Metadata = {
  title: 'VIP MLM',
  description: 'Plataforma VIP MLM Premium',
}

// Iniciar cron jobs en el servidor
if (typeof window === 'undefined') {
  import('@/lib/cron').then(({ startDailyProfitCron }) => {
    startDailyProfitCron()
  })
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="font-montserrat bg-dark-bg text-text-primary antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
