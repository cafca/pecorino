import { describe, expect, it, beforeEach } from "vitest";
import type { IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Sprite,
  ForagerRole,
  Food,
  Nest,
  Target,
  PlayerControlled,
} from "../game/components";
import { createWorld, addComponent, addEntity, defineQuery } from "bitecs";
import { MovementSystem, ForageBehaviorSystem } from "../systems";
import {
  NEST_RADIUS,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ANT_SPEED,
} from "@/game/constants";
import { createAnt } from "@/game/prefabs/ant";
import { createNest } from "@/game/prefabs/nest";
import { createCamera } from "@/game/prefabs/camera";
import { Camera } from "../game/components/Camera";

describe("Game Components", () => {
  describe("Position", () => {
    it("should store x and y coordinates as float32", () => {
      expect(Position.x).toBeDefined();
      expect(Position.y).toBeDefined();
    });
  });

  describe("Velocity", () => {
    it("should store x and y velocity components as float32", () => {
      expect(Velocity.x).toBeDefined();
      expect(Velocity.y).toBeDefined();
    });
  });

  describe("Sprite", () => {
    it("should store sprite rendering properties", () => {
      expect(Sprite.texture).toBeDefined();
      expect(Sprite.width).toBeDefined();
      expect(Sprite.height).toBeDefined();
      expect(Sprite.scale).toBeDefined();
    });
  });

  describe("ForagerRole", () => {
    it("should store ant foraging state", () => {
      expect(ForagerRole.state).toBeDefined();
      expect(ForagerRole.foodCarried).toBeDefined();
    });
  });

  describe("Food", () => {
    it("should store food amount", () => {
      expect(Food.amount).toBeDefined();
    });
  });
});

describe("MovementSystem", () => {
  let world: IWorld;
  let movementSystem: (delta: number) => void;

  beforeEach(() => {
    world = createWorld();
    movementSystem = MovementSystem(world);
    createCamera(world);
  });

  it("should update position based on velocity and delta time", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);

    Position.x[entity] = 0;
    Position.y[entity] = 0;
    Velocity.x[entity] = 10;
    Velocity.y[entity] = 5;

    movementSystem(0.5);

    expect(Position.x[entity]).toBe(5);
    expect(Position.y[entity]).toBe(2.5);
  });

  it("should not move entities without velocity component", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);

    Position.x[entity] = 10;
    Position.y[entity] = 10;

    movementSystem(1.0);

    expect(Position.x[entity]).toBe(10);
    expect(Position.y[entity]).toBe(10);
  });

  it("should handle multiple entities correctly", () => {
    const entity1 = addEntity(world);
    const entity2 = addEntity(world);

    addComponent(world, Position, entity1);
    addComponent(world, Velocity, entity1);
    addComponent(world, PlayerControlled, entity1);
    addComponent(world, Position, entity2);
    addComponent(world, Velocity, entity2);
    addComponent(world, PlayerControlled, entity2);

    Position.x[entity1] = 0;
    Position.y[entity1] = 0;
    PlayerControlled.speed[entity1] = ANT_SPEED;
    Velocity.x[entity1] = ANT_SPEED;
    Velocity.y[entity1] = ANT_SPEED;

    Position.x[entity2] = 10;
    Position.y[entity2] = 10;
    PlayerControlled.speed[entity2] = ANT_SPEED;
    Velocity.x[entity2] = -ANT_SPEED;
    Velocity.y[entity2] = -ANT_SPEED;

    movementSystem(1.0);

    expect(Math.round(Position.x[entity1])).toBe(ANT_SPEED);
    expect(Math.round(Position.y[entity1])).toBe(ANT_SPEED);
    expect(Math.round(Position.x[entity2])).toBe(0);
    expect(Math.round(Position.y[entity2])).toBe(0);
  });

  it("should keep entities within grid boundaries", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;

    // Test right boundary
    Position.x[entity] = WORLD_WIDTH - 10;
    Position.y[entity] = 0;
    Velocity.x[entity] = 100;
    Velocity.y[entity] = 0;

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(WORLD_WIDTH);
    expect(Velocity.x[entity]).toBe(0);

    // Test left boundary
    Position.x[entity] = 0;
    Position.y[entity] = 0;
    Velocity.x[entity] = -100;
    Velocity.y[entity] = 0;

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(0);
    expect(Velocity.x[entity]).toBe(0);

    // Test bottom boundary
    Position.x[entity] = 0;
    Position.y[entity] = WORLD_HEIGHT - 10;
    Velocity.x[entity] = 0;
    Velocity.y[entity] = 100;

    movementSystem(1.0);
    expect(Position.y[entity]).toBe(WORLD_HEIGHT);
    expect(Velocity.y[entity]).toBe(0);

    // Test top boundary
    Position.x[entity] = 0;
    Position.y[entity] = 0;
    Velocity.x[entity] = 0;
    Velocity.y[entity] = -100;

    movementSystem(1.0);
    expect(Position.y[entity]).toBe(0);
    expect(Velocity.y[entity]).toBe(0);
  });

  it("should handle diagonal movement at boundaries", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;

    // Test diagonal movement into corner
    Position.x[entity] = WORLD_WIDTH - 10;
    Position.y[entity] = WORLD_HEIGHT - 10;
    Velocity.x[entity] = 150;
    Velocity.y[entity] = 150;

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(WORLD_WIDTH);
    expect(Position.y[entity]).toBe(WORLD_HEIGHT);
    expect(Velocity.x[entity]).toBe(0);
    expect(Velocity.y[entity]).toBe(0);
  });
});

describe("HUD", () => {
  it("shows correct food count from the nest", () => {
    const world = createWorld();
    // Create nest
    const nest = createNest(world, {
      x: 0,
      y: 0,
    });

    // // Create an ant carrying food
    const ant = createAnt(world, {
      x: NEST_RADIUS / 2,
      y: NEST_RADIUS / 2,
      isPlayer: false,
      initialAge: 0,
    });
    ForagerRole.state[ant] = 1; // Carrying food
    ForagerRole.foodCarried[ant] = 1;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 1;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;

    // Run forage behavior system
    const forageSystem = ForageBehaviorSystem(world);
    forageSystem();

    // Get HUD state (simulate)
    const hudState = {
      foodCount: Nest.foodCount[nest],
      foodInWorld: 0,
      antCount: 1,
      simulationSpeed: 1,
      spawnRate: 5,
    };
    expect(hudState.foodCount).toBe(1);
  });
});

describe("Food in World", () => {
  let world: IWorld;

  beforeEach(() => {
    world = createWorld();
  });

  it("increases food count when new food is spawned", () => {
    // Create initial food
    const food = addEntity(world);
    addComponent(world, Position, food);
    addComponent(world, Food, food);
    Position.x[food] = 100;
    Position.y[food] = 100;
    Food.amount[food] = 1;

    const foodQuery = defineQuery([Food]);
    const initialFoodCount = foodQuery(world).length;

    // Spawn new food
    const newFood = addEntity(world);
    addComponent(world, Position, newFood);
    addComponent(world, Food, newFood);
    Position.x[newFood] = 200;
    Position.y[newFood] = 200;
    Food.amount[newFood] = 1;

    const newFoodCount = foodQuery(world).length;
    expect(newFoodCount).toBe(initialFoodCount + 1);
  });

  it("decreases food count when ant picks up food", () => {
    // Create food
    const food = addEntity(world);
    addComponent(world, Position, food);
    addComponent(world, Food, food);
    Position.x[food] = 100;
    Position.y[food] = 100;
    Food.amount[food] = 1;

    const foodQuery = defineQuery([Food]);
    const initialFoodCount = foodQuery(world).length;

    // Create an ant near food
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PlayerControlled, ant);
    PlayerControlled.isPlayer[ant] = 0;
    PlayerControlled.speed[ant] = 0;

    Position.x[ant] = Position.x[food];
    Position.y[ant] = Position.y[food];

    // Set ant to search for food
    ForagerRole.state[ant] = 0; // Searching for food
    Target.x[ant] = Position.x[food];
    Target.y[ant] = Position.y[food];
    Target.type[ant] = 0;

    // Run forage behavior system to collect food
    const forageSystem = ForageBehaviorSystem(world);
    forageSystem();

    const remainingFoodCount = foodQuery(world).length;
    expect(remainingFoodCount).toBe(initialFoodCount - 1);
  });
});

describe("Camera and Movement Integration", () => {
  let world: IWorld;
  let movementSystem: (delta: number) => void;
  let cameraEntity: number;

  beforeEach(() => {
    world = createWorld();
    movementSystem = MovementSystem(world);
    cameraEntity = createCamera(world);
  });

  it("should maintain correct world boundaries when zoomed in", () => {
    Camera.zoom[cameraEntity] = 2;

    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;

    Position.x[entity] = WORLD_WIDTH - 10;
    Velocity.x[entity] = 100;

    movementSystem(1.0);

    expect(Position.x[entity]).toBe(WORLD_WIDTH);
    expect(Velocity.x[entity]).toBe(0);
  });

  it("should maintain correct world boundaries when zoomed out", () => {
    Camera.zoom[cameraEntity] = 0.5;

    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;

    Position.x[entity] = WORLD_WIDTH - 10;
    Velocity.x[entity] = 100;

    movementSystem(1.0);

    expect(Position.x[entity]).toBe(WORLD_WIDTH);
    expect(Velocity.x[entity]).toBe(0);
  });

  it("should scale velocity correctly with zoom level", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;
    PlayerControlled.speed[entity] = 100;

    const testZoomLevels = [0.5, 1, 2];
    const startX = 100;
    const baseVelocity = 50;

    for (const zoom of testZoomLevels) {
      Camera.zoom[cameraEntity] = zoom;
      Position.x[entity] = startX;
      Velocity.x[entity] = baseVelocity;

      movementSystem(1.0);

      const expectedMovement = baseVelocity;
      expect(Position.x[entity]).toBe(startX + expectedMovement);

      Position.x[entity] = startX;
    }
  });

  it("should handle diagonal movement correctly at different zoom levels", () => {
    Camera.zoom[cameraEntity] = 2;

    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);
    addComponent(world, PlayerControlled, entity);
    PlayerControlled.isPlayer[entity] = 1;
    PlayerControlled.speed[entity] = 100;

    Position.x[entity] = WORLD_WIDTH - 10;
    Position.y[entity] = WORLD_HEIGHT - 10;
    Velocity.x[entity] = 100;
    Velocity.y[entity] = 100;

    movementSystem(1.0);

    expect(Position.x[entity]).toBe(WORLD_WIDTH);
    expect(Position.y[entity]).toBe(WORLD_HEIGHT);
    expect(Velocity.x[entity]).toBe(0);
    expect(Velocity.y[entity]).toBe(0);
  });
});
