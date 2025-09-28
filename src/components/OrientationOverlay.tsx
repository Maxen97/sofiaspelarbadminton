'use client';

export default function OrientationOverlay() {
  return (
    <div className="orientation-overlay">
      <div className="orientation-content">
        <div className="phone-transition">
          <div className="phone portrait">
            <div className="phone-screen"></div>
          </div>
          <div className="arrow">→</div>
          <div className="phone landscape">
            <div className="phone-screen"></div>
          </div>
        </div>
        <h2>Vänd din telefon</h2>
        <p>Spelet fungerar bäst i liggande läge</p>
      </div>
      
      <style jsx>{`
        .orientation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.95);
          display: none;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          color: white;
          text-align: center;
        }

        .orientation-content {
          padding: 2rem;
          max-width: 350px;
        }

        .phone-transition {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .phone {
          border: 3px solid white;
          border-radius: 12px;
          position: relative;
          background: #333;
        }

        .phone.portrait {
          width: 50px;
          height: 80px;
        }

        .phone.landscape {
          width: 80px;
          height: 50px;
        }

        .phone-screen {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          bottom: 8px;
          background: #1a1a1a;
          border-radius: 6px;
        }

        .arrow {
          font-size: 2rem;
          color: white;
          animation: slide-bounce 2s ease-in-out infinite;
        }

        .orientation-content h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .orientation-content p {
          font-size: 1rem;
          margin-bottom: 1.5rem;
          opacity: 0.8;
        }

        @keyframes slide-bounce {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.8;
          }
          50% {
            transform: translateX(8px);
            opacity: 1;
          }
        }

        /* Show overlay only on mobile devices in portrait mode */
        @media (orientation: portrait) and (max-width: 768px) {
          .orientation-overlay {
            display: flex;
          }
        }

        /* Hide on landscape or desktop */
        @media (orientation: landscape), (min-width: 769px) {
          .orientation-overlay {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}