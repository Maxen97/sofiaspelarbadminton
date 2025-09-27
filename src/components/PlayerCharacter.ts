import { CourtDimensions, CourtBounds } from '../types/GameTypes';

export class PlayerCharacter {
  private scene: Phaser.Scene;
  private courtRenderer: any;
  private container!: Phaser.GameObjects.Container;
  private body!: Phaser.GameObjects.Image;
  private arm!: Phaser.GameObjects.Image;
  private armRotationTween?: Phaser.Tweens.Tween;

  private readonly bodyWidth = 90;
  private readonly bodyHeight = 180;
  private readonly armWidth = 120;
  private readonly armHeight = 24;

  private characterY: number = 0;

  constructor(scene: Phaser.Scene, courtRenderer: any) {
    this.scene = scene;
    this.courtRenderer = courtRenderer;
  }

  create(courtDimensions: CourtDimensions) {
    this.calculatePosition(courtDimensions);
    this.createContainer();
    this.createBody();
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
    const characterX = courtBounds.left + (courtBounds.right - courtBounds.left) * 0.2;

    this.container = this.scene.add.container(characterX, this.characterY);
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

  playSwingAnimation() {
    if (this.armRotationTween) {
      this.armRotationTween.stop();
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
    this.container?.destroy();
  }
}