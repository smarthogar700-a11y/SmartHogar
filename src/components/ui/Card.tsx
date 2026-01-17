'use client'

interface CardProps {
  children: React.ReactNode
  className?: string
  glassEffect?: boolean
  animated?: boolean
}

export default function Card({ children, className = '', glassEffect = false, animated = true }: CardProps) {
  return (
    <div
      className={`
        relative overflow-hidden p-6
        bg-[rgba(5,38,89,0.4)] border border-[rgba(84,131,179,0.3)]
        shadow-[0_8px_32px_rgba(0,0,0,0.5)] transition-all duration-300 rounded-[20px]
        hover:border-[#7DA0CA] hover:shadow-[0_10px_40px_rgba(5,38,89,0.6)]
        backdrop-blur-md
        ${className}
      `}
    >
      {/* Cool blue glow on hover */}
      {animated && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[rgba(193,232,255,0.05)] to-transparent opacity-50 pointer-events-none"
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
