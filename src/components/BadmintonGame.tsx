'use client';

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';

const BadmintonGame = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<any>(null);

  useEffect(() => {
    // Check orientation and pause game if in portrait mode on mobile
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

    // Listen for orientation changes
    const orientationMediaQuery = window.matchMedia('(orientation: portrait)');
    orientationMediaQuery.addEventListener('change', handleOrientationChange);

    const initGame = async () => {
      if (typeof window === 'undefined') return;
      
      const Phaser = (await import('phaser')).default;

      class BadmintonScene extends Phaser.Scene {
        private shuttlecock!: Phaser.Physics.Arcade.Image;
        private shuttlecockShadow!: Phaser.GameObjects.Ellipse;
        private gameState: 'playing' | 'missed' = 'playing';
        private lastLogTime: number = 0;
        private courtBottom!: number;
        private courtTop!: number;
        private courtNearWidth!: number;
        private courtFarWidth!: number;
        private courtCenterX!: number;
        
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

          // Court dimensions for trapezoid perspective
          this.courtBottom = height - 50;
          this.courtTop = height - 250;
          this.courtNearWidth = width * 0.9;
          this.courtFarWidth = width * 0.5;
          this.courtCenterX = width / 2;
          
          const courtBottom = this.courtBottom;
          const courtTop = this.courtTop;
          const courtNearWidth = this.courtNearWidth;
          const courtFarWidth = this.courtFarWidth;
          const courtCenterX = this.courtCenterX;
          
          // Calculate trapezoid corners
          const nearLeft = courtCenterX - courtNearWidth / 2;
          const nearRight = courtCenterX + courtNearWidth / 2;
          const farLeft = courtCenterX - courtFarWidth / 2;
          const farRight = courtCenterX + courtFarWidth / 2;

          // Create gradient court background using graphics
          const courtGraphics = this.add.graphics();
          
          // Draw trapezoid court with gradient effect
          courtGraphics.fillGradientStyle(0x2d5016, 0x2d5016, 0x3a6318, 0x3a6318, 1);
          courtGraphics.beginPath();
          courtGraphics.moveTo(nearLeft, courtBottom);
          courtGraphics.lineTo(nearRight, courtBottom);
          courtGraphics.lineTo(farRight, courtTop);
          courtGraphics.lineTo(farLeft, courtTop);
          courtGraphics.closePath();
          courtGraphics.fillPath();

          // Add court outline
          courtGraphics.lineStyle(3, 0xffffff, 1);
          courtGraphics.strokePath();

          // Add court lines
          const lineGraphics = this.add.graphics();
          lineGraphics.lineStyle(2, 0xffffff, 0.9);
          
          // Service lines (parallel to baseline)
          const serviceLine1Y = courtBottom - (courtBottom - courtTop) * 0.25;
          const serviceLine2Y = courtBottom - (courtBottom - courtTop) * 0.75;
          
          // Calculate line positions with perspective
          const getXAtY = (y: number, leftX: number, rightX: number) => {
            const t = (y - courtBottom) / (courtTop - courtBottom);
            return {
              left: nearLeft + (farLeft - nearLeft) * t,
              right: nearRight + (farRight - nearRight) * t
            };
          };
          
          // Near service line
          const service1 = getXAtY(serviceLine1Y, nearLeft, nearRight);
          lineGraphics.strokeLineShape(new Phaser.Geom.Line(service1.left, serviceLine1Y, service1.right, serviceLine1Y));
          
          // Far service line
          const service2 = getXAtY(serviceLine2Y, nearLeft, nearRight);
          lineGraphics.strokeLineShape(new Phaser.Geom.Line(service2.left, serviceLine2Y, service2.right, serviceLine2Y));
          
          // Center line
          lineGraphics.strokeLineShape(new Phaser.Geom.Line(
            (nearLeft + nearRight) / 2, courtBottom,
            (farLeft + farRight) / 2, courtTop
          ));
          
          // Singles sidelines (inner lines)
          const singlesOffset = 0.85;
          lineGraphics.strokeLineShape(new Phaser.Geom.Line(
            nearLeft + (nearRight - nearLeft) * (1 - singlesOffset) / 2, courtBottom,
            farLeft + (farRight - farLeft) * (1 - singlesOffset) / 2, courtTop
          ));
          lineGraphics.strokeLineShape(new Phaser.Geom.Line(
            nearRight - (nearRight - nearLeft) * (1 - singlesOffset) / 2, courtBottom,
            farRight - (farRight - farLeft) * (1 - singlesOffset) / 2, courtTop
          ));

          // Add net in center with perspective
          const netY = (courtBottom + courtTop) / 2;
          const netPos = getXAtY(netY, nearLeft, nearRight);
          const netGraphics = this.add.graphics();
          
          // Net posts
          netGraphics.fillStyle(0x808080, 1);
          netGraphics.fillRect(netPos.left - 3, netY - 60, 6, 65);
          netGraphics.fillRect(netPos.right - 3, netY - 60, 6, 65);
          
          // Net mesh with perspective
          netGraphics.lineStyle(1, 0xffffff, 0.8);
          const netHeight = 50;
          
          // Vertical lines
          for (let i = 0; i <= 20; i++) {
            const x = netPos.left + (netPos.right - netPos.left) * (i / 20);
            netGraphics.strokeLineShape(new Phaser.Geom.Line(x, netY, x, netY - netHeight));
          }
          
          // Horizontal lines
          for (let i = 0; i <= 5; i++) {
            const y = netY - netHeight * (i / 5);
            netGraphics.strokeLineShape(new Phaser.Geom.Line(netPos.left, y, netPos.right, y));
          }
          
          // Top tape of net
          netGraphics.lineStyle(3, 0xffffff, 1);
          netGraphics.strokeLineShape(new Phaser.Geom.Line(netPos.left, netY - netHeight, netPos.right, netY - netHeight));


          // Add shuttlecock shadow
          this.shuttlecockShadow = this.add.ellipse(width - 100, courtBottom - 10, 20, 10, 0x000000, 0.3)
            .setOrigin(0.5, 0.5);

          // Add shuttlecock as physics object
          this.shuttlecock = this.physics.add.image(width - 100, courtBottom - 100, 'shuttlecock')
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
            
            // Calculate depth-based scaling
            const depthRatio = (y - this.courtTop) / (this.courtBottom - this.courtTop);
            const scale = 0.5 + (depthRatio * 0.5); // Scale from 0.5 (far) to 1.0 (near)
            this.shuttlecock.setScale(scale);
            
            // Debug: log position periodically
            if (Math.floor(this.time.now / 1000) !== this.lastLogTime) {
              console.log('Shuttlecock position:', x, y, 'Scale:', scale.toFixed(2));
              this.lastLogTime = Math.floor(this.time.now / 1000);
            }
            
            // Check boundaries with court perspective
            const courtLeftX = this.getCourtXAtY(y).left;
            const courtRightX = this.getCourtXAtY(y).right;
            
            if (x < courtLeftX || x > courtRightX || y > this.courtBottom || y < this.courtTop - 50) {
              console.log('Boundary crossed! Position:', x, y, 'Game state:', this.gameState);
              this.gameOver();
            }
          }
        }
        
        getCourtXAtY(y: number) {
          const t = Math.max(0, Math.min(1, (y - this.courtBottom) / (this.courtTop - this.courtBottom)));
          const nearLeft = this.courtCenterX - this.courtNearWidth / 2;
          const nearRight = this.courtCenterX + this.courtNearWidth / 2;
          const farLeft = this.courtCenterX - this.courtFarWidth / 2;
          const farRight = this.courtCenterX + this.courtFarWidth / 2;
          
          return {
            left: nearLeft + (farLeft - nearLeft) * t,
            right: nearRight + (farRight - nearRight) * t
          };
        }

        serveShuttlecock() {
          // Serve from far right side of court with proper perspective
          const serveY = this.courtTop + 50;
          const courtBounds = this.getCourtXAtY(serveY);
          
          // Reset position and serve from right side
          this.shuttlecock.setPosition(courtBounds.right - 20, serveY);
          this.shuttlecock.setVelocity(-150, 80); // Adjusted for perspective
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
      // Clean up orientation listener
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