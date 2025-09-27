'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const BadmintonGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        if (phaserGameRef.current?.scene?.isActive('BadmintonScene')) {
          if (isPortrait) {
            phaserGameRef.current.scene.pause('BadmintonScene');
          } else {
            phaserGameRef.current.scene.resume('BadmintonScene');
          }
        }
      }
    };

    const orientationMediaQuery = window.matchMedia('(orientation: portrait)');
    orientationMediaQuery.addEventListener('change', handleOrientationChange);

    const initGame = async () => {
      if (typeof window === 'undefined') return;

      const Phaser = (await import('phaser')).default;
      const { BadmintonScene } = await import('../scenes/BadmintonScene');

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: '#87CEEB',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 140 },
            debug: false
          }
        },
        scene: BadmintonScene,
        scale: {
          mode: Phaser.Scale.RESIZE,
          autoCenter: Phaser.Scale.CENTER_BOTH
        }
      };

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
      }

      phaserGameRef.current = new Phaser.Game(config);
    };

    initGame();

    return () => {
      orientationMediaQuery.removeEventListener('change', handleOrientationChange);

      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
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