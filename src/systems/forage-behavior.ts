import {
  Position,
  ForagerRole,
  Food,
  Velocity,
  Target,
  PlayerControlled,
  PheromoneEmitter,
  Nest,
  AntState,
  AntStateType,
} from "@/game/components";
import { removeComponent, defineQuery } from "bitecs";
import { Sprite } from "pixi.js";

import type { IWorld } from "bitecs";
import { PheromoneGrid } from "../game/pheromoneGrid";
import {
  FOOD_DETECTION_RANGE,
  FOOD_PICKUP_RANGE,
  FOOD_PICKUP_TIMEOUT,
  NEST_RADIUS,
  EXPLORATION_RADIUS,
  EXPLORATION_TARGET_TIMEOUT,
  EXPLORATION_TARGET_REACHED_DISTANCE,
} from "../game/constants";

// Track exploration targets and their timestamps
const explorationTargets = new Map<
  number,
  { timestamp: number; targetX: number; targetY: number }
>();

// Track food pickup attempts and their timestamps
const foodPickupAttempts = new Map<number, number>();

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

const handleFindFoodState = (
  ant: number,
  x: number,
  y: number,
  isPlayer: boolean,
  foods: number[],
  world: IWorld
) => {
  const { nearestFood, minDist } = findNearestFood(x, y, foods);

  // If we're in PICKING_UP_FOOD state but no food is nearby, give up
  if (
    AntState.currentState[ant] === AntStateType.PICKING_UP_FOOD &&
    (nearestFood === null || minDist >= FOOD_DETECTION_RANGE)
  ) {
    console.log("Food no longer available, giving up");
    foodPickupAttempts.delete(ant);
    AntState.currentState[ant] = AntStateType.EXPLORING;
    Target.type[ant] = 2; // Switch to exploration target
    return;
  }

  // Set target to food if we can see it within a reasonable range
  if (nearestFood !== null && minDist < FOOD_DETECTION_RANGE) {
    // For AI ants, set target to food
    if (!isPlayer) {
      Target.x[ant] = Position.x[nearestFood];
      Target.y[ant] = Position.y[nearestFood];
      Target.type[ant] = 0; // Food target
      explorationTargets.delete(ant); // Clear exploration target when food is found

      // Set state to PICKING_UP_FOOD when approaching food
      AntState.currentState[ant] = AntStateType.PICKING_UP_FOOD;

      // Record the start time of the pickup attempt if not already recorded
      if (!foodPickupAttempts.has(ant)) {
        foodPickupAttempts.set(ant, Date.now());
      }
    }

    // If close enough to food, pick it up
    if (minDist < FOOD_PICKUP_RANGE) {
      pickupFood(ant, nearestFood, world);
      const remainingFood = foods.length - 1;
      console.log(`Food picked up! ${remainingFood} food items remaining.`);
      foodPickupAttempts.delete(ant); // Clear the pickup attempt record
    }
  } else {
    // If we're not near food anymore, clear the pickup attempt
    foodPickupAttempts.delete(ant);
  }

  // Check for timeout on food pickup attempts
  const pickupCurrentTime = Date.now();
  const pickupStartTime = foodPickupAttempts.get(ant);
  if (
    pickupStartTime &&
    pickupCurrentTime - pickupStartTime > FOOD_PICKUP_TIMEOUT
  ) {
    // Timeout reached, give up on this food
    console.log("Food pickup timeout reached, giving up");
    foodPickupAttempts.delete(ant);
    AntState.currentState[ant] = AntStateType.EXPLORING;
    Target.type[ant] = 2; // Switch to exploration target
  }

  // Only look for new exploration target if we're not already close to food
  const explorationCurrentTime = Date.now();
  const currentTarget = explorationTargets.get(ant);
  const targetX = Target.x[ant];
  const targetY = Target.y[ant];

  // Check if we need a new exploration target
  const needsNewTarget =
    !currentTarget ||
    explorationCurrentTime - currentTarget.timestamp >
      EXPLORATION_TARGET_TIMEOUT || // Target expires after timeout
    Math.sqrt(Math.pow(x - targetX, 2) + Math.pow(y - targetY, 2)) <
      EXPLORATION_TARGET_REACHED_DISTANCE;

  if (needsNewTarget) {
    // If no food nearby, explore randomly within map bounds
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * EXPLORATION_RADIUS;

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
      timestamp: explorationCurrentTime,
      targetX: newTargetX,
      targetY: newTargetY,
    });
  }
};

const handleCarryFoodState = (
  ant: number,
  x: number,
  y: number,
  isPlayer: boolean,
  world: IWorld
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
  if (distToNest < NEST_RADIUS) {
    ForagerRole.state[ant] = 0; // Switch back to FindFood
    ForagerRole.foodCarried[ant] = 0;
    PheromoneEmitter.isEmitting[ant] = 0; // Stop emitting pheromones

    // Find the nest and increment its food count
    const nestQuery = defineQuery([Nest]);
    const nests = nestQuery(world);
    if (nests.length > 0) {
      const nest = nests[0];
      Nest.foodCount[nest] += 1;
    }

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
        handleCarryFoodState(eid, x, y, isPlayer, world);
      }
    }
  };
};
