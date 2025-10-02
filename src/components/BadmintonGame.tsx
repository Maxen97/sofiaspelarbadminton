'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CharacterSelection } from '@/utils/characterOptions';
import { GameScore } from '@/types/GameTypes';

type PhaserGameRef = {
  scene: {
    isActive: (sceneName: string) => boolean;
    pause: (sceneName: string) => void;
    resume: (sceneName: string) => void;
  };
  destroy: (removeCanvas: boolean, noReturn?: boolean) => void;
} | null;

interface BadmintonGameProps {
  characterSelection: CharacterSelection;
  onGameReady?: () => void;
}

const BadmintonGame = ({ characterSelection, onGameReady }: BadmintonGameProps) => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<PhaserGameRef>(null);
  const [score, setScore] = useState<GameScore>({ player: 0, computer: 0 });

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
        scene: new BadmintonScene(characterSelection, setScore, onGameReady),
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
  }, [characterSelection]);

  return (
    <div className="relative w-full h-screen">
      <div
        ref={gameRef}
        className="w-full h-screen"
        style={{ touchAction: 'none' }}
      />
      {/* Scoreboard overlay */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
        <div className="bg-gradient-to-b from-blue-900/90 to-blue-800/90 rounded-b-2xl shadow-lg px-8 py-3 border-b-4 border-blue-700">
          <div className="flex items-center gap-8">
            <div className="text-center">
              <div className="text-white/70 text-sm font-medium mb-1">Du</div>
              <div className="text-white text-3xl font-bold tabular-nums">{score.player}</div>
            </div>
            <div className="text-white/50 text-2xl font-light">-</div>
            <div className="text-center">
              <div className="text-white/70 text-sm font-medium mb-1">{characterSelection.computer.displayName}</div>
              <div className="text-white text-3xl font-bold tabular-nums">{score.computer}</div>
            </div>
          </div>
        </div>
      </div>
      {/* Menu button */}
      <div className="absolute top-0 right-0 z-10">
        <Link href="/" className="block bg-gradient-to-b from-blue-900/90 to-blue-800/90 rounded-bl-2xl shadow-lg px-8 py-3 border-b-4 border-l-4 border-blue-700 pointer-events-auto">
          <div className="text-white text-2xl font-bold">Menu</div>
        </Link>
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(BadmintonGame), {
  ssr: false,
});