import { createWorld, addEntity, addComponent, type IWorld } from "bitecs";
import { ForageBehaviorSystem } from "../systems/ForageBehaviorSystem";
import {
  Position,
  ForagerRole,
  Food,
  Target,
  PlayerControlled,
  Nest,
} from "@/game/components";
import { Pheromone, pheromoneGrids } from "@/game/components/Pheromone";
import {
  FOOD_DETECTION_RANGE,
  FOOD_PICKUP_RANGE,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from "@/game/constants";
import { describe, it, expect, beforeEach } from "vitest";

describe("ForageBehaviorSystem", () => {
  let world: IWorld;
  let system: ReturnType<typeof ForageBehaviorSystem>;

  beforeEach(() => {
    // Reset world and pheromoneGrids to avoid test interference
    world = createWorld();
    system = ForageBehaviorSystem(world);
    for (const key in pheromoneGrids) {
      delete pheromoneGrids[key];
    }
  });

  describe("Finding and picking up food", () => {
    it("should detect food within range and set it as target", () => {
      // Create an ant
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, ForagerRole, ant);
      addComponent(world, Target, ant);
      addComponent(world, PlayerControlled, ant);

      // Position ant
      Position.x[ant] = 100;
      Position.y[ant] = 100;

      // Create food within detection range
      const food = addEntity(world);
      addComponent(world, Position, food);
      addComponent(world, Food, food);
      Position.x[food] = 100 + FOOD_DETECTION_RANGE / 2;
      Position.y[food] = 100;

      // Ensure no pheromone grid is present
      // (Do not create any pheromone entities in this test)

      // Run system
      system();

      // Check if ant targets the food (target type is 0 and target is closer to food than start)
      const startDist = Math.abs(Position.x[food] - Position.x[ant]);
      const targetDist = Math.abs(Position.x[food] - Target.x[ant]);
      expect(Target.type[ant]).toBe(0); // Food target type
      expect(targetDist).toBeLessThan(startDist);
    });

    it("should pick up food when within pickup range", () => {
      // Create an ant
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, ForagerRole, ant);
      addComponent(world, Target, ant);
      addComponent(world, PlayerControlled, ant);

      // Position ant
      Position.x[ant] = 100;
      Position.y[ant] = 100;

      // Create food within pickup range
      const food = addEntity(world);
      addComponent(world, Position, food);
      addComponent(world, Food, food);
      Position.x[food] = 100 + FOOD_PICKUP_RANGE / 2;
      Position.y[food] = 100;

      // Run system
      system();

      // Check if ant is carrying food
      expect(ForagerRole.state[ant]).toBe(1); // CarryFood state
      expect(ForagerRole.foodCarried[ant]).toBe(1);
    });
  });

  describe("Carrying food to nest", () => {
    it("should target nest when carrying food", () => {
      // Create a nest
      const nest = addEntity(world);
      addComponent(world, Position, nest);
      addComponent(world, Nest, nest);
      Position.x[nest] = 200;
      Position.y[nest] = 200;

      // Create an ant carrying food
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, ForagerRole, ant);
      addComponent(world, Target, ant);
      addComponent(world, PlayerControlled, ant);

      // Position ant and set it to carry food
      Position.x[ant] = 100;
      Position.y[ant] = 100;
      ForagerRole.state[ant] = 1;
      ForagerRole.foodCarried[ant] = 1;

      // Run system
      system();

      // Check if ant targets the nest
      expect(Target.x[ant]).toBe(Position.x[nest]);
      expect(Target.y[ant]).toBe(Position.y[nest]);
      expect(Target.type[ant]).toBe(1); // Nest target type
    });

    it("should deposit food when at nest", () => {
      // Create a nest
      const nest = addEntity(world);
      addComponent(world, Position, nest);
      addComponent(world, Nest, nest);
      Position.x[nest] = 100;
      Position.y[nest] = 100;

      // Create an ant carrying food at nest
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, ForagerRole, ant);
      addComponent(world, Target, ant);
      addComponent(world, PlayerControlled, ant);

      // Position ant at nest and set it to carry food
      Position.x[ant] = 100;
      Position.y[ant] = 100;
      ForagerRole.state[ant] = 1;
      ForagerRole.foodCarried[ant] = 1;

      // Run system
      system();

      // Check if ant deposited food
      expect(ForagerRole.state[ant]).toBe(0); // FindFood state
      expect(ForagerRole.foodCarried[ant]).toBe(0);
      expect(Nest.foodCount[nest]).toBe(1);
    });
  });

  describe("Pheromone trail following", () => {
    it("should follow pheromone trail when no food is nearby", () => {
      // Create pheromone grid
      const pheromone = addEntity(world);
      addComponent(world, Pheromone, pheromone);
      Pheromone.gridWidth[pheromone] = Math.ceil(WORLD_WIDTH);
      Pheromone.gridHeight[pheromone] = Math.ceil(WORLD_HEIGHT);
      // Initialize the pheromone grid
      const gridSize =
        Pheromone.gridWidth[pheromone] * Pheromone.gridHeight[pheromone];
      pheromoneGrids[pheromone] = new Float32Array(gridSize);
      pheromoneGrids[pheromone][1] = 10;

      // Create an ant
      const ant = addEntity(world);
      addComponent(world, Position, ant);
      addComponent(world, ForagerRole, ant);
      addComponent(world, Target, ant);
      addComponent(world, PlayerControlled, ant);

      // Position ant
      Position.x[ant] = 100;
      Position.y[ant] = 100;

      // Run system
      system();

      // Check if ant has a new target
      expect(Target.x[ant]).toBeDefined();
      expect(Target.y[ant]).toBeDefined();
      expect(Target.type[ant]).toBe(2); // Exploration target type
    });
  });
});
