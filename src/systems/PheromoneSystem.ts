/// <reference lib="webworker" />

import type { IWorld } from "bitecs";
import { defineQuery } from "bitecs";
import { Pheromone, pheromoneGrids } from "../game/components/Pheromone";
import { PHEROMONE_GRID_SIZE, PHEROMONE_DEPOSIT_RATE } from "../game/constants";
import { Position, Food } from "../game/components";

let isWorkerBusy = false;

// System for updating pheromone decay and diffusion
export function PheromoneDecaySystem(world: IWorld, worker: Worker) {
  const pheromoneQuery = defineQuery([Pheromone]);

  return (delta: number): Promise<void> => {
    return new Promise((resolve) => {
      const pheromoneEntities = pheromoneQuery(world);
      if (pheromoneEntities.length === 0) {
        resolve();
        return;
      }

      // Skip if worker is still processing
      if (isWorkerBusy) {
        resolve();
        return;
      }

      const pheromoneEntity = pheromoneEntities[0];
      const gridWidth = Pheromone.gridWidth[pheromoneEntity];
      const gridHeight = Pheromone.gridHeight[pheromoneEntity];
      const grid = pheromoneGrids[pheromoneEntity];

      // Create a copy of the grid for transfer
      const gridCopy = new Float32Array(grid);

      // Mark worker as busy
      isWorkerBusy = true;

      // Handle worker response
      worker.onmessage = (e) => {
        if (e.data.type === "updateComplete") {
          // Update the grid with the processed data
          pheromoneGrids[pheromoneEntity] = e.data.grid;
          // Mark worker as available
          isWorkerBusy = false;
          resolve();
        }
      };

      // Send grid to worker for processing
      worker.postMessage(
        {
          type: "update",
          grid: gridCopy,
          gridWidth,
          gridHeight,
          delta,
        },
        [gridCopy.buffer]
      );
    });
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
