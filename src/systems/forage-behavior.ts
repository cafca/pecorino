import {
  Position,
  ForagerRole,
  Food,
  Velocity,
  Target,
  PlayerControlled,
  PheromoneEmitter,
} from "@/game/components";
import { removeComponent, defineQuery } from "bitecs";
import { Sprite } from "pixi.js";

import type { IWorld } from "bitecs";
import { PheromoneGrid } from "../game/pheromoneGrid";

// Helper functions for ForageBehaviorSystem
const findNearestFood = (x: number, y: number, foods: number[]) => {
  let nearestFood = null;
  let minDist = Infinity;

  for (const foodEid of foods) {
    const dx = Position.x[foodEid] - x;
    const dy = Position.y[foodEid] - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearestFood = foodEid;
    }
  }

  return { nearestFood, minDist };
};

const pickupFood = (ant: number, food: number, world: IWorld) => {
  ForagerRole.state[ant] = 1; // Switch to CarryFood
  ForagerRole.foodCarried[ant] = 1;
  PheromoneEmitter.isEmitting[ant] = 1; // Start emitting pheromones
  Food.amount[food] -= 1;

  // Remove food entity if amount reaches 0
  if (Food.amount[food] <= 0) {
    removeComponent(world, Position, food);
    removeComponent(world, Sprite, food);
    removeComponent(world, Food, food);
  }
};

const moveTowardsTarget = (
  ant: number,
  targetX: number,
  targetY: number,
  speed: number
) => {
  const x = Position.x[ant];
  const y = Position.y[ant];
  const dx = targetX - x;
  const dy = targetY - y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > 0) {
    Velocity.x[ant] = (dx / dist) * speed;
    Velocity.y[ant] = (dy / dist) * speed;
  } else {
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
  }
};

// Track exploration targets and their timestamps
const explorationTargets = new Map<
  number,
  { timestamp: number; targetX: number; targetY: number }
>();

const handleFindFoodState = (
  ant: number,
  x: number,
  y: number,
  isPlayer: boolean,
  foods: number[],
  world: IWorld
) => {
  const { nearestFood, minDist } = findNearestFood(x, y, foods);

  // Only set target to food if we're very close to it
  if (nearestFood !== null && minDist < 50) {
    // For AI ants, set target to food
    if (!isPlayer) {
      Target.x[ant] = Position.x[nearestFood];
      Target.y[ant] = Position.y[nearestFood];
      Target.type[ant] = 0; // Food target
      explorationTargets.delete(ant); // Clear exploration target when food is found
    }

    // If close enough to food, pick it up
    if (minDist < 10) {
      pickupFood(ant, nearestFood, world);
      const remainingFood = foods.length - 1;
      console.log(`Food picked up! ${remainingFood} food items remaining.`);
    }
  }

  const currentTime = Date.now();
  const currentTarget = explorationTargets.get(ant);
  const targetX = Target.x[ant];
  const targetY = Target.y[ant];

  // Check if we need a new exploration target
  const needsNewTarget =
    !currentTarget ||
    currentTime - currentTarget.timestamp > 5000 || // Target expires after 5 seconds
    Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2)) < 20; // Target reached

  if (needsNewTarget) {
    // If no food nearby, explore randomly within map bounds
    const exploreRadius = 200;
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * exploreRadius;

    // Calculate new target position
    let newTargetX = x + Math.cos(angle) * distance;
    let newTargetY = y + Math.sin(angle) * distance;

    // Get map bounds from pheromone grid
    const grid = (window as { game?: { pheromoneGrid: PheromoneGrid } }).game
      ?.pheromoneGrid;
    if (grid) {
      const halfWidth = grid.getGridWidth() / (2 * grid.getResolution());
      const halfHeight = grid.getGridHeight() / (2 * grid.getResolution());

      // Clamp target position to map bounds
      newTargetX = Math.max(-halfWidth, Math.min(halfWidth, newTargetX));
      newTargetY = Math.max(-halfHeight, Math.min(halfHeight, newTargetY));
    }

    Target.x[ant] = newTargetX;
    Target.y[ant] = newTargetY;
    Target.type[ant] = 2; // Exploration target

    // Store the new target and its timestamp
    explorationTargets.set(ant, {
      timestamp: currentTime,
      targetX: newTargetX,
      targetY: newTargetY,
    });
  }
};

const handleCarryFoodState = (
  ant: number,
  x: number,
  y: number,
  isPlayer: boolean
) => {
  // For AI ants, set target to nest
  if (!isPlayer) {
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 1; // Nest target
    explorationTargets.delete(ant); // Clear exploration target when returning to nest
  }

  // If at nest, deposit food
  const distToNest = Math.sqrt(x * x + y * y);
  const nestRadius = 48;
  if (distToNest < nestRadius) {
    ForagerRole.state[ant] = 0; // Switch back to FindFood
    ForagerRole.foodCarried[ant] = 0;
    PheromoneEmitter.isEmitting[ant] = 0; // Stop emitting pheromones
    console.log("Food deposited at nest!");
  }
};

// Forage Behavior System
export const ForageBehaviorSystem = (world: IWorld) => {
  const foragerQuery = defineQuery([Position, ForagerRole, Target, Velocity]);
  const foodQuery = defineQuery([Position, Food]);

  return () => {
    const foragers = foragerQuery(world);
    const foods = foodQuery(world);

    for (const eid of foragers) {
      const state = ForagerRole.state[eid];
      const x = Position.x[eid];
      const y = Position.y[eid];
      const isPlayer = PlayerControlled.isPlayer[eid] === 1;
      const isCarryingFood = ForagerRole.foodCarried[eid] === 1;

      // Handle AI movement
      if (!isPlayer) {
        moveTowardsTarget(eid, Target.x[eid], Target.y[eid], 100);
      }

      // Handle state-specific behavior
      if (state === 0) {
        handleFindFoodState(eid, x, y, isPlayer, foods, world);
      } else if (state === 1 && isCarryingFood) {
        handleCarryFoodState(eid, x, y, isPlayer);
      }
    }
  };
};
