export class GamePhysics {
  private static readonly AIR_RESISTANCE_COEFFICIENT = 0.025;
  private static readonly MIN_SPEED_FOR_DRAG = 10;

  static applyAirResistance(shuttlecock: Phaser.Physics.Arcade.Image): void {
    const currentVelocity = shuttlecock.body.velocity;
    const speed = Math.sqrt(currentVelocity.x * currentVelocity.x + currentVelocity.y * currentVelocity.y);

    if (speed > this.MIN_SPEED_FOR_DRAG) {
      const dragMagnitude = this.AIR_RESISTANCE_COEFFICIENT * speed;
      const dragX = -(currentVelocity.x / speed) * dragMagnitude;
      const dragY = -(currentVelocity.y / speed) * dragMagnitude;

      const newVelX = currentVelocity.x + dragX;
      const newVelY = currentVelocity.y + dragY;

      if (Math.sign(newVelX) === Math.sign(currentVelocity.x) || Math.abs(newVelX) > Math.abs(currentVelocity.x)) {
        shuttlecock.setVelocityX(newVelX);
      } else {
        shuttlecock.setVelocityX(0);
      }

      if (Math.sign(newVelY) === Math.sign(currentVelocity.y) || Math.abs(newVelY) > Math.abs(currentVelocity.y)) {
        shuttlecock.setVelocityY(newVelY);
      } else {
        shuttlecock.setVelocityY(0);
      }
    }
  }

  static calculateDepthScale(y: number, courtTop: number, courtBottom: number): number {
    const depthRatio = (y - courtTop) / (courtBottom - courtTop);
    return 0.5 + (depthRatio * 0.5);
  }

  static calculateSwipeVelocity(
    swipeVector: { x: number; y: number },
    swipeDuration: number
  ): { x: number; y: number } {
    const swipeMagnitude = Math.sqrt(swipeVector.x * swipeVector.x + swipeVector.y * swipeVector.y);
    const swipeSpeed = swipeMagnitude / (swipeDuration / 1000);

    const baseMultiplier = 8.0;
    const speedBonus = Math.min(swipeSpeed / 500, 1.0);
    const totalMultiplier = baseMultiplier * (1 + speedBonus);

    let horizontalVelocity = swipeVector.x * totalMultiplier;
    let verticalVelocity = swipeVector.y * totalMultiplier;

    horizontalVelocity = Math.max(300, Math.min(1200, horizontalVelocity));
    verticalVelocity = Math.max(-1100, Math.min(1100, verticalVelocity));

    return { x: horizontalVelocity, y: verticalVelocity };
  }

  static generateServeVelocity(): { x: number; y: number } {
    const baseHorizontalSpeed = -750;
    const baseVerticalSpeed = -220;

    const speedVariation = 0.3;
    const angleVariation = 0.4;

    const randomHorizontalSpeed = baseHorizontalSpeed * (1 + (Math.random() - 0.5) * speedVariation);
    const randomVerticalSpeed = baseVerticalSpeed * (1 + (Math.random() - 0.5) * angleVariation);

    return { x: randomHorizontalSpeed, y: randomVerticalSpeed };
  }
}