'use client'

import React, { useRef } from 'react'
import QRCode from 'react-qr-code'
import { Button } from './button'
import { Download } from 'lucide-react'

interface QRCodeComponentProps {
  value: string
  size?: number
  title?: string
  showDownload?: boolean
}

export function QRCodeComponent({ 
  value, 
  size = 256, 
  title = "QR Code",
  showDownload = true 
}: QRCodeComponentProps) {
  const qrRef = useRef<HTMLDivElement>(null)

  const downloadQRCode = () => {
    if (!qrRef.current) return

    const svg = qrRef.current.querySelector('svg')
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    // Ajouter un padding uniforme pour le téléchargement
    const padding = 32
    const qrSize = size - padding
    canvas.width = size
    canvas.height = size

    img.onload = () => {
      if (ctx) {
        // Remplir le fond en blanc
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, size, size)
        
        // Centrer le QR code avec le padding uniforme
        const offsetX = padding / 2
        const offsetY = padding / 2
        ctx.drawImage(img, offsetX, offsetY, qrSize, qrSize)
        
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = `qr-code-${value}.png`
        downloadLink.href = pngFile
        downloadLink.click()
      }
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
  }

  return (
    <div className="flex flex-col items-center space-y-4 p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div 
        ref={qrRef}
        className="bg-white p-4 rounded-lg shadow-sm border"
        style={{ width: size, height: size }}
      >
        <QRCode
          value={value}
          size={size - 32} // Subtract padding
          level="M"
          fgColor="#000000"
          bgColor="#FFFFFF"
        />
      </div>
      {showDownload && (
        <Button 
          onClick={downloadQRCode}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download QR Code
        </Button>
      )}
      <p className="text-sm text-gray-600 text-center">
        ID: {value}
      </p>
    </div>
  )
} 