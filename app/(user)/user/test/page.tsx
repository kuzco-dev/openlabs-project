// src/pages/QRCodeScanner.jsx
'use client'
import React, { useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";

export default function QRCodeScanner() {
  const qrCodeRegionId = "qr-code-region";
  const html5QrcodeScannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const html5QrcodeScanner = new Html5Qrcode(qrCodeRegionId);
    html5QrcodeScannerRef.current = html5QrcodeScanner;

    const config = { fps: 10, qrbox: 250 };

    html5QrcodeScanner
      .start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // decodedText contient l'ID ou le contenu du QR code
          alert(`QR Code détecté : ${decodedText}`);
          
        },
        (errorMessage) => {
          // Optionnel : gestion des erreurs de scan
          console.log("QR scan error:", errorMessage);
        }
      )
      .catch((err) => {
        console.error("Impossible de démarrer le scanner:", err);
      });

    return () => {
      html5QrcodeScanner.stop().catch((err) => console.error(err));
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px" }}>
      <h1>Scanner un QR Code</h1>
      <div id={qrCodeRegionId} style={{ width: "300px", height: "300px" }}></div>
    </div>
  );
}
