'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const BadmintonGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);

  useEffect(() => {
    const initGame = async () => {
      if (typeof window === 'undefined') return;
      
      const Phaser = (await import('phaser')).default;

      class BadmintonScene extends Phaser.Scene {
        private shuttlecock!: Phaser.Physics.Arcade.Image;
        private gameState: 'playing' | 'missed' = 'playing';
        private lastLogTime: number = 0;
        
        constructor() {
          super({ key: 'BadmintonScene' });
        }

        preload() {
          // Create simple colored rectangles for game objects

          this.add.graphics()
            .fillStyle(0xffffff)
            .fillCircle(10, 10, 10)
            .generateTexture('shuttlecock', 20, 20);

          this.add.graphics()
            .fillStyle(0x2d5016)
            .fillRect(0, 0, 10, 10)
            .generateTexture('court', 10, 10);

          this.add.graphics()
            .fillStyle(0xffffff)
            .fillRect(0, 0, 4, 200)
            .generateTexture('net', 4, 200);
        }

        create() {
          const { width, height } = this.scale;

          // Create court background
          this.add.tileSprite(0, height - 100, width, 100, 'court')
            .setOrigin(0, 0)
            .setTint(0x228b22);

          // Add court lines
          this.add.rectangle(0, height - 100, width, 4, 0xffffff).setOrigin(0, 0);
          this.add.rectangle(0, height - 4, width, 4, 0xffffff).setOrigin(0, 0);

          // Add net in center
          const net = this.add.image(width / 2, height - 100, 'net')
            .setOrigin(0.5, 1)
            .setScale(1, 1.5);


          // Add shuttlecock as physics object
          this.shuttlecock = this.physics.add.image(width - 100, height - 300, 'shuttlecock')
            .setOrigin(0.5, 0.5);

          // Start initial serve from right side
          this.serveShuttlecock();

          // Touch/click controls with debug logging
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            console.log('Click detected at:', pointer.x, pointer.y, 'Game state:', this.gameState);
            this.hitShuttlecock();
          });

          // Manual boundary checking using update loop
          // This will check boundaries every frame

          // Instructions
          this.add.text(width / 2, 50, 'Tap to return the shuttlecock!', {
            fontSize: '16px',
            color: '#ffffff',
          }).setOrigin(0.5);
        }

        update() {
          // Check boundaries every frame
          if (this.gameState === 'playing' && this.shuttlecock) {
            const { width, height } = this.scale;
            const x = this.shuttlecock.x;
            const y = this.shuttlecock.y;
            
            // Debug: log position periodically
            if (Math.floor(this.time.now / 1000) !== this.lastLogTime) {
              console.log('Shuttlecock position:', x, y, 'Boundaries: x<0 or x>' + width + ' or y>' + height);
              this.lastLogTime = Math.floor(this.time.now / 1000);
            }
            
            // Check all boundaries
            if (x < 0 || x > width || y > height) {
              console.log('Boundary crossed! Position:', x, y, 'Game state:', this.gameState);
              this.gameOver();
            }
          }
        }

        serveShuttlecock() {
          const { width } = this.scale;
          
          // Reset position and serve from right side
          this.shuttlecock.setPosition(width - 100, 200);
          this.shuttlecock.setVelocity(-200, 30); // More forward momentum
          this.gameState = 'playing';
        }

        hitShuttlecock() {
          console.log('hitShuttlecock called, gameState:', this.gameState, 'shuttlecock x:', this.shuttlecock.x);
          
          if (this.gameState !== 'playing') {
            console.log('Game not in playing state');
            return;
          }
          
          // Temporarily remove distance check for debugging
          // if (this.shuttlecock.x > 200) return; // Too far right to hit
          
          // Apply random force for variety with more forward momentum
          const randomHorizontal = Phaser.Math.Between(180, 280);
          const randomVertical = Phaser.Math.Between(-180, -120);
          
          console.log('Applying velocity:', randomHorizontal, randomVertical);
          this.shuttlecock.setVelocity(randomHorizontal, randomVertical);
        }

        gameOver() {
          console.log('Game over triggered');
          this.gameState = 'missed';
          
          // Stop shuttlecock movement
          this.shuttlecock.setVelocity(0, 0);
          
          // Show game over message
          const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Missed! Tap to restart', {
            fontSize: '24px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);
          
          // Remove existing click listeners to prevent conflicts
          this.input.removeAllListeners('pointerdown');
          
          // Restart on next click
          this.input.once('pointerdown', () => {
            console.log('Restart clicked');
            gameOverText.destroy();
            this.serveShuttlecock();
            
            // Re-add game click listener
            this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
              console.log('Click detected at:', pointer.x, pointer.y, 'Game state:', this.gameState);
              this.hitShuttlecock();
            });
          });
        }
      }

      const config: Phaser.Types.Core.GameConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: gameRef.current!,
        backgroundColor: '#87CEEB',
        physics: {
          default: 'arcade',
          arcade: {
            gravity: { x: 0, y: 80 },
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