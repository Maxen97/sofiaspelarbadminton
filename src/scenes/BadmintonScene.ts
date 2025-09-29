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
  private gameState: GameState = 'ready';
  private lastLogTime: number = 0;
  private score: GameScore = { player: 0, computer: 0 };
  private banner!: Phaser.GameObjects.Image;
  private playerScoreText!: Phaser.GameObjects.Text;
  private computerScoreText!: Phaser.GameObjects.Text;
  private lastHitter: 'player' | 'computer' | null = null;

  private courtRenderer!: CourtRenderer;
  private swipeHandler!: SwipeHandler;
  private computerAI!: ComputerAI;
  private playerCharacter!: PlayerCharacter;
  private computerCharacter!: ComputerCharacter;
  private characterSelection: CharacterSelection;

  constructor(characterSelection: CharacterSelection) {
    super({ key: 'BadmintonScene' });
    this.characterSelection = characterSelection;
  }

  preload() {
    this.courtRenderer = new CourtRenderer(this);
    this.courtRenderer.createTextures();
    this.load.image('playerBody', this.characterSelection.player.spriteBodyUrl);
    this.load.image('computerBody', this.characterSelection.computer.spriteBodyUrl);
    this.load.image('playerArm', '/sprites/arm.png');
    this.load.image('banner', '/sprites/banner.png');
    this.load.image('arena', '/sprites/arena.png');
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

    this.playerCharacter = new PlayerCharacter(this, this.courtRenderer);
    this.playerCharacter.create(this.courtRenderer.getDimensions());

    this.computerCharacter = new ComputerCharacter(this, this.courtRenderer);
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

    const bannerHeight = 80;
    const bannerScale = bannerHeight / this.textures.get('banner').getSourceImage().height;

    this.banner = this.add.image(width / 2, 0, 'banner')
      .setOrigin(0.5, 0)
      .setScale(bannerScale);

    this.playerScoreText = this.add.text(width * 0.4, bannerHeight / 2, this.score.player.toString(), {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    this.computerScoreText = this.add.text(width * 0.6, bannerHeight / 2, this.score.computer.toString(), {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
  }

  update() {
    if (this.gameState === 'playing' && this.shuttlecock && this.shuttlecock.body) {
      const { width } = this.scale;
      const x = this.shuttlecock.x;
      const y = this.shuttlecock.y;
      const currentVelocity = this.shuttlecock.body.velocity;

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
        .setOrigin(0.5, 0.5);
    } else {
      this.shuttlecock.setPosition(courtBounds.right - 20, serveY);
    }

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

  private gameOver() {
    console.log('Game over triggered');
    this.gameState = 'missed';

    this.swipeHandler.resetSwipeState();
    this.computerAI.reset();

    if (this.shuttlecock) {
      this.shuttlecock.setVelocity(0, 0);
    }
    this.physics.pause();

    const { width } = this.scale;
    let scoreMessage = '';

    if (this.shuttlecock && this.shuttlecock.x > width / 2) {
      this.score.player++;
      scoreMessage = 'Snyggt!';
    } else {
      this.score.computer++;
      scoreMessage = 'Å nej!';
    }

    this.playerScoreText.setText(this.score.player.toString());
    this.computerScoreText.setText(this.score.computer.toString());

    const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${scoreMessage}\nTryck för att fortsätta`, {
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

  private showReadyMessage() {
    const readyText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Tryck för att spela', {
      fontSize: '24px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
      align: 'center'
    }).setOrigin(0.5);

    this.swipeHandler.setupRestartHandler(() => {
      console.log('Game started');
      readyText.destroy();
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
    this.physics.pause();

    let scoreMessage = '';

    if (this.lastHitter === 'player') {
      this.score.computer++;
      scoreMessage = 'Utanför!\nMotståndare får poäng!';
    } else if (this.lastHitter === 'computer') {
      this.score.player++;
      scoreMessage = 'Utanför!\nPoäng till dig!';
    } else {
      this.score.computer++;
      scoreMessage = 'Utanför!\nMotståndare poängterar!';
    }

    this.playerScoreText.setText(this.score.player.toString());
    this.computerScoreText.setText(this.score.computer.toString());

    const gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, `${scoreMessage}\nTryck för att fortsätta`, {
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