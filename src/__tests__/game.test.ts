import { describe, expect, it, beforeEach } from "vitest";
import type { IWorld } from "bitecs";
import {
  Position,
  Velocity,
  Sprite,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  Food,
} from "../game/components";
import { createWorld, addComponent, addEntity } from "bitecs";
import { MovementSystem } from "../systems/systems";

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

  beforeEach(() => {
    world = createWorld();
    movementSystem = MovementSystem(world);
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
});
