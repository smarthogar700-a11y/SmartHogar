import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'
import { ThemeProvider } from '@/context/ThemeContext'
import ThemeToggle from '@/components/ui/ThemeToggle'
import StarfieldBackground from '@/components/ui/StarfieldBackground'

export const metadata: Metadata = {
  title: 'SmartHogar',
  description: 'Plataforma SmartHogar Premium',
  icons: {
    icon: [
      {
        url: 'https://i.ibb.co/35y8M1HR/vecteezy-online-store-with-smartphone-shop-concept-illustration-for-8480599.png',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: 'https://i.ibb.co/35y8M1HR/vecteezy-online-store-with-smartphone-shop-concept-illustration-for-8480599.png',
        type: 'image/png',
      },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#1a1a2e',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SmartHogar',
  },
}

// Iniciar cron jobs solo si esta habilitado por entorno
if (typeof window === 'undefined' && process.env.ENABLE_INTERNAL_CRON === 'true') {
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
      <body className="font-inter bg-dark-bg text-text-primary antialiased">
        <ToastProvider>
          <ThemeProvider>
            {/* Minimalist Background - Usando gradiente global de globals.css */}
            <div className="fixed inset-0 -z-10 pointer-events-none bg-transparent" />

            <div className="min-h-screen relative z-10">
              <header className="sticky top-0 z-40 bg-transparent">
                <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-3">
                  <div className="w-8 md:w-10" /> {/* Spacer */}
                  <div className="flex items-center gap-3">
                    <img
                      src="https://i.ibb.co/35y8M1HR/vecteezy-online-store-with-smartphone-shop-concept-illustration-for-8480599.png"
                      alt="SmartHogar"
                      className="h-8 w-auto animate-[logoDepth_4.5s_ease-in-out_infinite]"
                      loading="lazy"
                    />
                    <span className="text-sm font-bold tracking-[0.35em] text-dorado gold-glow">
                      SmartHogar
                    </span>
                  </div>
                  <ThemeToggle />
                </div>
              </header>
              {children}
            </div>
          </ThemeProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
