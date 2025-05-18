import {
  Position,
  ForagerRole,
  Food,
  Velocity,
  Target,
  PlayerControlled,
  Nest,
  AntState,
  Sprite,
  Age,
} from "@/game/components";
import { removeComponent, defineQuery, addEntity, addComponent } from "bitecs";
import type { IWorld } from "bitecs";
import {
  FOOD_DETECTION_RANGE,
  FOOD_PICKUP_RANGE,
  FOOD_PICKUP_TIMEOUT,
  NEST_RADIUS,
  EXPLORATION_RADIUS,
  EXPLORATION_TARGET_TIMEOUT,
  EXPLORATION_TARGET_REACHED_DISTANCE,
  ANT_SPAWN_COST,
  ANT_MAX_AGE,
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
  // Set ant state to carrying food
  ForagerRole.state[ant] = 1; // Switch to CarryFood
  ForagerRole.foodCarried[ant] = 1;

  // Remove food entity immediately
  removeComponent(world, Position, food);
  removeComponent(world, Sprite, food);
  removeComponent(world, Food, food);
};

const handleFindFoodState = (
  ant: number,
  x: number,
  y: number,
  world: IWorld
) => {
  const foods = defineQuery([Food])(world);
  const { nearestFood, minDist } = findNearestFood(x, y, foods);

  if (nearestFood !== null && minDist < FOOD_DETECTION_RANGE) {
    // If food is within pickup range, try to pick it up
    if (minDist < FOOD_PICKUP_RANGE) {
      const lastAttempt = foodPickupAttempts.get(ant) || 0;
      const currentTime = Date.now();

      if (currentTime - lastAttempt > FOOD_PICKUP_TIMEOUT) {
        pickupFood(ant, nearestFood, world);
        foodPickupAttempts.set(ant, currentTime);
      }
    } else {
      // Move towards food
      Target.x[ant] = Position.x[nearestFood];
      Target.y[ant] = Position.y[nearestFood];
      Target.type[ant] = 0; // Food target
    }
  } else {
    // No food nearby, explore randomly
    const currentTime = Date.now();
    const lastTarget = explorationTargets.get(ant);
    const needsNewTarget =
      !lastTarget ||
      currentTime - lastTarget.timestamp > EXPLORATION_TARGET_TIMEOUT ||
      (Math.abs(x - lastTarget.targetX) < EXPLORATION_TARGET_REACHED_DISTANCE &&
        Math.abs(y - lastTarget.targetY) < EXPLORATION_TARGET_REACHED_DISTANCE);

    if (needsNewTarget) {
      // If no food nearby, explore randomly within map bounds
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * EXPLORATION_RADIUS;

      // Calculate new target position
      let newTargetX = x + Math.cos(angle) * distance;
      let newTargetY = y + Math.sin(angle) * distance;

      // Use fixed map bounds
      const halfWidth = 400;
      const halfHeight = 300;

      // Clamp target position to map bounds
      newTargetX = Math.max(-halfWidth, Math.min(halfWidth, newTargetX));
      newTargetY = Math.max(-halfHeight, Math.min(halfHeight, newTargetY));

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
  if (distToNest < NEST_RADIUS && ForagerRole.foodCarried[ant] === 1) {
    // Find the nest and increment its food count
    const nestQuery = defineQuery([Nest]);
    const nests = nestQuery(world);
    if (nests.length > 0) {
      const nest = nests[0];

      // Reset ant's food carrying state first
      ForagerRole.state[ant] = 0; // Switch back to FindFood
      ForagerRole.foodCarried[ant] = 0;

      // Increment nest's food count
      Nest.foodCount[nest] += 1;

      // If we've collected enough food items, spawn a new ant
      if (Nest.foodCount[nest] >= ANT_SPAWN_COST) {
        // Create new ant at nest location with age 0
        if (
          typeof window !== "undefined" &&
          window.game &&
          typeof window.game.createAnt === "function"
        ) {
          window.game.createAnt(0, 0, false, 0);
        } else {
          // fallback: direct entity creation (for tests)
          const newAnt = addEntity(world);
          addComponent(world, Position, newAnt);
          addComponent(world, Velocity, newAnt);
          addComponent(world, Sprite, newAnt);
          addComponent(world, PlayerControlled, newAnt);
          addComponent(world, ForagerRole, newAnt);
          addComponent(world, Target, newAnt);
          addComponent(world, AntState, newAnt);
          addComponent(world, Age, newAnt);

          // Set initial values for new ant
          Position.x[newAnt] = 0;
          Position.y[newAnt] = 0;
          Velocity.x[newAnt] = 0;
          Velocity.y[newAnt] = 0;
          PlayerControlled.speed[newAnt] = 100;
          PlayerControlled.isPlayer[newAnt] = 0;
          Sprite.texture[newAnt] = 0; // ant texture
          Sprite.width[newAnt] = 32;
          Sprite.height[newAnt] = 32;
          Sprite.scale[newAnt] = 0.1;
          ForagerRole.state[newAnt] = 0;
          ForagerRole.foodCarried[newAnt] = 0;
          Target.x[newAnt] = 0;
          Target.y[newAnt] = 0;
          Target.type[newAnt] = 0;
          AntState.currentState[newAnt] = 0;
          AntState.previousState[newAnt] = 0;
          AntState.stateTimer[newAnt] = 0;
          Age.currentAge[newAnt] = 0;
          Age.maxAge[newAnt] = ANT_MAX_AGE;
        }

        // Reset nest's food count after spawning
        Nest.foodCount[nest] = 0;
      }
    }
  }
};

export const ForageBehaviorSystem = (world: IWorld) => {
  const query = defineQuery([Position, ForagerRole, Target, PlayerControlled]);

  return () => {
    const entities = query(world);
    for (const eid of entities) {
      const x = Position.x[eid];
      const y = Position.y[eid];
      const isPlayer = PlayerControlled.isPlayer[eid] === 1;

      if (ForagerRole.foodCarried[eid] === 0) {
        handleFindFoodState(eid, x, y, world);
      } else {
        handleCarryFoodState(eid, x, y, isPlayer, world);
      }
    }
  };
};
