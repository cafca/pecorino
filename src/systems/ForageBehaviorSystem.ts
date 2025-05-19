import {
  Position,
  ForagerRole,
  Food,
  Target,
  PlayerControlled,
  Nest,
} from "@/game/components";
import { Pheromone, pheromoneGrids } from "../game/components/Pheromone";
import { defineQuery, removeEntity } from "bitecs";
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
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PHEROMONE_GRID_SIZE,
} from "../game/constants";
import { createAnt } from "../game/prefabs/ant";

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

  // Remove food entity completely
  removeEntity(world, food);
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
      return;
    }
  }
  // No food nearby, follow pheromone trail if possible
  const pheromoneQuery = defineQuery([Pheromone]);
  const pheromoneEntities = pheromoneQuery(world);
  if (pheromoneEntities.length > 0) {
    const pheromoneEntity = pheromoneEntities[0];
    const grid = pheromoneGrids[pheromoneEntity];
    const gridWidth = Pheromone.gridWidth[pheromoneEntity];
    const gridHeight = Pheromone.gridHeight[pheromoneEntity];
    // Convert ant's position to grid coordinates
    const gridX = Math.floor(x * PHEROMONE_GRID_SIZE);
    const gridY = Math.floor(y * PHEROMONE_GRID_SIZE);
    // 8 directions (dx, dy)
    const directions = [
      { dx: -1, dy: 0 }, // left
      { dx: 1, dy: 0 }, // right
      { dx: 0, dy: -1 }, // up
      { dx: 0, dy: 1 }, // down
      { dx: -1, dy: -1 }, // up-left
      { dx: 1, dy: -1 }, // up-right
      { dx: -1, dy: 1 }, // down-left
      { dx: 1, dy: 1 }, // down-right
    ];
    let maxPheromone = -Infinity;
    let bestDir = null;
    for (const { dx, dy } of directions) {
      const nx = gridX + dx;
      const ny = gridY + dy;
      if (nx >= 0 && nx < gridWidth && ny >= 0 && ny < gridHeight) {
        const idx = ny * gridWidth + nx;
        const value = grid[idx];
        if (value > maxPheromone) {
          maxPheromone = value;
          bestDir = { dx, dy };
        }
      }
    }
    // Only follow trail if there is a nonzero pheromone
    if (bestDir && maxPheromone > 0) {
      const step = 30; // How far to set the target in the chosen direction (in world units)
      const newTargetX = x + (bestDir.dx / PHEROMONE_GRID_SIZE) * step;
      const newTargetY = y + (bestDir.dy / PHEROMONE_GRID_SIZE) * step;
      Target.x[ant] = Math.max(0, Math.min(newTargetX, WORLD_WIDTH));
      Target.y[ant] = Math.max(0, Math.min(newTargetY, WORLD_HEIGHT));
      Target.type[ant] = 2; // Exploration target
      // Store the new target and its timestamp
      explorationTargets.set(ant, {
        timestamp: Date.now(),
        targetX: Target.x[ant],
        targetY: Target.y[ant],
      });
      return;
    }
  }
  // If no pheromone trail, fall back to random exploration
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
    const distance = Math.random() * (EXPLORATION_RADIUS - 50) + 50; // Min distance of 50

    // Calculate new target position
    let newTargetX = x + Math.cos(angle) * distance;
    let newTargetY = y + Math.sin(angle) * distance;

    // If the target is outside the screen, move it back inside
    // Use world bounds instead of screen size
    if (newTargetX < 0) {
      newTargetX = 0;
    } else if (newTargetX > WORLD_WIDTH) {
      newTargetX = WORLD_WIDTH;
    }
    if (newTargetY < 0) {
      newTargetY = 0;
    } else if (newTargetY > WORLD_HEIGHT) {
      newTargetY = WORLD_HEIGHT;
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
  isPlayer: boolean,
  world: IWorld
) => {
  const nestQuery = defineQuery([Nest]);
  const nests = nestQuery(world);
  if (nests.length === 0) throw new Error("No nest found");
  const nest = nests[0];

  // For AI ants, set target to nest
  if (!isPlayer) {
    Target.x[ant] = Position.x[nest];
    Target.y[ant] = Position.y[nest];
    Target.type[ant] = 1; // Nest target
    explorationTargets.delete(ant); // Clear exploration target when returning to nest
  }

  // If at nest, deposit food
  const distToNest = Math.sqrt(
    (Position.x[nest] - x) * (Position.x[nest] - x) +
      (Position.y[nest] - y) * (Position.y[nest] - y)
  );
  if (distToNest < NEST_RADIUS && ForagerRole.foodCarried[ant] === 1) {
    console.log("Depositing food at nest");
    // Find the nest and increment its food count
    // Reset ant's food carrying state first
    ForagerRole.state[ant] = 0; // Switch back to FindFood
    ForagerRole.foodCarried[ant] = 0;

    // Increment nest's food count
    Nest.foodCount[nest] += 1;

    // If we've collected enough food items, spawn a new ant
    if (Nest.foodCount[nest] >= ANT_SPAWN_COST) {
      // Create new ant at nest location
      createAnt(world, {
        x: Position.x[nest],
        y: Position.y[nest],
        isPlayer: false,
        initialAge: 0,
      });

      // Reset nest's food count after spawning
      Nest.foodCount[nest] = 0;
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
