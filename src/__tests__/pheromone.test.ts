import { describe, it, expect, beforeEach } from "vitest";
import { createWorld, addComponent, addEntity, type IWorld } from "bitecs";
import { Pheromone, pheromoneGrids } from "../game/components/Pheromone";
import {
  PheromoneDecaySystem,
  PheromoneDepositSystem,
} from "../systems/PheromoneSystem";
import { Position, Food } from "../game/components";
import {
  PHEROMONE_DECAY_RATE,
  PHEROMONE_DIFFUSION_RATE,
  PHEROMONE_DEPOSIT_RATE,
  PHEROMONE_GRID_SIZE,
} from "../game/constants";

// Use a small grid for tests
const TEST_GRID_SIZE = 10;

describe("PheromoneDecaySystem", () => {
  let world: IWorld;
  let pheromoneDecaySystem: (delta: number) => void;
  let pheromoneEntity: number;

  beforeEach(() => {
    world = createWorld();
    pheromoneDecaySystem = PheromoneDecaySystem(world);

    // Create pheromone entity with a 10x10 grid
    pheromoneEntity = addEntity(world);
    addComponent(world, Pheromone, pheromoneEntity);
    Pheromone.gridWidth[pheromoneEntity] = TEST_GRID_SIZE;
    Pheromone.gridHeight[pheromoneEntity] = TEST_GRID_SIZE;
    pheromoneGrids[pheromoneEntity] = new Float32Array(
      TEST_GRID_SIZE * TEST_GRID_SIZE
    );
    Pheromone.lastUpdateTime[pheromoneEntity] = 0;
  });

  it("should decay pheromones over time", () => {
    // Set initial pheromone value
    pheromoneGrids[pheromoneEntity][0] = 1.0;

    // Run system for 1 second
    pheromoneDecaySystem(1.0);

    // Check that value has decayed according to decay rate
    const expectedValue = 1.0 * Math.exp(-PHEROMONE_DECAY_RATE);
    expect(pheromoneGrids[pheromoneEntity][0]).toBeCloseTo(expectedValue, 5);
  });

  it("should diffuse pheromones to neighboring cells", () => {
    // Set initial pheromone value in center
    const centerX = 5;
    const centerY = 5;
    const centerIdx = centerY * TEST_GRID_SIZE + centerX;
    pheromoneGrids[pheromoneEntity][centerIdx] = 1.0;

    // Run system for 1 second
    pheromoneDecaySystem(1.0);

    // Check that neighboring cells have received some pheromone
    const neighbors = [
      centerIdx - 1, // left
      centerIdx + 1, // right
      centerIdx - TEST_GRID_SIZE, // up
      centerIdx + TEST_GRID_SIZE, // down
    ];

    neighbors.forEach((idx) => {
      expect(pheromoneGrids[pheromoneEntity][idx]).toBeGreaterThan(0);
      // Each neighbor should receive approximately PHEROMONE_DIFFUSION_RATE * delta of the center value
      // The actual value is PHEROMONE_DIFFUSION_RATE, since decay is applied before diffusion in the system
      const expectedValue = PHEROMONE_DIFFUSION_RATE;
      expect(pheromoneGrids[pheromoneEntity][idx]).toBeCloseTo(
        expectedValue,
        1
      );
    });
  });
});

describe("PheromoneDepositSystem", () => {
  let world: IWorld;
  let pheromoneDepositSystem: (delta: number) => void;
  let pheromoneEntity: number;

  beforeEach(() => {
    world = createWorld();
    pheromoneDepositSystem = PheromoneDepositSystem(world);

    // Create pheromone entity with a 10x10 grid
    pheromoneEntity = addEntity(world);
    addComponent(world, Pheromone, pheromoneEntity);
    Pheromone.gridWidth[pheromoneEntity] = TEST_GRID_SIZE;
    Pheromone.gridHeight[pheromoneEntity] = TEST_GRID_SIZE;
    pheromoneGrids[pheromoneEntity] = new Float32Array(
      TEST_GRID_SIZE * TEST_GRID_SIZE
    );
    Pheromone.lastUpdateTime[pheromoneEntity] = 0;
  });

  it("should deposit pheromones from ants carrying food", () => {
    // Create an ant carrying food at position (0,0)
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Food, ant);
    Position.x[ant] = 0;
    Position.y[ant] = 0;
    Food.amount[ant] = 1;

    // Run system for 1 second
    pheromoneDepositSystem(1.0);

    // Check that pheromone was deposited according to deposit rate
    expect(pheromoneGrids[pheromoneEntity][0]).toBeCloseTo(
      PHEROMONE_DEPOSIT_RATE,
      5
    );
  });

  it("should not deposit pheromones from ants without food", () => {
    // Create an ant without food at position (0,0)
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Food, ant);
    Position.x[ant] = 0;
    Position.y[ant] = 0;
    Food.amount[ant] = 0;

    // Run system for 1 second
    pheromoneDepositSystem(1.0);

    // Check that no pheromone was deposited
    expect(pheromoneGrids[pheromoneEntity][0]).toBe(0);
  });

  it("should handle multiple ants depositing pheromones", () => {
    // Create multiple ants carrying food at different positions
    const ants = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];

    ants.forEach(({ x, y }) => {
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, Food, ant);
      Position.x[ant] = x;
      Position.y[ant] = y;
      Food.amount[ant] = 1;
    });

    // Run system for 1 second
    pheromoneDepositSystem(1.0);

    // Check that pheromones were deposited at each ant's position
    ants.forEach(({ x, y }) => {
      // Convert world coordinates to grid coordinates using PHEROMONE_GRID_SIZE (not TEST_GRID_SIZE)
      const gridX = Math.floor(x * PHEROMONE_GRID_SIZE);
      const gridY = Math.floor(y * PHEROMONE_GRID_SIZE);
      const idx = gridY * TEST_GRID_SIZE + gridX;
      expect(pheromoneGrids[pheromoneEntity][idx]).toBeCloseTo(
        PHEROMONE_DEPOSIT_RATE,
        5
      );
    });
  });
});
