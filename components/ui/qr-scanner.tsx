'use client'

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Html5Qrcode } from "html5-qrcode"
import { Button } from "./button"
import { X } from "lucide-react"

interface QRScannerProps {
  onScan: (decodedText: string) => void
  onClose: () => void
  isOpen: boolean
}

export function QRScanner({ onScan, onClose, isOpen }: QRScannerProps) {
  const qrCodeRegionId = "qr-code-region"
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasScannedRef = useRef(false)

  const stopScanner = useCallback(() => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.stop().catch((err) => console.error(err))
      html5QrcodeScannerRef.current = null
    }
  }, [])

  const handleClose = useCallback(() => {
    stopScanner()
    onClose()
  }, [stopScanner, onClose])

  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      setError(null)
      setIsScanning(false)
      hasScannedRef.current = false
      return
    }

    // Reset states when opening
    setError(null)
    setIsScanning(false)
    hasScannedRef.current = false

    const html5QrcodeScanner = new Html5Qrcode(qrCodeRegionId)
    html5QrcodeScannerRef.current = html5QrcodeScanner

    const config = { 
      fps: 10, 
      qrbox: undefined // Pas de cadrage visuel
    }

    setIsScanning(true)

    html5QrcodeScanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Prevent multiple scans
          if (hasScannedRef.current) return
          
          // Validate decodedText
          if (!decodedText || typeof decodedText !== 'string') {
            setError("Invalid QR code")
            return
          }
          
          hasScannedRef.current = true
          setIsScanning(false)
          
          // Stop the scanner
          stopScanner()
          
          // Call the callback
          onScan(decodedText)
        },
        (errorMessage) => {
          // Only show errors if we haven't scanned yet
          if (!hasScannedRef.current) {
            console.log("QR scan error:", errorMessage)
            // Don't show parse errors as they're too frequent
            if (!errorMessage.includes("parse error")) {
              setError("Erreur de scan: " + errorMessage)
            }
          }
        }
      )
      .catch((err) => {
        console.error("Unable to start scanner:", err)
        setError("Unable to start scanner: " + err.message)
        setIsScanning(false)
      })

    return () => {
      stopScanner()
    }
  }, [isOpen, onScan, stopScanner])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 relative">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Scan QR Code</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div 
          id={qrCodeRegionId} 
          className="w-full overflow-hidden"
          style={{ 
            width: '100%',
            height: '280px',
            aspectRatio: '1 / 1',
            maxWidth: '280px',
            maxHeight: '280px',
            margin: '0 auto',
            backgroundColor: 'transparent',
            borderRadius: '0px'
          }}
        />

        {isScanning && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Point your camera at a QR code...
          </p>
        )}

        <div className="mt-4 flex justify-end">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
} 