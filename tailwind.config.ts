import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // 🎨 Paleta 'Blue Depth'
        'azul-noche': '#021024',
        'azul-armada': '#052659',
        'azul-acero': '#5483B3',
        'azul-claro': '#7DA0CA',
        'azul-hielo': '#C1E8FF',

        // Mapeo semántico
        'dark-bg': '#021024',
        'dark-card': 'rgba(5, 38, 89, 0.4)',
        'dark-card-hover': 'rgba(84, 131, 179, 0.2)',

        // Alias para compatibilidad de código existente
        // Redirigimos todo lo "dorado" a tonos azules para migración instantánea
        'gold': '#C1E8FF',         // Texto dorado -> Azul hielo
        'gold-bright': '#FFFFFF',  // Brillo -> Blanco
        'gold-dark': '#5483B3',    // Sombra -> Azul acero

        'verde-lechuga': '#7DA0CA',
        'verde-neon': '#5483B3',
        'dorado': '#C1E8FF',
        'amarillo-vibrante': '#C1E8FF',

        'text-primary': '#FFFFFF',
        'text-secondary': '#7DA0CA',
        'text-muted': 'rgba(125, 160, 202, 0.6)',

        'whatsapp': '#25D366',
        'whatsapp-hover': '#128C7E',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      borderRadius: {
        'card': '20px',    // "Poquito nomas" (moderado)
        'btn': '12px',     // Rounded-xl
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(193, 232, 255, 0.4)', // Blue glow
        'card': '0 8px 32px rgba(0,0,0,0.4)',
        'card-hover': '0 12px 40px rgba(5, 38, 89, 0.5)',
      },
      animation: {
        'logoDepth': 'logoDepth 4.5s ease-in-out infinite',
      },
      backgroundImage: {
        'blue-gradient': 'radial-gradient(circle at top, #052659 0%, #021024 80%)',
        'btn-blue': 'linear-gradient(135deg, #5483B3 0%, #052659 100%)',
      },
    },
  },
  plugins: [],
}
export default config
