'use client';

export default function OrientationOverlay() {
  return (
    <div className="orientation-overlay">
      <div className="orientation-content">
        <div className="phone-icon">📱</div>
        <h2>Vänd din telefon</h2>
        <p>Spelet fungerar bäst i liggande läge</p>
        <div className="rotation-hint">
          <span className="arrow">↻</span>
        </div>
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
          max-width: 300px;
        }

        .phone-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          animation: shake 1s ease-in-out infinite;
          transform-origin: center;
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

        .rotation-hint {
          margin-top: 1rem;
        }

        .arrow {
          font-size: 2rem;
          animation: rotate 2s linear infinite;
          display: inline-block;
        }

        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
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