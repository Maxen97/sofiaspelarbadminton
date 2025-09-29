import { CourtDimensions } from '../types/GameTypes';
import { CourtRenderer } from './CourtRenderer';

export class PlayerCharacter {
  private scene: Phaser.Scene;
  private courtRenderer: CourtRenderer;
  private container!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Image;
  private head?: Phaser.GameObjects.Image;
  private arm!: Phaser.GameObjects.Image;
  private armRotationTween?: Phaser.Tweens.Tween;
  private movementTween?: Phaser.Tweens.Tween;

  private readonly bodyWidth = 90;
  private readonly bodyHeight = 180;
  private readonly headSize = 90;
  private readonly armWidth = 120;
  private readonly armHeight = 24;
  private readonly maxMovement = 120;

  private characterY: number = 0;
  private baseX: number = 0;
  private hasHeadSprite: boolean = false;

  constructor(scene: Phaser.Scene, courtRenderer: CourtRenderer, hasHeadSprite: boolean = false) {
    this.scene = scene;
    this.courtRenderer = courtRenderer;
    this.hasHeadSprite = hasHeadSprite;
  }

  create(courtDimensions: CourtDimensions) {
    this.calculatePosition(courtDimensions);
    this.createContainer();
    this.createBody();
    if (this.hasHeadSprite) {
      this.createHead();
    }
    this.createArm();
  }

  private calculatePosition(courtDimensions: CourtDimensions) {
    // Position character near the bottom service line (25% up from bottom)
    this.characterY = courtDimensions.bottom - (courtDimensions.bottom - courtDimensions.top) * 0.25;
  }

  private createContainer() {
    // Get court bounds at character Y position using CourtRenderer
    const courtBounds = this.courtRenderer.getCourtXAtY(this.characterY);

    // Position character 20% in from left edge of court
    this.baseX = courtBounds.left + (courtBounds.right - courtBounds.left) * 0.2;

    this.container = this.scene.add.container(this.baseX, this.characterY);
  }

  private createBody() {
    this.body = this.scene.add.image(0, 0, 'playerBody');

    // Set origin to bottom-center so character stands on ground
    this.body.setOrigin(0.5, 1);

    // Scale sprite to match our desired character size
    const spriteScale = this.bodyHeight / this.body.height;
    this.body.setScale(spriteScale);

    this.container.add(this.body);
  }

  private createHead() {
    this.head = this.scene.add.image(0, 0, 'playerHead');

    // Position head at top of body
    const headY = -this.bodyHeight - this.headSize / 2 + 32;
    this.head.setPosition(0, headY);

    // Set origin to center
    this.head.setOrigin(0.5, 0.5);

    // Scale head to desired size
    const headScale = this.headSize / this.head.height;
    this.head.setScale(headScale);

    this.container.add(this.head);
  }

  private createArm() {
    this.arm = this.scene.add.image(0, 0, 'playerArm');

    // Position arm at shoulder: right side of sprite, about 1/4 down from top
    const shoulderX = this.bodyWidth / 2 * 0.8 - 80; // Slightly inward from edge, moved 20px left total (moved 20px more right)
    const shoulderY = -this.bodyHeight * 0.75 - 15; // 75% up from bottom, moved 20px down total

    this.arm.setPosition(shoulderX, shoulderY);

    // Set origin at shoulder joint (left end of arm where it connects to body)
    this.arm.setOrigin(0.5, 0);

    // Scale arm to match character proportions
    const armScale = this.armWidth / this.arm.width;
    this.arm.setScale(armScale);

    // Set initial rotation (90 degrees anti-clockwise + original rotation)
    this.arm.setRotation(-1.57 - 0.35); // -90 degrees (-π/2) + original -20 degrees

    this.container.add(this.arm);
  }

  playSwingAnimation(shuttlecockX?: number) {
    if (this.armRotationTween) {
      this.armRotationTween.stop();
    }

    // Move towards shuttlecock if position provided
    if (shuttlecockX !== undefined) {
      this.moveTowardsShuttle(shuttlecockX);
    }

    this.armRotationTween = this.scene.tweens.add({
      targets: this.arm,
      rotation: { from: -1.57 - 0.35, to: -1.57 + 0.79 }, // Base rotation + swing range
      duration: 150,
      ease: 'Power2',
      yoyo: true,
      onComplete: () => {
        this.arm.setRotation(-1.57 - 0.35);
      }
    });
  }

  private moveTowardsShuttle(shuttlecockX: number) {
    if (this.movementTween) {
      this.movementTween.stop();
    }

    // Calculate offset towards shuttlecock, clamped to max movement
    const offset = Math.max(-this.maxMovement, Math.min(this.maxMovement, (shuttlecockX - this.baseX) * 0.2));
    const targetX = this.baseX + offset;

    // Move towards shuttlecock
    this.movementTween = this.scene.tweens.add({
      targets: this.container,
      x: targetX,
      duration: 250,
      ease: 'Power2',
      onComplete: () => {
        // Return to base position after a short delay
        this.scene.time.delayedCall(400, () => {
          this.scene.tweens.add({
            targets: this.container,
            x: this.baseX,
            duration: 300,
            ease: 'Power2'
          });
        });
      }
    });
  }

  update(courtDimensions: CourtDimensions) {
    const scale = this.calculateDepthScale(courtDimensions);
    this.container.setScale(scale);
  }

  private calculateDepthScale(courtDimensions: CourtDimensions): number {
    const t = Math.max(0, Math.min(1, (this.characterY - courtDimensions.bottom) / (courtDimensions.top - courtDimensions.bottom)));
    return 0.5 + t * 0.5;
  }

  destroy() {
    if (this.armRotationTween) {
      this.armRotationTween.stop();
    }
    if (this.movementTween) {
      this.movementTween.stop();
    }
    this.container?.destroy();
  }
}