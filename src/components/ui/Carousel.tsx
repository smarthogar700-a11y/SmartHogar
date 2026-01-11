'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface CarouselProps {
  images: { id: number; image_url: string; link_url?: string | null }[]
  autoPlayInterval?: number
}

export default function Carousel({ images, autoPlayInterval = 5000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length === 0) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [images.length, autoPlayInterval])

  if (images.length === 0) {
    return (
      <div className="w-full aspect-video bg-dark-card rounded-card flex items-center justify-center">
        <p className="text-text-secondary">No hay banners disponibles</p>
      </div>
    )
  }

  return (
    <div className="relative w-full aspect-video rounded-card overflow-hidden">
      {images.map((img, index) => (
        <div
          key={img.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={img.image_url}
            alt={`Banner ${index + 1}`}
            fill
            className="object-cover"
            priority={index === 0}
          />
        </div>
      ))}

      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? 'bg-gold w-8' : 'bg-text-secondary'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
