'use client'

import { useState, useEffect, useRef } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'

interface Product {
  id: number
  name: string
  description: string
  price_bs: number
  image_url: string
  is_active: boolean
}

interface ShopTabProps {
  token: string
}

export default function ShopTab({ token }: ShopTabProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { showToast } = useToast()

  // Form states
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [previewImage, setPreviewImage] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchConfig()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProducts(data)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/admin/config', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setWhatsappNumber(data.whatsapp_number || '')
      }
    } catch (error) {
      console.error('Error fetching config:', error)
    }
  }

  const saveWhatsapp = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ whatsapp_number: whatsappNumber }),
      })
      if (res.ok) {
        showToast('WhatsApp guardado correctamente', 'success')
      } else {
        showToast('Error al guardar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFormName('')
    setFormDescription('')
    setFormPrice('')
    setFormImageUrl('')
    setPreviewImage('')
    setEditingProduct(null)
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const openEditForm = (product: Product) => {
    setFormName(product.name)
    setFormDescription(product.description || '')
    setFormPrice(product.price_bs.toString())
    setFormImageUrl(product.image_url)
    setPreviewImage(product.image_url)
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Mostrar preview local inmediatamente
    const localPreview = URL.createObjectURL(file)
    setPreviewImage(localPreview)

    // Subir archivo
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/admin/upload-product', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (res.ok && data.image_url) {
        setFormImageUrl(data.image_url)
        setPreviewImage(data.image_url)
        showToast('Imagen subida correctamente', 'success')
      } else {
        showToast(data.error || 'Error al subir imagen', 'error')
        setPreviewImage('')
      }
    } catch (error) {
      console.error('Error uploading:', error)
      showToast('Error al subir imagen', 'error')
      setPreviewImage('')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formName || !formPrice || !formImageUrl) {
      showToast('Nombre, precio e imagen son requeridos', 'error')
      return
    }

    setSaving(true)
    try {
      const method = editingProduct ? 'PUT' : 'POST'
      const body = editingProduct
        ? {
          id: editingProduct.id,
          name: formName,
          description: formDescription,
          price_bs: formPrice,
          image_url: formImageUrl,
        }
        : {
          name: formName,
          description: formDescription,
          price_bs: formPrice,
          image_url: formImageUrl,
        }

      const res = await fetch('/api/admin/products', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        showToast(
          editingProduct ? 'Producto actualizado' : 'Producto creado',
          'success'
        )
        resetForm()
        fetchProducts()
      } else {
        showToast('Error al guardar', 'error')
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    } finally {
      setSaving(false)
    }
  }

  const toggleProductStatus = async (product: Product) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: product.id,
          is_active: !product.is_active,
        }),
      })

      if (res.ok) {
        showToast(
          product.is_active ? 'Producto desactivado' : 'Producto activado',
          'success'
        )
        fetchProducts()
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    }
  }

  const deleteProduct = async (id: number) => {
    if (!confirm('¿Eliminar este producto permanentemente?')) return

    try {
      const res = await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        showToast('Producto eliminado', 'success')
        fetchProducts()
      }
    } catch (error) {
      showToast('Error de conexión', 'error')
    }
  }

  if (loading) {
    return <p className="text-center text-gold">Cargando...</p>
  }

  return (
    <div className="space-y-6">
      {/* Configuración WhatsApp */}
      <Card glassEffect>
        <h2 className="text-xl font-bold text-blue-bright mb-4">
          Número de WhatsApp Global
        </h2>
        <p className="text-xs text-text-secondary mb-4">
          Este número se usará para recibir los pedidos de la tienda
        </p>
        <div className="flex gap-3">
          <Input
            type="text"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="Ej: 59170000000"
            className="flex-1"
          />
          <Button variant="primary" onClick={saveWhatsapp} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </Card>

      {/* Botón agregar producto */}
      {!showForm && (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setShowForm(true)}
        >
          + Agregar Nuevo Producto
        </Button>
      )}

      {/* Formulario de producto */}
      {showForm && (
        <Card glassEffect>
          <h2 className="text-xl font-bold text-gold mb-4">
            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <div className="space-y-4">
            <Input
              label="Nombre del producto"
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Nombre del producto"
              required
            />
            <div>
              <label className="block text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
                Descripción (opcional)
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full min-h-[80px] px-4 py-3 bg-dark-card border border-blue-bright/30 rounded-btn text-text-primary focus:outline-none focus:border-blue-bright transition-all"
                placeholder="Descripción del producto"
              />
            </div>
            <Input
              label="Precio ($)"
              type="number"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              placeholder="0.00"
              required
            />

            {/* Subir imagen */}
            <div>
              <label className="block text-sm text-text-secondary uppercase tracking-wider font-light mb-2">
                Imagen del producto *
              </label>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="product-image"
                />
                <label
                  htmlFor="product-image"
                  className={`block w-full px-4 py-3 text-center border-2 border-dashed rounded-btn cursor-pointer transition-all ${uploading
                    ? 'border-gold/50 bg-gold/10'
                    : 'border-blue-bright/30 hover:border-blue-bright hover:bg-blue-bright/10'
                    }`}
                >
                  {uploading ? (
                    <span className="text-gold">Subiendo imagen...</span>
                  ) : (
                    <span className="text-text-secondary">
                      Seleccionar imagen desde el dispositivo
                    </span>
                  )}
                </label>

                {previewImage && (
                  <div className="w-full h-40 bg-dark-card rounded-card overflow-hidden relative">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/200x200?text=Error'
                      }}
                    />
                    {formImageUrl && (
                      <div className="absolute bottom-2 right-2 bg-green-500/80 text-white text-xs px-2 py-1 rounded">
                        Subida correctamente
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSubmit}
                disabled={saving || uploading}
              >
                {saving
                  ? 'Guardando...'
                  : editingProduct
                    ? 'Actualizar'
                    : 'Crear Producto'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={resetForm}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de productos */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gold">
          Productos ({products.length})
        </h2>
        {products.length === 0 ? (
          <Card>
            <p className="text-center text-text-secondary">
              No hay productos registrados
            </p>
          </Card>
        ) : (
          products.map((product) => (
            <Card key={product.id} glassEffect>
              <div className="space-y-3">
                {/* Imagen y info básica */}
                <div className="flex gap-3 items-start">
                  <div className="w-20 h-20 bg-dark-card rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://via.placeholder.com/100x100?text=Error'
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-text-primary text-sm">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="text-sm mt-2">
                      <span className="text-gold font-bold">
                        $ {product.price_bs.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Estado - fila separada */}
                <div className="flex justify-center">
                  <span
                    className={`text-xs px-4 py-1.5 rounded-full ${product.is_active
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                  >
                    {product.is_active ? '✓ Activo' : '✗ Inactivo'}
                  </span>
                </div>

                {/* Botones - fila separada, grid para móvil */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    className="text-xs py-2"
                    onClick={() => openEditForm(product)}
                  >
                    ✏️ Editar
                  </Button>
                  <Button
                    variant={product.is_active ? 'secondary' : 'primary'}
                    className="text-xs py-2"
                    onClick={() => toggleProductStatus(product)}
                  >
                    {product.is_active ? '🔒' : '✅'}
                  </Button>
                  <Button
                    variant="outline"
                    className="text-xs py-2 text-red-400 border-red-500 hover:bg-red-500/10"
                    onClick={() => deleteProduct(product.id)}
                  >
                    🗑️ Borrar
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
