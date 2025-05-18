import {
  createWorld,
  addComponent,
  addEntity,
  defineQuery,
  removeComponent,
} from "bitecs";
import { Application, Assets } from "pixi.js";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  ForagerRole,
  Target,
  Food,
  AntState,
  Nest,
  Age,
} from "./components";
import {
  InputSystem,
  MovementSystem,
  RenderSystem,
  ForageBehaviorSystem,
  AntStateSystem,
  AgingSystem,
} from "../systems/systems";
import { ANT_MAX_AGE } from "./constants";

export class Game {
  public readonly world = createWorld();
  private app: Application;
  private lastTime = 0;
  private inputSystem: () => void;
  private movementSystem: (delta: number) => void;
  private renderSystem: () => void;
  private forageBehaviorSystem: () => void;
  private antStateSystem: () => void;
  private agingSystem: (delta: number) => void;
  private playerQuery = defineQuery([Position, PlayerControlled]);
  private antQuery = defineQuery([Position, ForagerRole]);
  private simulationSpeed = 1;
  private spawnTimer = 0;
  private spawnRate = 5; // seconds between spawns

  // HUD state
  private colonyFood = 0;
  private foodInWorld = 0;
  private antCount = 0;

  private constructor(app: Application) {
    this.app = app;
    this.inputSystem = InputSystem(this.world);
    this.movementSystem = MovementSystem(this.world);
    this.renderSystem = RenderSystem(this.app)(this.world);
    this.forageBehaviorSystem = ForageBehaviorSystem(this.world);
    this.antStateSystem = AntStateSystem(this.world);
    this.agingSystem = AgingSystem(this.world);
  }

  private async initAssets() {
    // Add assets to the bundle
    Assets.add({
      alias: "ant",
      src: "/assets/sprites/ant.png",
    });
    Assets.add({
      alias: "food",
      src: "/assets/sprites/food.png",
    });
    Assets.add({
      alias: "nest",
      src: "/assets/sprites/nest.png",
    });

    // Load all assets
    await Assets.load(["ant", "food", "nest"]);
  }

  public createAnt(
    x: number,
    y: number,
    isPlayer: boolean = false,
    initialAge?: number
  ) {
    const ant = addEntity(this.world);

    addComponent(this.world, Position, ant);
    addComponent(this.world, Velocity, ant);
    addComponent(this.world, Sprite, ant);
    addComponent(this.world, PlayerControlled, ant);
    addComponent(this.world, ForagerRole, ant);
    addComponent(this.world, Target, ant);
    addComponent(this.world, AntState, ant);
    addComponent(this.world, Age, ant);

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
    ForagerRole.state[ant] = 0;
    ForagerRole.foodCarried[ant] = 0;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 0;
    AntState.currentState[ant] = 0;
    AntState.previousState[ant] = 0;
    AntState.stateTimer[ant] = 0;
    Age.maxAge[ant] = ANT_MAX_AGE;
    Age.currentAge[ant] =
      initialAge !== undefined ? initialAge : Math.random() * 0.5 * ANT_MAX_AGE;

    return ant;
  }

  public createFood(x: number, y: number) {
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
    addComponent(this.world, Nest, nest);

    Position.x[nest] = 0;
    Position.y[nest] = 0;
    Sprite.texture[nest] = 2; // nest texture
    Sprite.width[nest] = 64; // Make nest bigger than ants
    Sprite.height[nest] = 64;
    Sprite.scale[nest] = 0.2;
    Nest.foodCount[nest] = 0;

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

      if (delta > 0) {
        const adjustedDelta = delta * this.simulationSpeed;

        this.inputSystem();
        this.movementSystem(adjustedDelta);
        this.forageBehaviorSystem();
        this.antStateSystem();
        this.agingSystem(adjustedDelta);
        this.renderSystem();

        // Handle food spawning
        this.spawnTimer += adjustedDelta;
        if (this.spawnTimer >= this.spawnRate) {
          this.spawnTimer = 0;
          this.spawnRandomFood();
        }

        // Update HUD state
        this.updateHUDState();
      }
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
    await game.initAssets();
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
    // Count food in nest
    const nestQuery = defineQuery([Nest]);
    const nests = nestQuery(this.world);
    this.colonyFood = nests.length > 0 ? Nest.foodCount[nests[0]] : 0;

    // Count food in world
    const foodQuery = defineQuery([Food]);
    this.foodInWorld = foodQuery(this.world).length;

    // Count ants
    this.antCount = this.antQuery(this.world).length;
  }

  public getHUDState() {
    return {
      foodCount: this.colonyFood,
      foodInWorld: this.foodInWorld,
      antCount: this.antCount,
      simulationSpeed: this.simulationSpeed,
      spawnRate: this.spawnRate,
    };
  }

  public toggleSimulationSpeed() {
    this.simulationSpeed = this.simulationSpeed === 1 ? 4 : 1;
  }

  public setSpawnRate(rate: number) {
    this.spawnRate = rate;
  }

  public setAntCount(count: number) {
    const currentCount = this.antQuery(this.world).length;
    const diff = count - currentCount;

    if (diff > 0) {
      // Add ants
      for (let i = 0; i < diff; i++) {
        const radius = Math.random() * 300;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        this.createAnt(x, y, false);
      }
    } else if (diff < 0) {
      // Remove ants (except player ant)
      const ants = this.antQuery(this.world).filter(
        (eid) => PlayerControlled.isPlayer[eid] === 0
      );
      for (let i = 0; i < -diff && i < ants.length; i++) {
        const ant = ants[i];
        removeComponent(this.world, Position, ant);
        removeComponent(this.world, Velocity, ant);
        removeComponent(this.world, Sprite, ant);
        removeComponent(this.world, PlayerControlled, ant);
        removeComponent(this.world, ForagerRole, ant);
        removeComponent(this.world, Target, ant);
        removeComponent(this.world, AntState, ant);
        removeComponent(this.world, Age, ant);
      }
    }
  }

  private spawnRandomFood() {
    // Create food clusters around specific locations
    const clusterCenters = [
      { x: 200, y: 200 },
      { x: -200, y: 200 },
      { x: 200, y: -200 },
      { x: -200, y: -200 },
    ];

    // Pick a random cluster center
    const center =
      clusterCenters[Math.floor(Math.random() * clusterCenters.length)];

    // Spawn food within a radius of the center
    const radius = 100;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = center.x + Math.cos(angle) * distance;
    const y = center.y + Math.sin(angle) * distance;

    this.createFood(x, y);
  }
}
