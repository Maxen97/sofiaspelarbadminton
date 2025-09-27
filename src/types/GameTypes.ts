export interface SwipeData {
  startPos: { x: number; y: number };
  startTime: number;
  isActive: boolean;
  trail: Phaser.GameObjects.Graphics | null;
}

export interface CourtDimensions {
  bottom: number;
  top: number;
  nearWidth: number;
  farWidth: number;
  centerX: number;
}

export interface CourtBounds {
  left: number;
  right: number;
}

export interface GameScore {
  player: number;
  computer: number;
}

export interface ComputerAIState {
  hasHit: boolean;
  hitTimer: number;
}

export type GameState = 'playing' | 'missed';

export type ShotType = 'smash' | 'drive' | 'clear' | 'drop shot';

export interface ShotConfig {
  horizontalVelocity: { min: number; max: number };
  verticalVelocity: { min: number; max: number };
  probability: number;
  name: ShotType;
}

export interface PlayerCharacterConfig {
  bodyWidth: number;
  bodyHeight: number;
  armWidth: number;
  armHeight: number;
  bodyColor: number;
  armColor: number;
}

export interface ArmState {
  isSwinging: boolean;
  restAngle: number;
  swingAngle: number;
}