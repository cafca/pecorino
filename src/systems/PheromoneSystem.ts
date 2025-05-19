import type { IWorld } from "bitecs";
import { defineQuery } from "bitecs";
import {
  Pheromone,
  PHEROMONE_DECAY_RATE,
  PHEROMONE_DIFFUSION_RATE,
  PHEROMONE_DEPOSIT_RATE,
  pheromoneGrids,
} from "../game/components/Pheromone";
import { PHEROMONE_GRID_SIZE } from "../game/constants";
import { Position, Food } from "../game/components";

// System for updating pheromone decay and diffusion
export function PheromoneDecaySystem(world: IWorld) {
  const pheromoneQuery = defineQuery([Pheromone]);

  return (delta: number) => {
    const pheromoneEntities = pheromoneQuery(world);
    if (pheromoneEntities.length === 0) return;

    const pheromoneEntity = pheromoneEntities[0];
    const gridWidth = Pheromone.gridWidth[pheromoneEntity];
    const gridHeight = Pheromone.gridHeight[pheromoneEntity];
    const grid = pheromoneGrids[pheromoneEntity];
    const currentTime = Date.now() / 1000;

    // Update pheromone grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = y * gridWidth + x;
        // Apply decay
        grid[idx] *= Math.exp(-PHEROMONE_DECAY_RATE * delta);
        // Apply diffusion
        if (x > 0)
          grid[idx] += grid[idx - 1] * PHEROMONE_DIFFUSION_RATE * delta;
        if (x < gridWidth - 1)
          grid[idx] += grid[idx + 1] * PHEROMONE_DIFFUSION_RATE * delta;
        if (y > 0)
          grid[idx] += grid[idx - gridWidth] * PHEROMONE_DIFFUSION_RATE * delta;
        if (y < gridHeight - 1)
          grid[idx] += grid[idx + gridWidth] * PHEROMONE_DIFFUSION_RATE * delta;
      }
    }

    // Update last update time
    Pheromone.lastUpdateTime[pheromoneEntity] = currentTime;
  };
}

// System for handling ant pheromone deposits
export function PheromoneDepositSystem(world: IWorld) {
  const pheromoneQuery = defineQuery([Pheromone]);
  const antQuery = defineQuery([Position, Food]);

  return (delta: number) => {
    const pheromoneEntities = pheromoneQuery(world);
    if (pheromoneEntities.length === 0) return;

    const pheromoneEntity = pheromoneEntities[0];
    const gridWidth = Pheromone.gridWidth[pheromoneEntity];
    const gridHeight = Pheromone.gridHeight[pheromoneEntity];
    const grid = pheromoneGrids[pheromoneEntity];

    // Deposit pheromones from ants carrying food
    const ants = antQuery(world);
    ants.forEach((ant) => {
      if (Food.amount[ant] > 0) {
        const x = Position.x[ant];
        const y = Position.y[ant];
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor(x * PHEROMONE_GRID_SIZE);
        const gridY = Math.floor(y * PHEROMONE_GRID_SIZE);
        if (
          gridX >= 0 &&
          gridX < gridWidth &&
          gridY >= 0 &&
          gridY < gridHeight
        ) {
          const idx = gridY * gridWidth + gridX;
          grid[idx] += PHEROMONE_DEPOSIT_RATE * delta;
        }
      }
    });
  };
}
