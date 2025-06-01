'use client'

import { SignupForm } from "@/components/signup-form";
import { GalleryVerticalEnd } from "lucide-react"
import Image from 'next/image'
import { useState, useEffect } from 'react'

const images = [
    '/laptop.png',
    '/smartphone.png',
  ]

export default function Page() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length)
    }, 5000) // Change l'image toutes les 5 secondes

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <div className="flex items-center gap-2 font-medium">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <GalleryVerticalEnd className="size-4" />
            </div>
            OpenLabs
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        {images.map((src, index) => (
          <Image
            key={src}
            src={src}
            alt={`Lab Image ${index + 1}`}
            fill
            style={{
              objectFit: 'cover',
              transition: 'opacity 1s ease-in-out',
              opacity: index === currentImageIndex ? 1 : 0,
            }}
            className="absolute inset-0"
          />
        ))}
      </div>
    </div>
  );
}
