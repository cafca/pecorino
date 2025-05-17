import { createWorld, addComponent, addEntity } from "bitecs";
import { Application, Assets } from "pixi.js";
import { Position, Velocity, Sprite, PlayerControlled } from "./components";
import { InputSystem, MovementSystem, RenderSystem } from "./systems";

export class Game {
  public readonly world = createWorld();
  private app: Application;
  private lastTime = 0;
  private inputSystem: () => void;
  private movementSystem: (delta: number) => void;
  private renderSystem: () => void;

  private constructor(app: Application) {
    this.app = app;
    this.inputSystem = InputSystem(this.world);
    this.movementSystem = MovementSystem(this.world);
    this.renderSystem = RenderSystem(this.app)(this.world);
  }

  private async loadAssets(): Promise<void> {
    // Ant
    Assets.add({
      alias: "ant",
      src: "/assets/sprites/ant.png",
    });
    const textures = await Assets.load(["ant"]);
    console.log("Assets loaded", textures);
  }

  private initPlayer() {
    const player = addEntity(this.world);
    console.log("Created player entity:", player);

    addComponent(this.world, Position, player);
    addComponent(this.world, Velocity, player);
    addComponent(this.world, Sprite, player);
    addComponent(this.world, PlayerControlled, player);

    // Set initial values
    Position.x[player] = 0;
    Position.y[player] = 0;
    Velocity.x[player] = 0;
    Velocity.y[player] = 0;
    Sprite.texture[player] = 0;
    Sprite.width[player] = 32;
    Sprite.height[player] = 32;
    Sprite.scale[player] = 1;
    PlayerControlled.speed[player] = 200;

    console.log("Player entity initialized:", {
      position: { x: Position.x[player], y: Position.y[player] },
      velocity: { x: Velocity.x[player], y: Velocity.y[player] },
      sprite: {
        texture: Sprite.texture[player],
        width: Sprite.width[player],
        height: Sprite.height[player],
        scale: Sprite.scale[player],
      },
      speed: PlayerControlled.speed[player],
    });
  }

  private initGameLoop() {
    this.app.ticker.add(() => {
      const currentTime = window.performance.now();
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.inputSystem();
      this.movementSystem(delta);
      this.renderSystem();
    });
  }

  private initResizeHandler() {
    window.addEventListener("resize", () => {
      this.app.renderer.resize(window.innerWidth, window.innerHeight);
    });
  }

  public static async create(): Promise<Game> {
    const app = new Application();
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1099bb,
      antialias: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    document.body.appendChild(app.canvas);

    const game = new Game(app);
    await game.loadAssets();
    game.initPlayer();
    game.initGameLoop();
    game.initResizeHandler();

    return game;
  }
}
