import { describe, expect, test, beforeEach } from "vitest";
import { PheromoneGrid } from "../game/pheromoneGrid";
import { createWorld, addComponent, addEntity } from "bitecs";
import {
  Position,
  Velocity,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  Target,
  Food,
} from "../game/components";
import {
  PheromoneDepositSystem,
  PheromoneFollowSystem,
  ForageBehaviorSystem,
} from "../game/systems";

describe("PheromoneGrid", () => {
  let grid: PheromoneGrid;

  beforeEach(() => {
    grid = new PheromoneGrid(10, 10); // 10x10 tile grid
  });

  test("deposit and sample pheromones", () => {
    grid.deposit(5, 5, 1.0);
    expect(grid.sample(5, 5)).toBeCloseTo(1.0);
  });

  test("pheromone evaporation and diffusion", () => {
    // Deposit a strong pheromone
    grid.deposit(5, 5, 1.0);
    const initialValue = grid.sample(5, 5);

    // Simulate several updates
    for (let i = 0; i < 10; i++) {
      grid.update(0.1); // 0.1 second delta
    }

    // Value should have decreased due to evaporation
    const finalValue = grid.sample(5, 5);
    expect(finalValue).toBeLessThan(initialValue);

    // Check if diffusion occurred
    const neighborValue = grid.sample(5.25, 5);
    expect(neighborValue).toBeGreaterThan(0);
  });
});

describe("Foraging System", () => {
  let world: ReturnType<typeof createWorld>;
  let grid: PheromoneGrid;

  beforeEach(() => {
    world = createWorld();
    grid = new PheromoneGrid(10, 10);
  });

  test("ant reaches food within 60 ticks", () => {
    // Create an ant at (0,0)
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, PheromoneSensor, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    Position.x[ant] = 0;
    Position.y[ant] = 0;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 0;
    PheromoneSensor.radius[ant] = 20;
    PheromoneSensor.sensitivity[ant] = 0.5;
    ForagerRole.state[ant] = 0;
    ForagerRole.foodCarried[ant] = 0;

    // Create food at (5,5)
    const food = addEntity(world);
    addComponent(world, Position, food);
    addComponent(world, Food, food);
    Position.x[food] = 5;
    Position.y[food] = 5;
    Food.amount[food] = 1;

    const pheromoneDepositSystem = PheromoneDepositSystem(grid)(world);
    const pheromoneFollowSystem = PheromoneFollowSystem(grid)(world);
    const forageBehaviorSystem = ForageBehaviorSystem(world);

    let foodReached = false;
    for (let i = 0; i < 60; i++) {
      pheromoneDepositSystem();
      pheromoneFollowSystem();
      forageBehaviorSystem();
      grid.update(0.1);

      // Check if ant reached food
      if (ForagerRole.state[ant] === 1) {
        foodReached = true;
        break;
      }
    }

    expect(foodReached).toBe(true);
  });
});
