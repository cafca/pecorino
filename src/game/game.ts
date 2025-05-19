import { createWorld, defineQuery, removeEntity, type IWorld } from "bitecs";
import { Application, Assets, Container, Graphics } from "pixi.js";
import { CompositeTilemap } from "@pixi/tilemap";
import {
  Position,
  PlayerControlled,
  ForagerRole,
  Food,
  Nest,
  TargetVisualization,
} from "./components";
import { Camera } from "./components/Camera";
import {
  InputSystem,
  MovementSystem,
  RenderSystem,
  ForageBehaviorSystem,
  AntStateSystem,
  AgingSystem,
} from "../systems";
import { TargetVisualizationSystem } from "../systems/TargetVisualizationSystem";
import {
  INITIAL_SPAWN_RATE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  DEFAULT_SHOW_TARGETS,
} from "./constants";
import { MapLoader } from "./mapLoader";
import { createAnt } from "./prefabs/ant";
import { createFood } from "./prefabs/food";
import { createNest } from "./prefabs/nest";
import { createCamera } from "./prefabs/camera";
import { CameraSystem } from "../systems/CameraSystem";

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
  private targetVisualizationSystem: (world: IWorld) => void;
  private cameraSystem: () => void;
  private playerQuery = defineQuery([Position, PlayerControlled]);
  private antQuery = defineQuery([Position, ForagerRole]);
  private simulationSpeed = 1;
  private spawnTimer = 0;
  private spawnRate = INITIAL_SPAWN_RATE; // seconds between spawns
  private tilemap!: CompositeTilemap;
  private mapWidth = 0;
  private mapHeight = 0;
  private gameContainer: Container;
  private targetGraphics: Graphics;
  private showTargets = DEFAULT_SHOW_TARGETS;
  private mapLoader: MapLoader;

  // HUD state
  private colonyFood = 0;
  private foodInWorld = 0;
  private antCount = 0;

  private constructor(app: Application) {
    this.app = app;

    // Create main game container
    this.gameContainer = new Container();
    this.app.stage.addChild(this.gameContainer);

    // Create graphics for target visualization
    this.targetGraphics = new Graphics();
    this.app.stage.addChild(this.targetGraphics);

    this.inputSystem = InputSystem(this.world);
    this.movementSystem = MovementSystem(this.world);
    this.renderSystem = RenderSystem(this.app)(this.world);
    this.forageBehaviorSystem = ForageBehaviorSystem(this.world);
    this.antStateSystem = AntStateSystem(this.world);
    this.agingSystem = AgingSystem(this.world);
    this.targetVisualizationSystem = TargetVisualizationSystem(
      this.targetGraphics
    );

    this.mapLoader = new MapLoader(this.world);

    // Initialize camera using the prefab
    createCamera(this.world);
    this.cameraSystem = CameraSystem(this.world, this.gameContainer);
  }

  private async initAssets() {
    // Add assets to the bundle
    Assets.add({
      alias: "ant",
      src: "/pecorino/assets/sprites/ant.png",
    });
    Assets.add({
      alias: "food",
      src: "/pecorino/assets/sprites/food.png",
    });
    Assets.add({
      alias: "nest",
      src: "/pecorino/assets/sprites/nest.png",
    });
    Assets.add({
      alias: "tree",
      src: "/pecorino/assets/sprites/tree.png",
    });
    Assets.add({
      alias: "map",
      src: "/pecorino/assets/maps/map02.json",
    });
    Assets.add({
      alias: "tilesheet",
      src: "/pecorino/assets/tilesets/terrain_tiles_v2.png",
    });
    Assets.add({
      alias: "tileset",
      src: "/pecorino/assets/tilesets/terrain2.xml",
    });

    // Load all assets
    await Assets.load([
      "ant",
      "food",
      "map",
      "nest",
      "tileset",
      "tilesheet",
      "tree",
    ]);
  }

  public createAnt(
    x: number,
    y: number,
    isPlayer: boolean = false,
    initialAge?: number
  ) {
    return createAnt(this.world, {
      x,
      y,
      isPlayer,
      initialAge,
      showTargets: this.showTargets,
    });
  }

  public createFood(x: number, y: number) {
    return createFood(this.world, { x, y });
  }

  private createNest(x: number, y: number) {
    // Create the nest in the center of the map
    return createNest(this.world, { x, y });
  }

  private initDemo() {
    // Create nest at center of world map
    const centerX = WORLD_WIDTH / 2;
    const centerY = WORLD_HEIGHT / 2;
    this.createNest(centerX, centerY);

    // Create player ant slightly below nest
    this.createAnt(centerX, centerY + 32, true);

    // Create 4 AI ants in random positions around center
    for (let i = 0; i < 4; i++) {
      const radius = Math.random() * 75; // Random radius up to 75 pixels
      const angle = Math.random() * Math.PI * 2; // Random angle
      const x = centerX + Math.cos(angle) * radius; // Convert to x coordinate
      const y = centerY + Math.sin(angle) * radius; // Convert to y coordinate
      this.createAnt(x, y, false);
    }

    // Create 5 food items at random positions
    for (let i = 0; i < 5; i++) {
      this.spawnRandomFood();
    }
  }

  private async initMap() {
    const { width, height } = await this.mapLoader.loadMap(this.gameContainer);
    this.mapWidth = width;
    this.mapHeight = height;
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
        this.cameraSystem();
        this.targetVisualizationSystem(this.world);
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
      // Recenter tilemap
      if (this.tilemap) {
        this.tilemap.position.set(
          this.app.screen.width / 2 - this.mapWidth / 2,
          this.app.screen.height / 2 - this.mapHeight / 2
        );
      }
    });
  }

  public static async create(): Promise<Game> {
    const app = new Application();
    await app.init({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x222222,
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
    game.initMap();
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
      showTargets: this.showTargets,
    };
  }

  public getCamera() {
    const cameraQuery = defineQuery([Camera]);
    const entities = cameraQuery(this.world);
    if (entities.length === 0) return { x: 0, y: 0, zoom: 1 };
    const camera = entities[0];
    return {
      x: Camera.x[camera],
      y: Camera.y[camera],
      zoom: Camera.zoom[camera],
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
        const radius = Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius + WORLD_WIDTH / 2;
        const y = Math.sin(angle) * radius + WORLD_HEIGHT / 2;
        this.createAnt(x, y, false);
      }
    } else if (diff < 0) {
      // Remove ants (except player ant)
      const ants = this.antQuery(this.world).filter(
        (eid) => PlayerControlled.isPlayer[eid] === 0
      );
      for (let i = 0; i < -diff && i < ants.length; i++) {
        const ant = ants[i];
        removeEntity(this.world, ant);
      }
    }
  }

  private spawnRandomFood() {
    const spawnPoints = this.mapLoader.getFoodSpawnPoints();

    function closeTo(posX: number, posY: number): [number, number] {
      const radius = 100;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      const x = posX + Math.cos(angle) * distance;
      const y = posY + Math.sin(angle) * distance;
      return [x, y];
    }

    if (spawnPoints.length === 0) {
      console.log(
        `No food spawn points defined, falling back to random spawning`
      );
    }

    const centers =
      spawnPoints.length === 0
        ? Array.from({ length: 4 }, () => ({
            x: Math.random() * (window.innerWidth - 100) + 50,
            y: Math.random() * (window.innerHeight - 100) + 50,
          }))
        : spawnPoints;

    const center = centers[Math.floor(Math.random() * centers.length)];

    this.createFood(...closeTo(center.x, center.y));
  }

  public toggleTargetVisualization() {
    this.showTargets = !this.showTargets;
    const targetQuery = defineQuery([TargetVisualization]);
    const entities = targetQuery(this.world);
    entities.forEach((eid) => {
      TargetVisualization.visible[eid] = this.showTargets ? 1 : 0;
    });
  }
}
