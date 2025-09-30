"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function Home() {
  const [showQR, setShowQR] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, []);

  return (
    <div className="min-h-screen min-w-full flex flex-col items-center justify-center bg-gradient-to-b from-background to-background/95">
      {/* Share Button */}
      <button
        onClick={() => setShowQR(true)}
        className="absolute top-4 right-4 bg-foreground text-background px-4 py-2 rounded-full font-medium text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
      >
        Dela
      </button>

      {/* QR Code Slide-in Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-sm bg-background-secondary shadow-2xl transition-transform duration-300 ease-in-out z-50 ${
          showQR ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full p-8 relative">
          <button
            onClick={() => setShowQR(false)}
            className="absolute top-4 right-4 text-foreground text-2xl font-bold hover:scale-110 transition-transform"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold mb-4 text-foreground">Dela spelet</h2>
          <p className="text-foreground/70 mb-6 text-center">
            Skanna QR-koden för att dela
          </p>

          {currentUrl && (
            <>
              <div className="bg-white p-4 rounded-lg shadow-lg mb-4">
                <QRCodeSVG value={currentUrl} size={200} />
              </div>
              <p className="text-lg text-foreground/70 text-center break-all px-4">
                {currentUrl}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      {showQR && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setShowQR(false)}
        />
      )}

      <main className="flex flex-col items-center justify-center text-center px-6 max-w-md mx-auto">
        <div className="mb-8">
          <Image
            src="/logo.png"
            alt="Sofia Spelar Badminton Logo"
            width={200}
            height={200}
            className="mb-4"
          />
        </div>

        {/* <p className="text-lg text-foreground/70 mb-8 leading-relaxed">
          En speciell bröllopspresent
          <br />
          Gjord med kärlek 💕
        </p> */}

        <Link
          href="/game"
          className="bg-foreground text-background px-8 py-4 rounded-full font-medium text-lg transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          Tryck för att spela
        </Link>
      </main>
    </div>
  );
}
