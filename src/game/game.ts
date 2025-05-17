import { createWorld, addComponent, addEntity, defineQuery } from "bitecs";
import { Application, Assets } from "pixi.js";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  Target,
  Food,
} from "./components";
import {
  InputSystem,
  MovementSystem,
  RenderSystem,
  PheromoneDepositSystem,
  PheromoneFollowSystem,
  ForageBehaviorSystem,
} from "./systems";
import { PheromoneGrid } from "./pheromoneGrid";

export class Game {
  public readonly world = createWorld();
  private app: Application;
  private lastTime = 0;
  private inputSystem: () => void;
  private movementSystem: (delta: number) => void;
  private renderSystem: () => void;
  private pheromoneDepositSystem: () => void;
  private pheromoneFollowSystem: () => void;
  private forageBehaviorSystem: () => void;
  private pheromoneGrid: PheromoneGrid;
  private playerQuery = defineQuery([Position, PlayerControlled]);

  private constructor(app: Application) {
    this.app = app;
    this.pheromoneGrid = new PheromoneGrid(100, 100); // 100x100 tile grid
    this.inputSystem = InputSystem(this.world);
    this.movementSystem = MovementSystem(this.world);
    this.renderSystem = RenderSystem(this.app)(this.world);
    this.pheromoneDepositSystem = PheromoneDepositSystem(this.pheromoneGrid)(
      this.world
    );
    this.pheromoneFollowSystem = PheromoneFollowSystem(this.pheromoneGrid)(
      this.world
    );
    this.forageBehaviorSystem = ForageBehaviorSystem(this.world);
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

  private createAnt(x: number, y: number) {
    const ant = addEntity(this.world);

    addComponent(this.world, Position, ant);
    addComponent(this.world, Velocity, ant);
    addComponent(this.world, Sprite, ant);
    addComponent(this.world, PheromoneEmitter, ant);
    addComponent(this.world, PheromoneSensor, ant);
    addComponent(this.world, ForagerRole, ant);
    addComponent(this.world, Target, ant);

    // Set initial values
    Position.x[ant] = x;
    Position.y[ant] = y;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    Sprite.texture[ant] = 0;
    Sprite.width[ant] = 32;
    Sprite.height[ant] = 32;
    Sprite.scale[ant] = 0.1;
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 0;
    PheromoneSensor.radius[ant] = 20;
    PheromoneSensor.sensitivity[ant] = 0.5;
    ForagerRole.state[ant] = 0;
    ForagerRole.foodCarried[ant] = 0;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 0;

    return ant;
  }

  private createFood(x: number, y: number) {
    const food = addEntity(this.world);

    addComponent(this.world, Position, food);
    addComponent(this.world, Sprite, food);
    addComponent(this.world, Food, food);

    Position.x[food] = x;
    Position.y[food] = y;
    Sprite.texture[food] = 0;
    Sprite.width[food] = 32;
    Sprite.height[food] = 32;
    Sprite.scale[food] = 0.1;
    Food.amount[food] = 1;

    return food;
  }

  private initDemo() {
    // Create 30 ants at nest (0,0)
    for (let i = 0; i < 30; i++) {
      this.createAnt(0, 0);
    }

    // Create 5 food items at random positions
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      this.createFood(x, y);
    }
  }

  private initGameLoop() {
    this.app.ticker.add(() => {
      const currentTime = window.performance.now();
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      this.inputSystem();
      this.movementSystem(delta);
      this.pheromoneDepositSystem();
      this.pheromoneFollowSystem();
      this.forageBehaviorSystem();
      this.pheromoneGrid.update(delta);
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
    game.initDemo();
    game.initGameLoop();
    game.initResizeHandler();

    return game;
  }

  public getPlayerPosition(): { x: number; y: number } {
    const players = this.playerQuery(this.world);
    if (players.length === 0) {
      return { x: 0, y: 0 };
    }
    const player = players[0];
    return {
      x: Position.x[player],
      y: Position.y[player],
    };
  }

  public getEntityPosition(entityId: number): { x: number; y: number } | null {
    if (!Position.x[entityId] || !Position.y[entityId]) {
      return null;
    }
    return {
      x: Position.x[entityId],
      y: Position.y[entityId],
    };
  }
}
