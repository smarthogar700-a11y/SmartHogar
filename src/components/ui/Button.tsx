import { ButtonHTMLAttributes } from 'react'

// Icono SVG inline para evitar dependencia de lucide-react
const LoaderIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" />
  </svg>
)

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'whatsapp'
  isLoading?: boolean
}

export default function Button({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'px-6 py-3 font-semibold font-inter transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm transform active:scale-95 rounded-xl'

  const variants = {
    primary: 'bg-gradient-to-r from-[#2979FF] via-[#00E5FF] to-[#2979FF] bg-[length:200%_auto] animate-[shine-blue_3s_ease-in-out_infinite,pulse_2s_ease-in-out_infinite] text-white font-bold shadow-[0_0_20px_rgba(41,121,255,0.6)] hover:brightness-125 border border-[#80D8FF] hover:animate-[shine-blue_1s_infinite]',
    secondary: 'bg-[rgba(5,38,89,0.3)] border border-[#5483B3] text-[#C1E8FF] hover:bg-[rgba(5,38,89,0.5)]',
    outline: 'border border-[#5483B3] text-[#7DA0CA] hover:bg-[#5483B3]/10 hover:text-white',
    whatsapp: 'bg-whatsapp hover:bg-whatsapp-hover text-white shadow-md hover:shadow-lg border border-whatsapp-hover rounded-xl animate-[pulse-electric_2s_infinite]'
  }

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className} flex items-center justify-center gap-2`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading && <LoaderIcon className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
