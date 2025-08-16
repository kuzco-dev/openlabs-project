// src/pages/QRCodePage.jsx
'use client'
import React from "react";
import QRCode from "react-qr-code";

export default function Page() {
  // Ton matériel
  const materiel = {
    id: "6282f6a1-f505-4818-b88a-74eeadbc82e4",
    name: "Multimeter",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "50px" }}>
      <h1>QR Code du matériel</h1>
      <p>{materiel.name}</p>

      {/* Génération du QR code avec uniquement l'ID */}
      <QRCode value={materiel.id} size={256} />

      <p>ID : {materiel.id}</p>
    </div>
  );
}
