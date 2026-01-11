interface CardProps {
  children: React.ReactNode
  className?: string
  glassEffect?: boolean
}

export default function Card({ children, className = '', glassEffect = false }: CardProps) {
  return (
    <div
      className={`rounded-card p-6 ${
        glassEffect ? 'glass-effect' : 'bg-dark-card'
      } shadow-card ${className}`}
    >
      {children}
    </div>
  )
}
