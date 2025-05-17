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
  private antQuery = defineQuery([Position, ForagerRole]);
  private foodQuery = defineQuery([Position, Food]);
  private simulationSpeed = 1;
  private spawnTimer = 0;
  private spawnRate = 5; // seconds between spawns

  // HUD state
  private colonyFood = 0;
  private antCount = 0;

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
    // Food
    Assets.add({
      alias: "food",
      src: "/assets/sprites/food.png",
    });
    // Nest
    Assets.add({
      alias: "nest",
      src: "/assets/sprites/nest.png",
    });
    const textures = await Assets.load(["ant", "food", "nest"]);
    console.log("Assets loaded", textures);
  }

  private createAnt(x: number, y: number, isPlayer: boolean = false) {
    const ant = addEntity(this.world);

    addComponent(this.world, Position, ant);
    addComponent(this.world, Velocity, ant);
    addComponent(this.world, Sprite, ant);
    addComponent(this.world, PlayerControlled, ant);
    addComponent(this.world, PheromoneEmitter, ant);
    addComponent(this.world, PheromoneSensor, ant);
    addComponent(this.world, ForagerRole, ant);
    addComponent(this.world, Target, ant);

    // Set initial values
    Position.x[ant] = x;
    Position.y[ant] = y;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PlayerControlled.speed[ant] = 100;
    PlayerControlled.isPlayer[ant] = isPlayer ? 1 : 0;
    Sprite.texture[ant] = 0; // ant texture
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
    Sprite.texture[food] = 1; // food texture
    Sprite.width[food] = 32;
    Sprite.height[food] = 32;
    Sprite.scale[food] = 0.1;
    Food.amount[food] = 1;

    return food;
  }

  private createNest() {
    const nest = addEntity(this.world);

    addComponent(this.world, Position, nest);
    addComponent(this.world, Sprite, nest);

    Position.x[nest] = 0;
    Position.y[nest] = 0;
    Sprite.texture[nest] = 2; // nest texture
    Sprite.width[nest] = 64; // Make nest bigger than ants
    Sprite.height[nest] = 64;
    Sprite.scale[nest] = 0.2;

    return nest;
  }

  private initDemo() {
    // Create nest at (0,0)
    this.createNest();

    // Create player ant
    this.createAnt(0, 32, true);

    // Create 4 AI ants in random positions around center
    for (let i = 0; i < 4; i++) {
      const radius = Math.random() * 300; // Random radius up to 300 pixels
      const angle = Math.random() * Math.PI * 2; // Random angle
      const x = Math.cos(angle) * radius; // Convert to x coordinate
      const y = Math.sin(angle) * radius; // Convert to y coordinate
      this.createAnt(x, y, false);
    }

    // Create 5 food items at random positions
    for (let i = 0; i < 5; i++) {
      const x = (Math.random() - 0.5) * 800;
      const y = (Math.random() - 0.5) * 800;
      this.createFood(x, y);
    }
  }

  private initGameLoop() {
    this.app.ticker.add(() => {
      const currentTime = window.performance.now();
      const delta = (currentTime - this.lastTime) / 1000;
      this.lastTime = currentTime;

      // Apply simulation speed
      const adjustedDelta = delta * this.simulationSpeed;

      this.inputSystem();
      this.movementSystem(adjustedDelta);
      this.pheromoneDepositSystem();
      this.pheromoneFollowSystem();
      this.forageBehaviorSystem();
      this.pheromoneGrid.update(adjustedDelta);
      this.renderSystem();

      // Handle food spawning
      this.spawnTimer += adjustedDelta;
      if (this.spawnTimer >= this.spawnRate) {
        this.spawnTimer = 0;
        this.spawnRandomFood();
      }

      // Update HUD state
      this.updateHUDState();
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
    const gameContainer = document.getElementById("game-container");
    if (!gameContainer) throw new Error("Game container not found");
    gameContainer.appendChild(app.canvas);

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

  private updateHUDState() {
    // Count ants
    this.antCount = this.antQuery(this.world).length;

    // Count food in colony (food carried by ants)
    this.colonyFood = this.antQuery(this.world).reduce((total, ant) => {
      return total + (ForagerRole.foodCarried[ant] === 1 ? 1 : 0);
    }, 0);
  }

  public getHUDState() {
    return {
      foodCount: this.colonyFood,
      antCount: this.antCount,
      simulationSpeed: this.simulationSpeed,
      spawnRate: this.spawnRate,
    };
  }

  public toggleSimulationSpeed() {
    this.simulationSpeed = this.simulationSpeed === 1 ? 4 : 1;
  }

  public setSpawnRate(rate: number) {
    this.spawnRate = Math.max(0.5, Math.min(10, rate));
  }

  private spawnRandomFood() {
    const x = (Math.random() - 0.5) * 800;
    const y = (Math.random() - 0.5) * 800;
    this.createFood(x, y);
  }
}
