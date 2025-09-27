import { SwipeData } from '../types/GameTypes';

export class SwipeHandler {
  private scene: Phaser.Scene;
  private swipeData: SwipeData;
  private onSwipeHit: (swipeVector: { x: number; y: number }, duration: number) => void;
  private isGamePlaying: () => boolean;
  private isShuttlecockOnPlayerSide: () => boolean;

  constructor(
    scene: Phaser.Scene,
    onSwipeHit: (swipeVector: { x: number; y: number }, duration: number) => void,
    isGamePlaying: () => boolean,
    isShuttlecockOnPlayerSide: () => boolean
  ) {
    this.scene = scene;
    this.onSwipeHit = onSwipeHit;
    this.isGamePlaying = isGamePlaying;
    this.isShuttlecockOnPlayerSide = isShuttlecockOnPlayerSide;

    this.swipeData = {
      startPos: { x: 0, y: 0 },
      startTime: 0,
      isActive: false,
      trail: null
    };
  }

  setupHandlers() {
    this.scene.input.removeAllListeners();

    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleSwipeStart(pointer);
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.handleSwipeMove(pointer);
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this.handleSwipeEnd(pointer);
    });
  }

  private handleSwipeStart(pointer: Phaser.Input.Pointer) {
    if (!this.isGamePlaying()) return;

    if (pointer.x > this.scene.scale.width / 2) return;

    this.swipeData.startPos = { x: pointer.x, y: pointer.y };
    this.swipeData.startTime = this.scene.time.now;
    this.swipeData.isActive = true;

    this.swipeData.trail = this.scene.add.graphics();
    this.swipeData.trail.lineStyle(3, 0xffff00, 0.7);

    console.log('Swipe started at:', pointer.x, pointer.y);
  }

  private handleSwipeMove(pointer: Phaser.Input.Pointer) {
    if (!this.swipeData.isActive || !this.swipeData.trail) return;

    this.swipeData.trail.clear();
    this.swipeData.trail.lineStyle(3, 0xffff00, 0.7);
    this.swipeData.trail.strokeLineShape(
      new Phaser.Geom.Line(
        this.swipeData.startPos.x, this.swipeData.startPos.y,
        pointer.x, pointer.y
      )
    );
  }

  private handleSwipeEnd(pointer: Phaser.Input.Pointer) {
    if (!this.swipeData.isActive) return;

    const swipeEndPos = { x: pointer.x, y: pointer.y };
    const swipeVector = {
      x: swipeEndPos.x - this.swipeData.startPos.x,
      y: swipeEndPos.y - this.swipeData.startPos.y
    };
    const swipeDuration = this.scene.time.now - this.swipeData.startTime;
    const swipeDistance = Math.sqrt(swipeVector.x * swipeVector.x + swipeVector.y * swipeVector.y);

    console.log('Swipe ended:', swipeVector, 'Distance:', swipeDistance, 'Duration:', swipeDuration);

    const isValidSwipe = this.validateSwipe(swipeVector, swipeDistance, swipeDuration);

    if (isValidSwipe) {
      console.log('Valid swipe detected, hitting shuttlecock');
      this.onSwipeHit(swipeVector, swipeDuration);
    } else {
      console.log('Invalid swipe:', {
        leftToRight: swipeVector.x > 0,
        distance: swipeDistance,
        duration: swipeDuration,
        shuttlecockSide: this.isShuttlecockOnPlayerSide()
      });
    }

    this.resetSwipeState();
  }

  private validateSwipe(swipeVector: { x: number; y: number }, distance: number, duration: number): boolean {
    return (
      swipeVector.x > 0 &&           // Must be left to right
      distance > 30 &&               // Minimum distance
      duration < 1000 &&             // Maximum duration
      this.isShuttlecockOnPlayerSide() // Shuttlecock must be on player side
    );
  }

  resetSwipeState() {
    this.swipeData.isActive = false;
    this.swipeData.startPos = { x: 0, y: 0 };
    this.swipeData.startTime = 0;

    if (this.swipeData.trail) {
      this.swipeData.trail.destroy();
      this.swipeData.trail = null;
    }
  }

  setupRestartHandler(onRestart: () => void) {
    this.scene.input.removeAllListeners();
    this.scene.input.once('pointerdown', onRestart);
  }
}