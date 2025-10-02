import { GameState, GameScore } from '../types/GameTypes';
import { CourtRenderer } from '../components/CourtRenderer';
import { SwipeHandler } from '../components/SwipeHandler';
import { ComputerAI } from '../components/ComputerAI';
import { PlayerCharacter } from '../components/PlayerCharacter';
import { ComputerCharacter } from '../components/ComputerCharacter';
import { GamePhysics } from '../utils/GamePhysics';
import { CharacterSelection } from '../utils/characterOptions';

export class BadmintonScene extends Phaser.Scene {
  private shuttlecock: Phaser.Physics.Arcade.Image | null = null;
  private shuttlecockTrail: Phaser.GameObjects.Graphics | null = null;
  private trailPositions: { x: number; y: number }[] = [];
  private gameState: GameState = 'ready';
  private lastLogTime: number = 0;
  private score: GameScore = { player: 0, computer: 0 };
  private lastHitter: 'player' | 'computer' | null = null;

  private courtRenderer!: CourtRenderer;
  private swipeHandler!: SwipeHandler;
  private computerAI!: ComputerAI;
  private playerCharacter!: PlayerCharacter;
  private computerCharacter!: ComputerCharacter;
  private characterSelection: CharacterSelection;
  private onScoreUpdate: (score: GameScore) => void;
  private onGameReady?: () => void;

  constructor(characterSelection: CharacterSelection, onScoreUpdate: (score: GameScore) => void, onGameReady?: () => void) {
    super({ key: 'BadmintonScene' });
    this.characterSelection = characterSelection;
    this.onScoreUpdate = onScoreUpdate;
    this.onGameReady = onGameReady;
  }

  preload() {
    this.courtRenderer = new CourtRenderer(this);
    this.courtRenderer.createTextures();
    this.load.image('playerBody', this.characterSelection.player.spriteBodyUrl);
    this.load.image('computerBody', this.characterSelection.computer.spriteBodyUrl);
    if (this.characterSelection.player.spriteHeadUrl) {
      this.load.image('playerHead', this.characterSelection.player.spriteHeadUrl);
    }
    if (this.characterSelection.computer.spriteHeadUrl) {
      this.load.image('computerHead', this.characterSelection.computer.spriteHeadUrl);
    }
    this.load.image('playerArm', '/sprites/arm.png');
    this.load.image('arena', '/sprites/arena.png');
    this.load.image('shuttlecock', '/sprites/shuttlecock.png');
  }

  create() {
    const { width, height } = this.scale;

    // Add arena background image with preserved aspect ratio, anchored to bottom
    const arenaTexture = this.textures.get('arena').getSourceImage();
    const arenaAspectRatio = arenaTexture.width / arenaTexture.height;
    const screenAspectRatio = width / height;

    let arenaWidth, arenaHeight;
    if (screenAspectRatio > arenaAspectRatio) {
      // Screen is wider than image - fit to width
      arenaWidth = width;
      arenaHeight = width / arenaAspectRatio;
    } else {
      // Screen is taller than image - fit to height
      arenaHeight = height;
      arenaWidth = height * arenaAspectRatio;
    }

    this.add.image(width / 2, height, 'arena')
      .setOrigin(0.5, 1)
      .setDisplaySize(arenaWidth, arenaHeight);

    this.courtRenderer.renderCourt();

    this.computerAI = new ComputerAI(this);

    this.playerCharacter = new PlayerCharacter(
      this,
      this.courtRenderer,
      !!this.characterSelection.player.spriteHeadUrl
    );
    this.playerCharacter.create(this.courtRenderer.getDimensions());

    this.computerCharacter = new ComputerCharacter(
      this,
      this.courtRenderer,
      !!this.characterSelection.computer.spriteHeadUrl
    );
    this.computerCharacter.create(this.courtRenderer.getDimensions());

    // Apply initial depth scaling to characters
    const courtDimensions = this.courtRenderer.getDimensions();
    this.playerCharacter.update(courtDimensions);
    this.computerCharacter.update(courtDimensions);

    this.swipeHandler = new SwipeHandler(
      this,
      (swipeVector, duration) => this.hitShuttlecockWithSwipe(swipeVector, duration),
      () => this.gameState === 'playing',
      () => this.shuttlecock !== null && this.shuttlecock.x < this.scale.width / 2 + 20
    );

    this.showReadyMessage();

    // Notify that the game is ready
    this.onGameReady?.();
  }

  update() {
    if (this.gameState === 'playing' && this.shuttlecock && this.shuttlecock.body) {
      const { width } = this.scale;
      const x = this.shuttlecock.x;
      const y = this.shuttlecock.y;
      const currentVelocity = this.shuttlecock.body.velocity;

      // Rotate shuttlecock to point in direction of velocity
      const angle = Math.atan2(currentVelocity.y, currentVelocity.x) - Math.PI / 2;
      this.shuttlecock.setRotation(angle);

      // Update motion trail
      this.trailPositions.push({ x, y });
      if (this.trailPositions.length > 12) {
        this.trailPositions.shift();
      }

      // Render trail with fading effect
      if (this.shuttlecockTrail && this.trailPositions.length > 1) {
        this.shuttlecockTrail.clear();
        for (let i = 1; i < this.trailPositions.length; i++) {
          const alpha = i / this.trailPositions.length;
          this.shuttlecockTrail.lineStyle(4 * alpha, 0xffffff, alpha * 0.6);
          this.shuttlecockTrail.strokeLineShape(
            new Phaser.Geom.Line(
              this.trailPositions[i - 1].x,
              this.trailPositions[i - 1].y,
              this.trailPositions[i].x,
              this.trailPositions[i].y
            )
          );
        }
      }

      GamePhysics.applyAirResistance(this.shuttlecock);

      const courtDimensions = this.courtRenderer.getDimensions();

      this.logPositionPeriodically(x, y, currentVelocity);

      const computerHit = this.computerAI.update(this.shuttlecock, width, courtDimensions.top);
      if (computerHit) {
        this.lastHitter = 'computer';
        this.computerCharacter.playSwingAnimation(this.shuttlecock.x);
      }

      this.playerCharacter.update(courtDimensions);
      this.computerCharacter.update(courtDimensions);

      const boundaryBuffer = 50;
      if (x < -boundaryBuffer || x > width + boundaryBuffer || y < -boundaryBuffer) {
        console.log('Out of bounds! Position:', x, y, 'Last hitter:', this.lastHitter);
        this.gameOverOutOfBounds();
      } else if (y > courtDimensions.bottom - 10) {
        console.log('Bottom boundary crossed! Position:', x, y, 'Game state:', this.gameState);
        this.gameOver();
      }
    }
  }

  private logPositionPeriodically(x: number, y: number, velocity: Phaser.Math.Vector2) {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    if (Math.floor(this.time.now / 1000) !== this.lastLogTime) {
      console.log('Shuttlecock - pos:', x.toFixed(1), y.toFixed(1), 'vel:', velocity.x.toFixed(1), velocity.y.toFixed(1), 'speed:', speed.toFixed(1));
      this.lastLogTime = Math.floor(this.time.now / 1000);
    }
  }

  private serveShuttlecock() {
    const courtDimensions = this.courtRenderer.getDimensions();
    const serveY = courtDimensions.top + 50;
    const courtBounds = this.courtRenderer.getCourtXAtY(serveY);

    // Create shuttlecock when the game actually starts
    if (!this.shuttlecock) {
      this.shuttlecock = this.physics.add.image(courtBounds.right - 20, serveY, 'shuttlecock')
        .setOrigin(0.5, 0.5)
        .setScale(1);
    } else {
      this.shuttlecock.setPosition(courtBounds.right - 20, serveY);
    }

    // Initialize trail graphics
    if (!this.shuttlecockTrail) {
      this.shuttlecockTrail = this.add.graphics();
    }
    this.trailPositions = [];

    const velocity = GamePhysics.generateServeVelocity();
    this.shuttlecock.setVelocity(velocity.x, velocity.y);

    this.gameState = 'playing';
    this.computerAI.reset();
    this.lastHitter = 'computer';
    this.computerCharacter.playSwingAnimation(this.shuttlecock.x);
    this.swipeHandler.setupHandlers();
  }

  private hitShuttlecockWithSwipe(swipeVector: { x: number; y: number }, swipeDuration: number) {
    console.log('hitShuttlecockWithSwipe called, swipeVector:', swipeVector, 'duration:', swipeDuration);

    if (this.gameState !== 'playing' || !this.shuttlecock) {
      console.log('Game not in playing state or shuttlecock not available');
      return;
    }

    const velocity = GamePhysics.calculateSwipeVelocity(swipeVector, swipeDuration);

    console.log('Direct swipe physics - horizontal:', velocity.x, 'vertical:', velocity.y);
    this.shuttlecock.setVelocity(velocity.x, velocity.y);
    this.lastHitter = 'player';

    this.playerCharacter.playSwingAnimation(this.shuttlecock.x);
  }

  private createMessageBox(
    message: string,
    subtitle: string,
    bgColor: number,
    textColor: string
  ): { container: Phaser.GameObjects.Container; background: Phaser.GameObjects.Graphics } {
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;

    // Create background graphics
    const bg = this.add.graphics();

    // Shadow
    bg.fillStyle(0x000000, 0.4);
    bg.fillRoundedRect(-160, -74, 320, 148, 20);

    // Main background
    bg.fillStyle(bgColor, 0.95);
    bg.fillRoundedRect(-154, -68, 308, 136, 16);

    // Border highlight
    bg.lineStyle(3, 0xffffff, 0.3);
    bg.strokeRoundedRect(-154, -68, 308, 136, 16);

    // Create text
    const mainText = this.add.text(0, -20, message, {
      fontSize: '28px',
      color: textColor,
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5);

    const subText = this.add.text(0, 25, subtitle, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0.9);

    // Create container
    const container = this.add.container(centerX, centerY, [bg, mainText, subText]);

    return { container, background: bg };
  }

  private gameOver() {
    console.log('Game over triggered');
    this.gameState = 'missed';

    this.swipeHandler.resetSwipeState();
    this.computerAI.reset();

    if (this.shuttlecock) {
      this.shuttlecock.setVelocity(0, 0);
    }

    // Clear trail
    if (this.shuttlecockTrail) {
      this.shuttlecockTrail.clear();
    }
    this.trailPositions = [];

    this.physics.pause();

    const { width } = this.scale;
    let scoreMessage = '';
    let bgColor = 0x000000;
    let textColor = '#ffffff';

    if (this.shuttlecock && this.shuttlecock.x > width / 2) {
      this.score.player++;
      scoreMessage = 'Snyggt!';
      bgColor = 0x16a34a; // Green
      textColor = '#ffffff';
    } else {
      this.score.computer++;
      scoreMessage = 'Miss!';
      bgColor = 0xdc2626; // Red
      textColor = '#ffffff';
    }

    this.onScoreUpdate({ ...this.score });

    const messageBox = this.createMessageBox(
      scoreMessage,
      'Tryck för att fortsätta',
      bgColor,
      textColor
    );

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Restart tapped');
      messageBox.container.destroy();
      this.physics.resume();
      this.serveShuttlecock();
      this.swipeHandler.setupHandlers();
    });
  }

  private showReadyMessage() {
    const messageBox = this.createMessageBox(
      'Redo att spela!',
      'Tryck för att börja',
      0x1e40af, // Blue
      '#ffffff'
    );

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Game started');
      messageBox.container.destroy();
      this.serveShuttlecock();
    });
  }

  private gameOverOutOfBounds() {
    console.log('Game over: Out of bounds! Last hitter was:', this.lastHitter);
    this.gameState = 'missed';

    this.swipeHandler.resetSwipeState();
    this.computerAI.reset();

    if (this.shuttlecock) {
      this.shuttlecock.setVelocity(0, 0);
    }

    // Clear trail
    if (this.shuttlecockTrail) {
      this.shuttlecockTrail.clear();
    }
    this.trailPositions = [];

    this.physics.pause();

    let scoreMessage = '';
    let bgColor = 0x000000;

    if (this.lastHitter === 'player') {
      this.score.computer++;
      scoreMessage = 'Utanför!';
      bgColor = 0xdc2626; // Red
    } else if (this.lastHitter === 'computer') {
      this.score.player++;
      scoreMessage = 'Utanför!';
      bgColor = 0x16a34a; // Green
    } else {
      this.score.computer++;
      scoreMessage = 'Utanför!';
      bgColor = 0xdc2626; // Red
    }

    this.onScoreUpdate({ ...this.score });

    const messageBox = this.createMessageBox(
      scoreMessage,
      'Tryck för att fortsätta',
      bgColor,
      '#ffffff'
    );

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Restart tapped');
      messageBox.container.destroy();
      this.physics.resume();
      this.serveShuttlecock();
      this.swipeHandler.setupHandlers();
    });
  }
}