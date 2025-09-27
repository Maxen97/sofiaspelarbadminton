import { GameState, GameScore } from '../types/GameTypes';
import { CourtRenderer } from '../components/CourtRenderer';
import { SwipeHandler } from '../components/SwipeHandler';
import { ComputerAI } from '../components/ComputerAI';
import { GamePhysics } from '../utils/GamePhysics';

export class BadmintonScene extends Phaser.Scene {
  private shuttlecock!: Phaser.Physics.Arcade.Image;
  private gameState: GameState = 'playing';
  private lastLogTime: number = 0;
  private score: GameScore = { player: 0, computer: 0 };
  private scoreText!: Phaser.GameObjects.Text;
  private lastHitter: 'player' | 'computer' | null = null;

  private courtRenderer!: CourtRenderer;
  private swipeHandler!: SwipeHandler;
  private computerAI!: ComputerAI;

  constructor() {
    super({ key: 'BadmintonScene' });
  }

  preload() {
    this.courtRenderer = new CourtRenderer(this);
    this.courtRenderer.createTextures();
  }

  create() {
    const { width, height } = this.scale;

    this.courtRenderer.renderCourt();

    this.shuttlecock = this.physics.add.image(width - 100, height - 120, 'shuttlecock')
      .setOrigin(0.5, 0.5);

    this.computerAI = new ComputerAI(this);

    this.swipeHandler = new SwipeHandler(
      this,
      (swipeVector, duration) => this.hitShuttlecockWithSwipe(swipeVector, duration),
      () => this.gameState === 'playing',
      () => this.shuttlecock.x < this.scale.width / 2
    );

    this.serveShuttlecock();
    this.swipeHandler.setupHandlers();

    this.add.text(width / 2, 50, 'Swipe left to right to return the shuttlecock!', {
      fontSize: '16px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.scoreText = this.add.text(width / 2, 20, `Player: ${this.score.player}  Computer: ${this.score.computer}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontWeight: 'bold'
    }).setOrigin(0.5);
  }

  update() {
    if (this.gameState === 'playing' && this.shuttlecock) {
      const { width } = this.scale;
      const x = this.shuttlecock.x;
      const y = this.shuttlecock.y;
      const currentVelocity = this.shuttlecock.body.velocity;

      GamePhysics.applyAirResistance(this.shuttlecock);

      const courtDimensions = this.courtRenderer.getDimensions();
      const scale = GamePhysics.calculateDepthScale(y, courtDimensions.top, courtDimensions.bottom);
      this.shuttlecock.setScale(scale);

      this.logPositionPeriodically(x, y, currentVelocity);

      const computerHit = this.computerAI.update(this.shuttlecock, width, courtDimensions.top);
      if (computerHit) {
        this.lastHitter = 'computer';
      }

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

  private logPositionPeriodically(x: number, y: number, velocity: any) {
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

    this.shuttlecock.setPosition(courtBounds.right - 20, serveY);

    const velocity = GamePhysics.generateServeVelocity();
    this.shuttlecock.setVelocity(velocity.x, velocity.y);

    this.gameState = 'playing';
    this.computerAI.reset();
    this.lastHitter = null;
  }

  private hitShuttlecockWithSwipe(swipeVector: { x: number; y: number }, swipeDuration: number) {
    console.log('hitShuttlecockWithSwipe called, swipeVector:', swipeVector, 'duration:', swipeDuration);

    if (this.gameState !== 'playing') {
      console.log('Game not in playing state');
      return;
    }

    const velocity = GamePhysics.calculateSwipeVelocity(swipeVector, swipeDuration);

    console.log('Direct swipe physics - horizontal:', velocity.x, 'vertical:', velocity.y);
    this.shuttlecock.setVelocity(velocity.x, velocity.y);
    this.lastHitter = 'player';
  }

  private gameOver() {
    console.log('Game over triggered');
    this.gameState = 'missed';

    this.swipeHandler.resetSwipeState();
    this.computerAI.reset();

    this.shuttlecock.setVelocity(0, 0);
    this.physics.pause();

    const { width } = this.scale;
    let scoreMessage = '';

    if (this.shuttlecock.x > width / 2) {
      this.score.player++;
      scoreMessage = 'Player scores!';
    } else {
      this.score.computer++;
      scoreMessage = 'Computer scores!';
    }

    this.scoreText.setText(`Player: ${this.score.player}  Computer: ${this.score.computer}`);

    const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${scoreMessage}\nTap to restart`, {
      fontSize: '24px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    }).setOrigin(0.5);

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Restart tapped');
      gameOverText.destroy();
      this.physics.resume();
      this.serveShuttlecock();
      this.swipeHandler.setupHandlers();
    });
  }

  private gameOverOutOfBounds() {
    console.log('Game over: Out of bounds! Last hitter was:', this.lastHitter);
    this.gameState = 'missed';

    this.swipeHandler.resetSwipeState();
    this.computerAI.reset();

    this.shuttlecock.setVelocity(0, 0);
    this.physics.pause();

    let scoreMessage = '';

    if (this.lastHitter === 'player') {
      this.score.computer++;
      scoreMessage = 'Player hit out of bounds!\nComputer scores!';
    } else if (this.lastHitter === 'computer') {
      this.score.player++;
      scoreMessage = 'Computer hit out of bounds!\nPlayer scores!';
    } else {
      this.score.computer++;
      scoreMessage = 'Shot went out of bounds!\nComputer scores!';
    }

    this.scoreText.setText(`Player: ${this.score.player}  Computer: ${this.score.computer}`);

    const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${scoreMessage}\nTap to restart`, {
      fontSize: '24px',
      color: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    }).setOrigin(0.5);

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Restart tapped');
      gameOverText.destroy();
      this.physics.resume();
      this.serveShuttlecock();
      this.swipeHandler.setupHandlers();
    });
  }
}