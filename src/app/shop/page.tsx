'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import BottomNav from '@/components/ui/BottomNav'
import { useToast } from '@/components/ui/Toast'
import ScreenshotProtection from '@/components/ui/ScreenshotProtection'

interface Product {
  id: number
  name: string
  description: string
  price_bs: number
  image_url: string
}

interface CartItem {
  product: Product
  quantity: number
}

// Pool de reseñas predefinidas
const allReviews = [
  { name: 'María G.', rating: 5, comment: 'Excelente!', date: '15 ene' },
  { name: 'Carlos R.', rating: 5, comment: 'Muy buena calidad', date: '12 ene' },
  { name: 'Ana P.', rating: 4, comment: 'Llegó rápido', date: '10 ene' },
  { name: 'José M.', rating: 5, comment: 'Mejor precio', date: '8 ene' },
  { name: 'Laura S.', rating: 5, comment: '100% recomendado', date: '5 ene' },
  { name: 'Pedro L.', rating: 4, comment: 'Buen producto', date: '3 ene' },
  { name: 'Sofia T.', rating: 5, comment: 'Me encantó!', date: '1 ene' },
  { name: 'Miguel A.', rating: 5, comment: 'Super rápido', date: '28 dic' },
  { name: 'Carmen V.', rating: 5, comment: 'Tal cual foto', date: '25 dic' },
  { name: 'Roberto D.', rating: 5, comment: 'Volveré a comprar', date: '22 dic' },
  { name: 'Elena F.', rating: 4, comment: 'Muy profesional', date: '20 dic' },
  { name: 'Diego H.', rating: 5, comment: 'Buen empaque', date: '18 dic' },
  { name: 'Lucia M.', rating: 5, comment: 'Original 100%', date: '15 dic' },
  { name: 'Andrés P.', rating: 4, comment: 'Cumple bien', date: '12 dic' },
  { name: 'Rosa T.', rating: 5, comment: 'Excelente vendedor', date: '10 dic' },
  { name: 'Fernando S.', rating: 5, comment: 'Lo amo!', date: '8 dic' },
  { name: 'Patricia V.', rating: 5, comment: 'Perfecto estado', date: '5 dic' },
  { name: 'Jorge L.', rating: 4, comment: 'Buena compra', date: '3 dic' },
  { name: 'Mónica R.', rating: 5, comment: 'Súper contenta', date: '1 dic' },
  { name: 'Ricardo B.', rating: 5, comment: 'A+++', date: '28 nov' },
]

// Función para obtener múltiples reseñas basadas en el ID del producto
const getProductReviews = (productId: number) => {
  const startIndex = (productId * 3) % allReviews.length
  const reviewCount = 3 + (productId % 3) // 3 a 5 reseñas por producto
  const reviews = []
  for (let i = 0; i < reviewCount; i++) {
    reviews.push(allReviews[(startIndex + i) % allReviews.length])
  }
  return reviews
}

// Calcular rating promedio
const getAverageRating = (reviews: typeof allReviews) => {
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return (sum / reviews.length).toFixed(1)
}

// Componente de estrellas pequeñas
const StarRating = ({ rating, size = 'xs' }: { rating: number, size?: 'xs' | 'sm' }) => {
  const sizeClass = size === 'xs' ? 'text-[8px]' : 'text-[10px]'
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`${sizeClass} ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [quantities, setQuantities] = useState<Record<number, number>>({})
  const { showToast } = useToast()

  // Form de pedido
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setWhatsappNumber(data.whatsapp_number || '')
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getQuantity = (productId: number) => {
    return quantities[productId] || 1
  }

  const setQuantity = (productId: number, qty: number) => {
    if (qty < 1) qty = 1
    if (qty > 99) qty = 99
    setQuantities({ ...quantities, [productId]: qty })
  }

  const addToCart = (product: Product) => {
    const qty = getQuantity(product.id)
    const existingIndex = cart.findIndex((item) => item.product.id === product.id)

    if (existingIndex >= 0) {
      const newCart = [...cart]
      newCart[existingIndex].quantity += qty
      setCart(newCart)
    } else {
      setCart([...cart, { product, quantity: qty }])
    }

    showToast(`${product.name} agregado al carrito`, 'success')
    setQuantities({ ...quantities, [product.id]: 1 })
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const updateCartQuantity = (productId: number, qty: number) => {
    if (qty < 1) {
      removeFromCart(productId)
      return
    }
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    )
  }

  const getCartTotal = () => {
    return cart.reduce(
      (total, item) => total + item.product.price_bs * item.quantity,
      0
    )
  }

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0)
  }

  const sendOrder = () => {
    if (!customerName || !customerPhone || !customerAddress) {
      showToast('Completa todos los campos requeridos', 'error')
      return
    }

    if (cart.length === 0) {
      showToast('El carrito está vacío', 'error')
      return
    }

    if (!whatsappNumber) {
      showToast('No hay número de WhatsApp configurado', 'error')
      return
    }

    // Construir mensaje de WhatsApp
    let message = `🛒 *DETALLES DE MI PEDIDO*\n\n`
    message += `👤 *Mi nombre es:* ${customerName}\n`
    message += `📱 *Mi número de teléfono es:* ${customerPhone}\n`
    message += `📍 *Mi dirección de entrega es:* ${customerAddress}\n`
    if (customerNotes) {
      message += `📝 *Notas:* ${customerNotes}\n`
    }
    message += `\n━━━━━━━━━━━━━━━━━━\n`
    message += `📦 *PRODUCTOS:*\n\n`

    cart.forEach((item) => {
      const subtotal = item.product.price_bs * item.quantity
      message += `• ${item.product.name}\n`
      message += `  Cantidad: ${item.quantity} x $ ${item.product.price_bs.toFixed(2)}\n`
      message += `  Subtotal: $ ${subtotal.toFixed(2)}\n\n`
    })

    message += `━━━━━━━━━━━━━━━━━━\n`
    message += `💰 *TOTAL: $ ${getCartTotal().toFixed(2)}*`

    // Limpiar número de WhatsApp
    const cleanNumber = whatsappNumber.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`

    // Abrir WhatsApp
    window.open(whatsappUrl, '_blank')

    // Limpiar carrito y formulario
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setCustomerAddress('')
    setCustomerNotes('')
    setShowCart(false)
    showToast('Pedido enviado por WhatsApp', 'success')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20">
        <p className="text-gold text-xl">Cargando tienda...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20">
      <ScreenshotProtection />
      <div className="max-w-screen-xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gold">Tienda</h1>
          <p className="mt-1 text-text-secondary uppercase tracking-wider text-xs font-light">
            Productos disponibles
          </p>
        </div>

        {/* Botón de carrito flotante */}
        {cart.length > 0 && !showCart && (
          <div className="fixed top-20 right-4 z-40 animate-bounce-slow">
            <button
              onClick={() => setShowCart(true)}
              className="group bg-gradient-to-r from-blue-800 to-emerald-600 border border-gold/30 text-white px-5 py-3 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center gap-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
            >
              <div className="relative">
                <span className="text-xl group-hover:rotate-12 transition-transform duration-300 drop-shadow-md">🛒</span>
                <span className="absolute -top-2 -right-2 bg-red-600 border border-black text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {getCartCount()}
                </span>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-light uppercase tracking-widest text-gold/90 mb-0.5 drop-shadow-sm">
                  Ver mi pedido
                </span>
                <span className="text-xs font-bold text-green-400 font-mono tracking-wide drop-shadow-md">
                  $ {getCartTotal().toFixed(2)}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Vista del carrito */}
        {showCart && (
          <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
            <div className="max-w-lg mx-auto p-4 pb-24">
              <Card glassEffect>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gold">🛒 Mi Carrito</h2>
                  <button
                    onClick={() => setShowCart(false)}
                    className="text-text-secondary hover:text-gold text-lg"
                  >
                    ✕
                  </button>
                </div>

                {cart.length === 0 ? (
                  <p className="text-center text-text-secondary py-8 text-sm">
                    El carrito está vacío
                  </p>
                ) : (
                  <>
                    {/* Productos en carrito */}
                    <div className="space-y-4 mb-6">
                      {cart.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex gap-3 border-b border-gold/20 pb-4"
                        >
                          <div className="w-14 h-14 bg-dark-card rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.product.image_url}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-text-primary text-xs">
                              {item.product.name}
                            </h4>
                            <p className="text-gold text-xs">
                              $ {item.product.price_bs.toFixed(2)}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.product.id, item.quantity - 1)
                                }
                                className="w-6 h-6 bg-dark-card rounded text-text-primary text-xs"
                              >
                                -
                              </button>
                              <span className="text-text-primary w-6 text-center text-xs">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateCartQuantity(item.product.id, item.quantity + 1)
                                }
                                className="w-6 h-6 bg-dark-card rounded text-text-primary text-xs"
                              >
                                +
                              </button>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="ml-2 text-red-400 text-[10px]"
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gold text-sm">
                              $ {(item.product.price_bs * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Total */}
                    <div className="bg-dark-card rounded-lg p-3 mb-6 border border-gold/10">
                      <div className="flex justify-between text-lg font-bold">
                        <span className="text-text-primary">Total:</span>
                        <span className="text-gold">
                          $ {getCartTotal().toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Formulario de datos */}
                    <div className="space-y-3 mb-6">
                      <h3 className="text-base font-bold text-gold">
                        Datos de entrega
                      </h3>
                      <Input
                        label="Nombre completo *"
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                      />
                      <Input
                        label="Teléfono *"
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Tu número de teléfono"
                        required
                      />
                      <Input
                        label="Dirección de entrega *"
                        type="text"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Dirección completa"
                        required
                      />
                      <div>
                        <label className="block text-xs text-text-secondary uppercase tracking-wider font-light mb-1">
                          Notas adicionales (opcional)
                        </label>
                        <textarea
                          value={customerNotes}
                          onChange={(e) => setCustomerNotes(e.target.value)}
                          className="w-full min-h-[60px] px-3 py-2 bg-dark-card border border-gold/30 rounded-btn text-text-primary focus:outline-none focus:border-gold transition-all text-sm"
                          placeholder="Instrucciones especiales..."
                        />
                      </div>
                    </div>

                    {/* Botón de pedido */}
                    <Button
                      variant="whatsapp"
                      className="w-full text-base py-3 font-bold"
                      onClick={sendOrder}
                    >
                      📱 Hacer Pedido por WhatsApp
                    </Button>
                  </>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* Grilla de productos */}
        {products.length === 0 ? (
          <Card>
            <p className="text-center text-text-secondary text-sm">
              No hay productos disponibles
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 justify-items-center">
            {products.map((product) => (
              <Card key={product.id} glassEffect className="p-2 w-full max-w-[180px]">
                <div className="space-y-2">
                  {/* Imagen */}
                  <div className="aspect-square bg-white rounded-md overflow-hidden relative group flex items-center justify-center p-2">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/200x200?text=Producto'
                      }}
                    />
                  </div>

                  {/* Info con rating integrado */}
                  <div>
                    <h3 className="font-bold text-text-primary text-xs line-clamp-2 min-h-[32px]">
                      {product.name}
                    </h3>
                    <p className="text-gold font-bold text-sm">
                      $ {product.price_bs.toFixed(2)}
                    </p>
                    {/* Rating y reseñas pegados al precio */}
                    {(() => {
                      const reviews = getProductReviews(product.id)
                      const avgRating = getAverageRating(reviews)
                      const totalReviews = 50 + (product.id * 7) % 200
                      const repeatedReviews = [...reviews, ...reviews, ...reviews, ...reviews]
                      return (
                        <>
                          <div className="flex items-center gap-0.5 -mt-0.5 leading-none">
                            <StarRating rating={Math.round(Number(avgRating))} size="sm" />
                            <span className="text-[6px] text-yellow-400">{avgRating}</span>
                            <span className="text-[5px] text-text-secondary">({totalReviews})</span>
                          </div>
                          <div className="overflow-hidden -mt-1 leading-none">
                            <div className="inline-flex animate-marquee-slower whitespace-nowrap">
                              {repeatedReviews.map((review, idx) => (
                                <span key={idx} className="text-[5px] text-text-secondary/60 mx-1">
                                  {review.name.split(' ')[0]}: {review.comment}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      )
                    })()}
                  </div>

                  {/* Cantidad */}
                  <div className="flex items-center justify-center gap-1.5 bg-dark-bg/50 rounded p-1">
                    <button
                      onClick={() =>
                        setQuantity(product.id, getQuantity(product.id) - 1)
                      }
                      className="w-6 h-6 bg-dark-card border border-gold/20 rounded text-text-primary text-xs hover:border-gold"
                    >
                      -
                    </button>
                    <span className="text-text-primary w-6 text-center font-bold text-xs">
                      {getQuantity(product.id)}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity(product.id, getQuantity(product.id) + 1)
                      }
                      className="w-6 h-6 bg-dark-card border border-gold/20 rounded text-text-primary text-xs hover:border-gold"
                    >
                      +
                    </button>
                  </div>

                  {/* Botón agregar */}
                  <Button
                    variant="primary"
                    className="w-full text-[10px] py-1.5 h-auto min-h-[30px] px-1 leading-tight whitespace-normal bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 border-none shadow-[0_0_10px_rgba(16,185,129,0.4)] text-white hover:brightness-110"
                    onClick={() => addToCart(product)}
                  >
                    Agregar al carrito
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <p className="mt-8 text-[10px] text-text-secondary text-center opacity-60">
          © 2026 SmartHogar. Todos los derechos reservados por SmartHogar.
        </p>
      </div>

      <BottomNav />
    </div>
  )
}
