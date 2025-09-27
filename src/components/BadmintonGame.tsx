'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

type PhaserGameRef = {
  scene: {
    isActive: (sceneName: string) => boolean;
    pause: (sceneName: string) => void;
    resume: (sceneName: string) => void;
  };
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
} | null;

const BadmintonGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<PhaserGameRef>(null);

  useEffect(() => {
    const shouldInitializeGame = () => {
      if (typeof window === 'undefined') return false;

      // Always initialize on desktop/tablet (width > 768px)
      if (window.innerWidth > 768) return true;

      // On mobile, only initialize if in landscape mode
      return !window.matchMedia('(orientation: portrait)').matches;
    };

    const destroyGame = () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };

    const initGame = async () => {
      if (!shouldInitializeGame()) return;

      // Destroy existing game if any
      destroyGame();

      const Phaser = (await import('phaser')).default;
      const { BadmintonScene } = await import('../scenes/BadmintonScene');

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 280 },
            debug: false
          }
        },
        scene: BadmintonScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      };

      phaserGameRef.current = new Phaser.Game(config);
    };

    const handleOrientationChange = () => {
      if (shouldInitializeGame()) {
        // Switch to landscape or desktop - initialize game
        if (!phaserGameRef.current) {
          initGame();
        }
      } else {
        // Switch to portrait on mobile - destroy game
        destroyGame();
      }
    };

    const handleResize = () => {
      // Handle window resize events
      if (phaserGameRef.current && shouldInitializeGame()) {
        // Reinitialize game with new dimensions
        initGame();
      } else if (!shouldInitializeGame()) {
        destroyGame();
      }
    };

    const orientationMediaQuery = window.matchMedia('(orientation: portrait)');
    orientationMediaQuery.addEventListener('change', handleOrientationChange);
    window.addEventListener('resize', handleResize);

    // Initial game setup
    initGame();

    return () => {
      orientationMediaQuery.removeEventListener('change', handleOrientationChange);
      window.removeEventListener('resize', handleResize);
      destroyGame();
    };
  }, []);

  return (
    <div
      ref={gameRef}
      className="w-full h-screen"
      style={{ touchAction: 'none' }}
    />
  );
};

export default dynamic(() => Promise.resolve(BadmintonGame), {
  ssr: false,
});