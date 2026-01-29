'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'

interface TikTokTasksData {
  has_vip: boolean
  tasks_completed: number
  total_earned: number
  next_task: string | null
  is_complete: boolean
}

const TASK_LABELS: Record<string, string> = {
  FOLLOW: 'Seguir la cuenta de TikTok',
  LIKE: 'Dar like a un video',
  COMMENT: 'Dejar un comentario positivo',
  SHARE: 'Compartir un video',
}

const TASK_ICONS: Record<string, string> = {
  FOLLOW: '👤',
  LIKE: '❤️',
  COMMENT: '💬',
  SHARE: '🔄',
}

const TIKTOK_URL = 'https://www.tiktok.com/@smarthogar.bo?_r=1&_t=ZS-93MA0fDcP4s'

export default function TikTokTasks() {
  const [data, setData] = useState<TikTokTasksData | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) return

      const res = await fetch('/api/user/tiktok-tasks', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error('Error fetching TikTok tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('La imagen no debe superar 5MB', 'error')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async () => {
    if (!selectedFile || !data?.next_task) return

    setUploading(true)
    try {
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('auth_token='))
        ?.split('=')[1]

      if (!token) {
        showToast('Sesión expirada', 'error')
        return
      }

      // Subir imagen
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (!uploadRes.ok) {
        showToast('Error al subir imagen', 'error')
        return
      }

      const { url } = await uploadRes.json()

      // Enviar tarea
      const res = await fetch('/api/user/tiktok-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          screenshot_url: url,
          task_type: data.next_task,
        }),
      })

      const result = await res.json()

      if (res.ok) {
        showToast(result.message || '+Bs 2.50 acumulados', 'success')
        setSelectedFile(null)
        // Limpiar input file
        const fileInput = document.getElementById('tiktok-screenshot') as HTMLInputElement
        if (fileInput) fileInput.value = ''
        fetchTasks()
      } else {
        showToast(result.error || 'Error al enviar tarea', 'error')
      }
    } catch (error) {
      console.error('Error submitting task:', error)
      showToast('Error al enviar tarea', 'error')
    } finally {
      setUploading(false)
    }
  }

  // No mostrar si tiene VIP o está cargando
  if (loading) return null
  if (!data || data.has_vip) return null

  // Si completó todas las tareas, mostrar mensaje de felicitaciones
  if (data.is_complete) {
    return (
      <Card glassEffect className="border-2 border-gold/50 bg-gradient-to-br from-gold/10 to-gold/5">
        <div className="text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h3 className="text-xl font-bold text-gold">¡Felicidades!</h3>
          <p className="text-text-secondary text-sm">
            ¡Ya tienes <span className="text-gold font-bold">Bs {data.total_earned.toFixed(2)}</span> en tu billetera!
          </p>
          <div className="bg-dark-card rounded-lg p-4 border border-gold/30">
            <p className="text-text-primary text-sm leading-relaxed">
              <span className="text-gold font-bold">Actívate con cualquier plan VIP</span> para poder retirar tus ganancias
              y ganar el porcentaje adicional según el VIP adquirido.
            </p>
          </div>
          <Button
            variant="primary"
            className="w-full bg-gradient-to-r from-gold to-gold-bright"
            onClick={() => window.location.href = '/paks'}
          >
            Ver Planes VIP
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card glassEffect className="border border-[#00f2fe]/30 bg-gradient-to-br from-[#00f2fe]/5 to-[#4facfe]/5">
      <div className="space-y-4">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🎵</span>
            <h3 className="text-lg font-bold text-[#00f2fe]">Gana con TikTok</h3>
          </div>
          <p className="text-text-secondary text-sm">
            ¡Completa tareas sencillas en TikTok y acumula hasta <span className="text-gold font-bold">Bs 10</span>!
          </p>
        </div>

        {/* Progreso */}
        <div className="bg-dark-card rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-text-secondary">Progreso</span>
            <span className="text-sm font-bold text-gold">
              Bs {data.total_earned.toFixed(2)} / Bs 10.00
            </span>
          </div>
          <div className="w-full bg-dark-bg rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#00f2fe] to-[#4facfe] h-2 rounded-full transition-all duration-500"
              style={{ width: `${(data.total_earned / 10) * 100}%` }}
            />
          </div>
          <p className="text-xs text-text-secondary mt-1 text-center">
            {data.tasks_completed}/4 tareas completadas
          </p>
        </div>

        {/* Tarea actual */}
        {data.next_task && (
          <div className="bg-dark-card rounded-lg p-4 border border-[#00f2fe]/20">
            <p className="text-xs text-text-secondary uppercase tracking-wider mb-2">
              Tarea actual (+Bs 2.50)
            </p>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{TASK_ICONS[data.next_task]}</span>
              <div>
                <p className="text-text-primary font-medium">
                  {TASK_LABELS[data.next_task]}
                </p>
                <p className="text-xs text-text-secondary">
                  Sube una captura de pantalla como prueba
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Área de carga */}
        <div className="space-y-3">
          <div className="border-2 border-dashed border-[#00f2fe]/30 rounded-lg p-4 text-center">
            <input
              id="tiktok-screenshot"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="tiktok-screenshot"
              className="cursor-pointer block"
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <span className="text-3xl">📷</span>
                  <p className="text-sm text-green-400">{selectedFile.name}</p>
                  <p className="text-xs text-text-secondary">Toca para cambiar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-3xl">📤</span>
                  <p className="text-sm text-text-secondary">
                    Toca para subir captura
                  </p>
                  <p className="text-xs text-text-secondary">
                    PNG, JPG hasta 5MB
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-[#00f2fe] text-[#00f2fe] hover:bg-[#00f2fe]/10"
              onClick={() => window.open(TIKTOK_URL, '_blank')}
            >
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
                TikTok
              </span>
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-gradient-to-r from-[#00f2fe] to-[#4facfe]"
              onClick={handleSubmit}
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="space-y-2">
          <p className="text-xs text-text-secondary uppercase tracking-wider">
            Tareas por completar:
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(['FOLLOW', 'LIKE', 'COMMENT', 'SHARE'] as const).map((task) => {
              const isCompleted = data.tasks_completed > ['FOLLOW', 'LIKE', 'COMMENT', 'SHARE'].indexOf(task)
              const isCurrent = data.next_task === task
              return (
                <div
                  key={task}
                  className={`flex items-center gap-2 p-2 rounded-lg text-xs ${
                    isCompleted
                      ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                      : isCurrent
                      ? 'bg-[#00f2fe]/10 border border-[#00f2fe]/30 text-[#00f2fe]'
                      : 'bg-dark-card text-text-secondary'
                  }`}
                >
                  <span>{isCompleted ? '✓' : TASK_ICONS[task]}</span>
                  <span className="truncate">{TASK_LABELS[task].split(' ').slice(0, 2).join(' ')}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Card>
  )
}
