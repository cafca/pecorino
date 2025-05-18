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
} from "../systems/systems";
import type { PheromoneFollowDebugInfo } from "../systems/systems";

describe("PheromoneGrid", () => {
  let grid: PheromoneGrid;
  const gridSize = 10;
  const halfGrid = gridSize / 2;

  beforeEach(() => {
    grid = new PheromoneGrid(gridSize, gridSize); // 10x10 tile grid
  });

  test("deposit and sample pheromones", () => {
    grid.deposit(0, 0, 1.0);
    expect(grid.sample(0, 0)).toBeCloseTo(1.0);
  });

  test("pheromone evaporation and diffusion", () => {
    // Deposit a strong pheromone
    grid.deposit(0, 0, 1.0);
    const initialValue = grid.sample(0, 0);

    // Simulate several updates
    for (let i = 0; i < 10; i++) {
      grid.update(0.1); // 0.1 second delta
    }

    // Value should have decreased due to evaporation
    const finalValue = grid.sample(0, 0);
    expect(finalValue).toBeLessThan(initialValue);

    // Check if diffusion occurred
    const neighborValue = grid.sample(0.25, 0);
    expect(neighborValue).toBeGreaterThan(0);
  });

  test("multiple deposits accumulate", () => {
    grid.deposit(0, 0, 1.0);
    grid.deposit(0, 0, 1.0);
    expect(grid.sample(0, 0)).toBeCloseTo(2.0);
  });

  test("boundary conditions", () => {
    // Test depositing outside grid
    grid.deposit(-halfGrid - 1, -halfGrid - 1, 1.0);
    grid.deposit(halfGrid + 1, halfGrid + 1, 1.0);
    expect(grid.sample(-halfGrid - 1, -halfGrid - 1)).toBe(0);
    expect(grid.sample(halfGrid + 1, halfGrid + 1)).toBe(0);
  });

  test("grid resolution accuracy", () => {
    // Test depositing at sub-grid positions
    grid.deposit(0.25, 0.25, 1.0);
    expect(grid.sample(0.25, 0.25)).toBeCloseTo(1.0);
    expect(grid.sample(0.5, 0.5)).toBe(0); // Should not affect adjacent cells
  });

  test("trail formation and decay", () => {
    // Create a trail by depositing in a line
    for (let i = 0; i < 5; i++) {
      grid.deposit(i - 2, 0, 1.0); // Centered at (0,0)
    }

    // Check initial trail strength
    for (let i = 0; i < 5; i++) {
      expect(grid.sample(i - 2, 0)).toBeCloseTo(1.0);
    }

    // Simulate time passing
    for (let i = 0; i < 20; i++) {
      grid.update(0.1);
    }

    // Trail should have decayed
    for (let i = 0; i < 5; i++) {
      expect(grid.sample(i - 2, 0)).toBeLessThan(1.0);
    }
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

describe("Pheromone Systems", () => {
  let world: ReturnType<typeof createWorld>;
  let grid: PheromoneGrid;

  beforeEach(() => {
    world = createWorld();
    grid = new PheromoneGrid(10, 10);
  });

  test("pheromone deposit system", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, ForagerRole, ant);

    Position.x[ant] = 0;
    Position.y[ant] = 0;
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 1;
    ForagerRole.state[ant] = 1;

    const depositSystem = PheromoneDepositSystem(grid)(world);
    depositSystem();

    expect(grid.sample(0, 0)).toBeCloseTo(1.0);
  });

  test("pheromone follow system", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PheromoneSensor, ant);
    addComponent(world, ForagerRole, ant);

    Position.x[ant] = 0.25;
    Position.y[ant] = 0.25;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PheromoneSensor.radius[ant] = 1;
    PheromoneSensor.sensitivity[ant] = 0.5;
    ForagerRole.state[ant] = 0;

    // Create a pheromone trail with a gradient to the right
    grid.deposit(0.25, 0.25, 1.0); // Center
    grid.deposit(1.25, 0.25, 2.0); // Right, stronger

    let debugInfo: PheromoneFollowDebugInfo | undefined = undefined;
    const followSystem = PheromoneFollowSystem(
      grid,
      (info: PheromoneFollowDebugInfo) => {
        if (info.eid === ant) debugInfo = info;
      },
      false
    )(world);
    followSystem();

    // Debug output
    if (debugInfo) {
      const info = debugInfo as PheromoneFollowDebugInfo;
      // Assert that at least one sample is nonzero
      expect(
        info.samples.some(
          (s: { angle: number; x: number; y: number; value: number }) =>
            s.value > 0
        )
      ).toBe(true);
      // Assert that the best direction points roughly towards the pheromone
      expect(info.bestDirection.value).toBeGreaterThan(0);
      // Assert that the resulting velocity is nonzero
      expect(
        Math.abs(info.velocity.x) + Math.abs(info.velocity.y)
      ).toBeGreaterThan(0);
    } else {
      throw new Error("No debug info captured for ant");
    }
  });

  test("multiple ants following trail", () => {
    // Create two ants
    const ant1 = addEntity(world);
    const ant2 = addEntity(world);

    // Add components to both ants
    [ant1, ant2].forEach((ant) => {
      addComponent(world, Position, ant);
      addComponent(world, Velocity, ant);
      addComponent(world, PheromoneSensor, ant);
      addComponent(world, ForagerRole, ant);

      Position.x[ant] = 0.25;
      Position.y[ant] = 0.25;
      Velocity.x[ant] = 0;
      Velocity.y[ant] = 0;
      PheromoneSensor.radius[ant] = 1; // Smaller radius to match grid resolution
      PheromoneSensor.sensitivity[ant] = 0.5;
      ForagerRole.state[ant] = 0;
    });

    // Create a pheromone trail with a gradient to the right for both ants
    grid.deposit(0.25, 0.25, 1.0); // Center
    grid.deposit(1.25, 0.25, 2.0); // Right, stronger

    let debugInfo1: PheromoneFollowDebugInfo | undefined = undefined;
    let debugInfo2: PheromoneFollowDebugInfo | undefined = undefined;
    const followSystem = PheromoneFollowSystem(
      grid,
      (info: PheromoneFollowDebugInfo) => {
        if (info.eid === ant1) debugInfo1 = info;
        if (info.eid === ant2) debugInfo2 = info;
      },
      false
    )(world);
    followSystem();

    // Debug output for both ants
    if (debugInfo1 && debugInfo2) {
      const info1 = debugInfo1 as PheromoneFollowDebugInfo;
      const info2 = debugInfo2 as PheromoneFollowDebugInfo;

      // Assert that both ants detect the pheromone
      expect(
        info1.samples.some(
          (s: { angle: number; x: number; y: number; value: number }) =>
            s.value > 0
        )
      ).toBe(true);
      expect(
        info2.samples.some(
          (s: { angle: number; x: number; y: number; value: number }) =>
            s.value > 0
        )
      ).toBe(true);

      // Assert that both ants move towards the pheromone
      expect(info1.bestDirection.value).toBeGreaterThan(0);
      expect(info2.bestDirection.value).toBeGreaterThan(0);
      expect(
        Math.abs(info1.velocity.x) + Math.abs(info1.velocity.y)
      ).toBeGreaterThan(0);
      expect(
        Math.abs(info2.velocity.x) + Math.abs(info2.velocity.y)
      ).toBeGreaterThan(0);
    } else {
      throw new Error("No debug info captured for one or both ants");
    }
  });

  test("ant emits pheromones when carrying food and moving", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, ForagerRole, ant);

    // Set up ant to carry food and emit pheromones
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 1;
    ForagerRole.state[ant] = 1; // CarryFood state
    ForagerRole.foodCarried[ant] = 1;

    const depositSystem = PheromoneDepositSystem(grid)(world);

    // Move ant along a path and deposit pheromones
    for (let i = 0; i < 5; i++) {
      Position.x[ant] = i;
      Position.y[ant] = i;
      depositSystem();
    }

    // Check that pheromones were deposited along the path
    for (let i = 0; i < 5; i++) {
      expect(grid.sample(i, i)).toBeCloseTo(1.0);
    }
  });
});
