import { CourtDimensions, CourtBounds } from '../types/GameTypes';

export class CourtRenderer {
  private scene: Phaser.Scene;
  private dimensions: CourtDimensions;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initializeDimensions();
  }

  private initializeDimensions() {
    const { width, height } = this.scene.scale;

    this.dimensions = {
      bottom: height,
      top: height - 220,
      nearWidth: width * 0.99,
      farWidth: width * 0.55,
      centerX: width / 2
    };
  }

  getDimensions(): CourtDimensions {
    return this.dimensions;
  }

  getCourtXAtY(y: number): CourtBounds {
    const t = Math.max(0, Math.min(1, (y - this.dimensions.bottom) / (this.dimensions.top - this.dimensions.bottom)));
    const nearLeft = this.dimensions.centerX - this.dimensions.nearWidth / 2;
    const nearRight = this.dimensions.centerX + this.dimensions.nearWidth / 2;
    const farLeft = this.dimensions.centerX - this.dimensions.farWidth / 2;
    const farRight = this.dimensions.centerX + this.dimensions.farWidth / 2;

    return {
      left: nearLeft + (farLeft - nearLeft) * t,
      right: nearRight + (farRight - nearRight) * t
    };
  }

  createTextures() {
    this.scene.add.graphics()
      .fillStyle(0xffffff)
      .fillCircle(10, 10, 10)
      .generateTexture('shuttlecock', 20, 20);

    this.scene.add.graphics()
      .fillStyle(0x2d5016)
      .fillRect(0, 0, 10, 10)
      .generateTexture('court', 10, 10);

    this.scene.add.graphics()
      .fillStyle(0xffffff)
      .fillRect(0, 0, 4, 200)
      .generateTexture('net', 4, 200);
  }

  renderCourt() {
    const { bottom, top, nearWidth, farWidth, centerX } = this.dimensions;

    const nearLeft = centerX - nearWidth / 2;
    const nearRight = centerX + nearWidth / 2;
    const farLeft = centerX - farWidth / 2;
    const farRight = centerX + farWidth / 2;

    this.renderCourtSurface(nearLeft, nearRight, farLeft, farRight, bottom, top);
    this.renderCourtLines(nearLeft, nearRight, farLeft, farRight, bottom, top);
    this.renderNet();
  }

  private renderCourtSurface(nearLeft: number, nearRight: number, farLeft: number, farRight: number, bottom: number, top: number) {
    const courtGraphics = this.scene.add.graphics();

    courtGraphics.fillGradientStyle(0x2d5016, 0x2d5016, 0x3a6318, 0x3a6318, 1);
    courtGraphics.beginPath();
    courtGraphics.moveTo(nearLeft, bottom);
    courtGraphics.lineTo(nearRight, bottom);
    courtGraphics.lineTo(farRight, top);
    courtGraphics.lineTo(farLeft, top);
    courtGraphics.closePath();
    courtGraphics.fillPath();

    courtGraphics.lineStyle(3, 0xffffff, 1);
    courtGraphics.strokePath();
  }

  private renderCourtLines(nearLeft: number, nearRight: number, farLeft: number, farRight: number, bottom: number, top: number) {
    const lineGraphics = this.scene.add.graphics();
    lineGraphics.lineStyle(2, 0xffffff, 0.9);

    const serviceLine1Y = bottom - (bottom - top) * 0.25;
    const serviceLine2Y = bottom - (bottom - top) * 0.75;

    const getXAtY = (y: number) => {
      const t = (y - bottom) / (top - bottom);
      return {
        left: nearLeft + (farLeft - nearLeft) * t,
        right: nearRight + (farRight - nearRight) * t
      };
    };

    const service1 = getXAtY(serviceLine1Y);
    lineGraphics.strokeLineShape(new Phaser.Geom.Line(service1.left, serviceLine1Y, service1.right, serviceLine1Y));

    const service2 = getXAtY(serviceLine2Y);
    lineGraphics.strokeLineShape(new Phaser.Geom.Line(service2.left, serviceLine2Y, service2.right, serviceLine2Y));

    lineGraphics.strokeLineShape(new Phaser.Geom.Line(
      (nearLeft + nearRight) / 2, bottom,
      (farLeft + farRight) / 2, top
    ));

    const singlesOffset = 0.85;
    lineGraphics.strokeLineShape(new Phaser.Geom.Line(
      nearLeft + (nearRight - nearLeft) * (1 - singlesOffset) / 2, bottom,
      farLeft + (farRight - farLeft) * (1 - singlesOffset) / 2, top
    ));
    lineGraphics.strokeLineShape(new Phaser.Geom.Line(
      nearRight - (nearRight - nearLeft) * (1 - singlesOffset) / 2, bottom,
      farRight - (farRight - farLeft) * (1 - singlesOffset) / 2, top
    ));
  }

  private renderNet() {
    const { bottom, top, centerX } = this.dimensions;
    const netGraphics = this.scene.add.graphics();

    const topPostX = centerX - 10;
    const bottomPostX = centerX + 10;

    netGraphics.fillStyle(0x808080, 1);
    netGraphics.fillRect(topPostX - 3, top - 5, 6, 65);
    netGraphics.fillRect(bottomPostX - 3, bottom - 60, 6, 65);

    netGraphics.lineStyle(1, 0xffffff, 0.8);
    const netWidth = 50;

    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const x1 = topPostX + (bottomPostX - topPostX) * t;
      const y1 = top + (bottom - top) * t;
      const x2 = x1 - netWidth;
      netGraphics.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y1));
    }

    for (let i = 0; i <= 5; i++) {
      const xOffset = netWidth * (i / 5);
      netGraphics.strokeLineShape(new Phaser.Geom.Line(
        topPostX - xOffset, top,
        bottomPostX - xOffset, bottom
      ));
    }

    netGraphics.lineStyle(3, 0xffffff, 1);
    netGraphics.strokeLineShape(new Phaser.Geom.Line(topPostX, top, bottomPostX, bottom));
  }
}