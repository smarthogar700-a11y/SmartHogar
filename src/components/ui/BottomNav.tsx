'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/home', label: 'Home', icon: '🏠' },
    { href: '/paks', label: 'Paks', icon: '💎' },
    { href: '/my-purchases', label: 'Mis Compras', icon: '👑' },
    { href: '/tables', label: 'Tabla de Ganancia', icon: '📊' },
    { href: '/shop', label: 'Tienda', icon: '🛒' },
    { href: '/network', label: 'Red', icon: '🌐' },
    { href: '/withdrawals', label: 'Billetera', icon: '💰' },
    { href: '/chat', label: 'Soporte', icon: '💬' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#021024]/95 backdrop-blur-md z-50 transition-colors duration-300 rounded-t-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-all duration-300 ${isActive
                ? 'text-[#C1E8FF]'
                : 'text-[#5483B3]/60 hover:text-[#C1E8FF]'
                }`}
            >
              {/* Indicator removed */}
              <span className={`text-xl ${isActive ? 'scale-110 drop-shadow-[0_0_8px_rgba(193,232,255,0.5)]' : ''} transition-transform`}>{item.icon}</span>
              <span className="text-[5px] font-medium tracking-tight uppercase text-center mt-0.5">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
