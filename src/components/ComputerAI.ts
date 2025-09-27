import { ComputerAIState, ShotConfig, ShotType } from '../types/GameTypes';

export class ComputerAI {
  private scene: Phaser.Scene;
  private state: ComputerAIState;
  private shotConfigs: ShotConfig[];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.state = {
      hasHit: false,
      hitTimer: 0
    };

    this.shotConfigs = [
      {
        name: 'smash',
        probability: 0.3,
        horizontalVelocity: { min: -900, max: -700 },
        verticalVelocity: { min: 100, max: 250 }
      },
      {
        name: 'drive',
        probability: 0.3,
        horizontalVelocity: { min: -750, max: -600 },
        verticalVelocity: { min: -50, max: 50 }
      },
      {
        name: 'clear',
        probability: 0.25,
        horizontalVelocity: { min: -500, max: -400 },
        verticalVelocity: { min: -350, max: -250 }
      },
      {
        name: 'drop shot',
        probability: 0.15,
        horizontalVelocity: { min: -400, max: -300 },
        verticalVelocity: { min: -150, max: -100 }
      }
    ];
  }

  update(shuttlecock: Phaser.Physics.Arcade.Image, screenWidth: number, courtTop?: number): boolean {
    const currentVelocity = shuttlecock.body.velocity;
    const x = shuttlecock.x;
    const y = shuttlecock.y;

    if (x > screenWidth / 2 && !this.state.hasHit && currentVelocity.x > 0) {
      if (courtTop !== undefined) {
        const maxReachableHeight = courtTop - 100;
        if (y < maxReachableHeight) {
          console.log('Shuttlecock too high to reach! Height:', y.toFixed(1), 'Max reachable:', maxReachableHeight.toFixed(1));
          return false;
        }
      }

      if (!this.state.hitTimer) {
        const reactionDelay = 200 + Math.random() * 200;
        this.state.hitTimer = this.scene.time.now + reactionDelay;
        console.log('Computer preparing to hit in', reactionDelay.toFixed(0), 'ms');
      }

      if (this.scene.time.now >= this.state.hitTimer) {
        this.executeReturnShot(shuttlecock);
        this.state.hasHit = true;
        this.state.hitTimer = 0;
        return true;
      }
    }

    if (x < screenWidth / 2 && currentVelocity.x < 0) {
      this.state.hasHit = false;
    }

    return false;
  }

  private executeReturnShot(shuttlecock: Phaser.Physics.Arcade.Image) {
    console.log('Computer is returning the shot!');

    const { shot, velocities } = this.selectShot();

    const placementVariation = (Math.random() - 0.5) * 40;
    const finalVerticalVelocity = velocities.vertical + placementVariation;

    shuttlecock.setVelocity(velocities.horizontal, finalVerticalVelocity);

    console.log(`Computer returns with ${shot}: vel(${velocities.horizontal.toFixed(0)}, ${finalVerticalVelocity.toFixed(0)})`);
  }

  private selectShot(): { shot: ShotType; velocities: { horizontal: number; vertical: number } } {
    const random = Math.random();
    let cumulativeProbability = 0;

    for (const config of this.shotConfigs) {
      cumulativeProbability += config.probability;
      if (random < cumulativeProbability) {
        return {
          shot: config.name,
          velocities: {
            horizontal: config.horizontalVelocity.min + Math.random() * (config.horizontalVelocity.max - config.horizontalVelocity.min),
            vertical: config.verticalVelocity.min + Math.random() * (config.verticalVelocity.max - config.verticalVelocity.min)
          }
        };
      }
    }

    return {
      shot: 'drive',
      velocities: { horizontal: -650, vertical: 0 }
    };
  }

  reset() {
    this.state.hasHit = false;
    this.state.hitTimer = 0;
  }

  getState(): ComputerAIState {
    return { ...this.state };
  }
}