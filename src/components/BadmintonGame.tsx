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

        // Swipe tracking variables
        private swipeStartPos: { x: number; y: number } | null = null;
        private swipeStartTime: number = 0;
        private isSwipingActive: boolean = false;
        private swipeTrail: Phaser.GameObjects.Graphics | null = null;

        // Air resistance for realistic shuttlecock physics
        private airResistanceCoefficient: number = 0.025;
        
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

          // Add vertical net with perspective
          const netGraphics = this.add.graphics();
          
          // Net posts - vertical configuration with offset for depth
          const topPostX = courtCenterX - 10; // Left offset for top post
          const bottomPostX = courtCenterX + 10; // Right offset for bottom post
          
          netGraphics.fillStyle(0x808080, 1);
          // Top post (at top center, shifted left)
          netGraphics.fillRect(topPostX - 3, courtTop - 5, 6, 65);
          // Bottom post (at bottom center, shifted right)
          netGraphics.fillRect(bottomPostX - 3, courtBottom - 60, 6, 65);
          
          // Net mesh spanning vertically between posts
          netGraphics.lineStyle(1, 0xffffff, 0.8);
          const netWidth = 50; // Width of the net mesh
          
          // Vertical lines running from top to bottom
          for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const x1 = topPostX + (bottomPostX - topPostX) * t;
            const y1 = courtTop + (courtBottom - courtTop) * t;
            const x2 = x1 - netWidth;
            netGraphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y1));
          }
          
          // Horizontal lines across the net
          for (let i = 0; i <= 5; i++) {
            const xOffset = netWidth * (i / 5);
            netGraphics.strokeLineShape(new Phaser.Geom.Line(
              topPostX - xOffset, courtTop,
              bottomPostX - xOffset, courtBottom
            ));
          }
          
          // Side tape of net (along the posts)
          netGraphics.lineStyle(3, 0xffffff, 1);
          netGraphics.strokeLineShape(new Phaser.Geom.Line(topPostX, courtTop, bottomPostX, courtBottom));



          // Add shuttlecock as physics object
          this.shuttlecock = this.physics.add.image(width - 100, courtBottom - 100, 'shuttlecock')
            .setOrigin(0.5, 0.5);

          // Start initial serve from right side
          this.serveShuttlecock();

          // Swipe controls
          this.setupSwipeHandlers();

          // Manual boundary checking using update loop
          // This will check boundaries every frame

          // Instructions
          this.add.text(width / 2, 50, 'Swipe left to right to return the shuttlecock!', {
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

            // Apply air resistance for realistic shuttlecock physics
            const currentVelocity = this.shuttlecock.body.velocity;
            const speed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);

            if (speed > 10) { // Only apply drag if moving significantly
              // Drag force opposes motion direction
              const dragMagnitude = this.airResistanceCoefficient * speed;
              const dragX = -(currentVelocity.x / speed) * dragMagnitude;
              const dragY = -(currentVelocity.y / speed) * dragMagnitude;

              // Apply drag as deceleration
              const newVelX = currentVelocity.x + dragX;
              const newVelY = currentVelocity.y + dragY;

              // Prevent reversing direction from drag (maintain motion direction)
              if (Math.sign(newVelX) === Math.sign(currentVelocity.x) || Math.abs(newVelX) > Math.abs(currentVelocity.x)) {
                this.shuttlecock.setVelocityX(newVelX);
              } else {
                this.shuttlecock.setVelocityX(0);
              }
              if (Math.sign(newVelY) === Math.sign(currentVelocity.y) || Math.abs(newVelY) > Math.abs(currentVelocity.y)) {
                this.shuttlecock.setVelocityY(newVelY);
              } else {
                this.shuttlecock.setVelocityY(0);
              }
            }

            // Calculate depth-based scaling
            const depthRatio = (y - this.courtTop) / (this.courtBottom - this.courtTop);
            const scale = 0.5 + (depthRatio * 0.5); // Scale from 0.5 (far) to 1.0 (near)
            this.shuttlecock.setScale(scale);

            // Debug: log position and velocity periodically
            if (Math.floor(this.time.now / 1000) !== this.lastLogTime) {
              console.log('Shuttlecock - pos:', x.toFixed(1), y.toFixed(1), 'vel:', currentVelocity.x.toFixed(1), currentVelocity.y.toFixed(1), 'speed:', speed.toFixed(1));
              this.lastLogTime = Math.floor(this.time.now / 1000);
            }

            // Check boundaries - only game over when hitting bottom line
            if (y > this.courtBottom) {
              console.log('Bottom boundary crossed! Position:', x, y, 'Game state:', this.gameState);
              this.gameOver();
            }
          }
        }

        setupSwipeHandlers() {
          // Remove any existing handlers
          this.input.removeAllListeners();

          // Swipe start
          this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.gameState !== 'playing') return;

            // Only allow swipes starting from the left side (player side)
            if (pointer.x > this.scale.width / 2) return;

            this.swipeStartPos = { x: pointer.x, y: pointer.y };
            this.swipeStartTime = this.time.now;
            this.isSwipingActive = true;

            // Create swipe trail graphics
            this.swipeTrail = this.add.graphics();
            this.swipeTrail.lineStyle(3, 0xffff00, 0.7);

            console.log('Swipe started at:', pointer.x, pointer.y);
          });

          // Swipe move - update trail
          this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.isSwipingActive || !this.swipeStartPos || !this.swipeTrail) return;

            // Clear and redraw trail
            this.swipeTrail.clear();
            this.swipeTrail.lineStyle(3, 0xffff00, 0.7);
            this.swipeTrail.strokeLineShape(
              new Phaser.Geom.Line(
                this.swipeStartPos.x, this.swipeStartPos.y,
                pointer.x, pointer.y
              )
            );
          });

          // Swipe end - calculate and apply hit
          this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (!this.isSwipingActive || !this.swipeStartPos) return;

            const swipeEndPos = { x: pointer.x, y: pointer.y };
            const swipeVector = {
              x: swipeEndPos.x - this.swipeStartPos.x,
              y: swipeEndPos.y - this.swipeStartPos.y
            };
            const swipeDuration = this.time.now - this.swipeStartTime;
            const swipeDistance = Math.sqrt(swipeVector.x * swipeVector.x + swipeVector.y * swipeVector.y);

            console.log('Swipe ended:', swipeVector, 'Distance:', swipeDistance, 'Duration:', swipeDuration);

            // Validate swipe
            const isValidSwipe =
              swipeVector.x > 0 &&        // Must be left to right
              swipeDistance > 30 &&       // Minimum distance
              swipeDuration < 1000 &&     // Maximum duration
              this.shuttlecock.x < this.scale.width / 2; // Shuttlecock must be on player side

            if (isValidSwipe) {
              console.log('Valid swipe detected, hitting shuttlecock');
              this.hitShuttlecockWithSwipe(swipeVector, swipeDuration);
            } else {
              console.log('Invalid swipe:', { leftToRight: swipeVector.x > 0, distance: swipeDistance, duration: swipeDuration, shuttlecockSide: this.shuttlecock.x < this.scale.width / 2 });
            }

            // Reset swipe state
            this.resetSwipeState();
          });
        }

        resetSwipeState() {
          this.isSwipingActive = false;
          this.swipeStartPos = null;
          this.swipeStartTime = 0;

          // Clean up trail
          if (this.swipeTrail) {
            this.swipeTrail.destroy();
            this.swipeTrail = null;
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

          // Add randomness to computer serve - speed and angle variation
          const baseHorizontalSpeed = -750; // Increased from -600
          const baseVerticalSpeed = -220; // Increased from -200

          const speedVariation = 0.3; // 30% variation
          const angleVariation = 0.4; // 40% angle variation

          const randomHorizontalSpeed = baseHorizontalSpeed * (1 + (Math.random() - 0.5) * speedVariation);
          const randomVerticalSpeed = baseVerticalSpeed * (1 + (Math.random() - 0.5) * angleVariation);

          this.shuttlecock.setVelocity(randomHorizontalSpeed, randomVerticalSpeed);
          this.gameState = 'playing';
        }

        hitShuttlecockWithSwipe(swipeVector: { x: number; y: number }, swipeDuration: number) {
          console.log('hitShuttlecockWithSwipe called, swipeVector:', swipeVector, 'duration:', swipeDuration);

          if (this.gameState !== 'playing') {
            console.log('Game not in playing state');
            return;
          }

          // Calculate swipe magnitude and speed
          const swipeMagnitude = Math.sqrt(swipeVector.x * swipeVector.x + swipeVector.y * swipeVector.y);
          const swipeSpeed = swipeMagnitude / (swipeDuration / 1000);

          // Dynamic speed multiplier based on swipe speed and force
          const baseMultiplier = 8.0; // Decreased from 10.0 for slightly lower player velocity
          const speedBonus = Math.min(swipeSpeed / 500, 1.0); // 0-1 based on swipe speed
          const totalMultiplier = baseMultiplier * (1 + speedBonus);

          // Apply direct force in swipe direction - this enables smashes, lobs, drives, etc.
          let horizontalVelocity = swipeVector.x * totalMultiplier;
          let verticalVelocity = swipeVector.y * totalMultiplier;

          // Gentle clamping to prevent extreme velocities while allowing full shot range
          horizontalVelocity = Math.max(300, Math.min(1200, horizontalVelocity)); // Increased max from 800 to 1200
          verticalVelocity = Math.max(-1100, Math.min(1100, verticalVelocity)); // Increased range for extremely high initial velocity

          console.log('Direct swipe physics - horizontal:', horizontalVelocity, 'vertical:', verticalVelocity, 'magnitude:', swipeMagnitude.toFixed(1), 'speed:', swipeSpeed.toFixed(1), 'multiplier:', totalMultiplier.toFixed(2));
          this.shuttlecock.setVelocity(horizontalVelocity, verticalVelocity);
        }

        // Legacy method - kept for backward compatibility
        hitShuttlecock() {
          console.log('hitShuttlecock called, gameState:', this.gameState, 'shuttlecock x:', this.shuttlecock.x);

          if (this.gameState !== 'playing') {
            console.log('Game not in playing state');
            return;
          }

          // Apply random force for variety with more forward momentum
          const randomHorizontal = Phaser.Math.Between(180, 280);
          const randomVertical = Phaser.Math.Between(-180, -120);

          console.log('Applying velocity:', randomHorizontal, randomVertical);
          this.shuttlecock.setVelocity(randomHorizontal, randomVertical);
        }

        gameOver() {
          console.log('Game over triggered');
          this.gameState = 'missed';

          // Reset any active swipe state
          this.resetSwipeState();

          // Stop shuttlecock movement
          this.shuttlecock.setVelocity(0, 0);

          // Show game over message
          const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Missed! Tap to restart', {
            fontSize: '24px',
            color: '#ff0000',
            backgroundColor: '#000000',
            padding: { x: 20, y: 10 }
          }).setOrigin(0.5);

          // Remove existing listeners to prevent conflicts
          this.input.removeAllListeners();

          // Restart on next tap (simple tap for restart)
          this.input.once('pointerdown', () => {
            console.log('Restart tapped');
            gameOverText.destroy();
            this.serveShuttlecock();

            // Re-initialize swipe handlers for gameplay
            this.setupSwipeHandlers();
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