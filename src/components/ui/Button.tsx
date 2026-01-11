import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  children: React.ReactNode
}

export default function Button({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'px-6 py-3 rounded-btn font-medium font-montserrat transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-gold hover:bg-gold-bright text-dark-bg shadow-gold-glow hover:shadow-lg',
    secondary: 'bg-dark-card hover:bg-opacity-80 text-text-primary border border-gold',
    outline: 'border-2 border-gold text-gold hover:bg-gold hover:text-dark-bg'
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
