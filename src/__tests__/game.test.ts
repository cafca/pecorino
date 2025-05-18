import { describe, expect, it, beforeEach, afterEach } from "vitest";
import type { IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Sprite,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  Food,
  Nest,
  Target,
} from "../game/components";
import { createWorld, addComponent, addEntity } from "bitecs";
import { MovementSystem, ForageBehaviorSystem } from "../systems/systems";
import { PheromoneGrid } from "../game/pheromoneGrid";

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

  describe("PheromoneEmitter", () => {
    it("should store pheromone emission properties", () => {
      expect(PheromoneEmitter.strength).toBeDefined();
      expect(PheromoneEmitter.isEmitting).toBeDefined();
    });
  });

  describe("PheromoneSensor", () => {
    it("should store pheromone sensing properties", () => {
      expect(PheromoneSensor.radius).toBeDefined();
      expect(PheromoneSensor.sensitivity).toBeDefined();
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
  let grid: PheromoneGrid;

  beforeEach(() => {
    world = createWorld();
    grid = new PheromoneGrid(800, 600); // 800x600 window
    (window as { game?: { pheromoneGrid: PheromoneGrid } }).game = {
      pheromoneGrid: grid,
    };
    movementSystem = MovementSystem(world);
  });

  afterEach(() => {
    delete (window as { game?: { pheromoneGrid: PheromoneGrid } }).game;
  });

  it("should update position based on velocity and delta time", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);

    // Set initial values
    Position.x[entity] = 0;
    Position.y[entity] = 0;
    Velocity.x[entity] = 10;
    Velocity.y[entity] = 5;

    // Run system with 0.5s delta
    movementSystem(0.5);

    // Position should be updated: pos = pos + vel * delta
    expect(Position.x[entity]).toBe(5); // 0 + 10 * 0.5
    expect(Position.y[entity]).toBe(2.5); // 0 + 5 * 0.5
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
    addComponent(world, Position, entity2);
    addComponent(world, Velocity, entity2);

    Position.x[entity1] = 0;
    Position.y[entity1] = 0;
    Velocity.x[entity1] = 1;
    Velocity.y[entity1] = 1;

    Position.x[entity2] = 10;
    Position.y[entity2] = 10;
    Velocity.x[entity2] = -1;
    Velocity.y[entity2] = -1;

    movementSystem(1.0);

    expect(Position.x[entity1]).toBe(1);
    expect(Position.y[entity1]).toBe(1);
    expect(Position.x[entity2]).toBe(9);
    expect(Position.y[entity2]).toBe(9);
  });

  it("should keep entities within grid boundaries", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);

    // Test right boundary
    Position.x[entity] = 390; // Just inside right boundary
    Position.y[entity] = 0;
    Velocity.x[entity] = 100; // Moving right
    Velocity.y[entity] = 0;

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(400); // Should stop at boundary
    expect(Velocity.x[entity]).toBe(0); // Velocity should be zeroed

    // Test left boundary
    Position.x[entity] = -390; // Just inside left boundary
    Position.y[entity] = 0;
    Velocity.x[entity] = -100; // Moving left
    Velocity.y[entity] = 0;

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(-400); // Should stop at boundary
    expect(Velocity.x[entity]).toBe(0); // Velocity should be zeroed

    // Test bottom boundary
    Position.x[entity] = 0;
    Position.y[entity] = 290; // Just inside bottom boundary
    Velocity.x[entity] = 0;
    Velocity.y[entity] = 100; // Moving down

    movementSystem(1.0);
    expect(Position.y[entity]).toBe(300); // Should stop at boundary
    expect(Velocity.y[entity]).toBe(0); // Velocity should be zeroed

    // Test top boundary
    Position.x[entity] = 0;
    Position.y[entity] = -290; // Just inside top boundary
    Velocity.x[entity] = 0;
    Velocity.y[entity] = -100; // Moving up

    movementSystem(1.0);
    expect(Position.y[entity]).toBe(-300); // Should stop at boundary
    expect(Velocity.y[entity]).toBe(0); // Velocity should be zeroed
  });

  it("should handle diagonal movement at boundaries", () => {
    const entity = addEntity(world);
    addComponent(world, Position, entity);
    addComponent(world, Velocity, entity);

    // Test diagonal movement into corner
    Position.x[entity] = 390; // Near right boundary
    Position.y[entity] = 290; // Near bottom boundary
    Velocity.x[entity] = 100; // Moving right
    Velocity.y[entity] = 100; // Moving down

    movementSystem(1.0);
    expect(Position.x[entity]).toBe(400); // Should stop at right boundary
    expect(Position.y[entity]).toBe(300); // Should stop at bottom boundary
    expect(Velocity.x[entity]).toBe(0); // X velocity should be zeroed
    expect(Velocity.y[entity]).toBe(0); // Y velocity should be zeroed
  });
});

describe("HUD", () => {
  it("shows correct food count from the nest", () => {
    const world = createWorld();
    // Create nest
    const nest = addEntity(world);
    addComponent(world, Position, nest);
    addComponent(world, Nest, nest);
    Position.x[nest] = 0;
    Position.y[nest] = 0;

    // Create an ant carrying food
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, Velocity, ant);
    Position.x[ant] = 20;
    Position.y[ant] = 20;
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
      antCount: 1,
      simulationSpeed: 1,
      spawnRate: 5,
    };
    expect(hudState.foodCount).toBe(1);
  });
});
