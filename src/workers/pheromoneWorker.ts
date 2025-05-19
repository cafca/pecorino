/// <reference lib="webworker" />

import {
  PHEROMONE_DECAY_RATE,
  PHEROMONE_DIFFUSION_RATE,
} from "../game/constants";

// Message types
type WorkerMessage = {
  type: "update";
  grid: Float32Array;
  gridWidth: number;
  gridHeight: number;
  delta: number;
};

type WorkerResponse = {
  type: "updateComplete";
  grid: Float32Array;
};

// Handle messages from the main thread
// eslint-disable-next-line no-undef
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, grid, gridWidth, gridHeight, delta } = e.data;

  if (type === "update") {
    // Create a copy of the grid to work with
    const newGrid = new Float32Array(grid);

    // Update pheromone grid
    for (let y = 0; y < gridHeight; y++) {
      for (let x = 0; x < gridWidth; x++) {
        const idx = y * gridWidth + x;
        // Apply decay
        newGrid[idx] = grid[idx] * Math.exp(-PHEROMONE_DECAY_RATE * delta);

        // Apply diffusion
        if (x > 0)
          newGrid[idx] += grid[idx - 1] * PHEROMONE_DIFFUSION_RATE * delta;
        if (x < gridWidth - 1)
          newGrid[idx] += grid[idx + 1] * PHEROMONE_DIFFUSION_RATE * delta;
        if (y > 0)
          newGrid[idx] +=
            grid[idx - gridWidth] * PHEROMONE_DIFFUSION_RATE * delta;
        if (y < gridHeight - 1)
          newGrid[idx] +=
            grid[idx + gridWidth] * PHEROMONE_DIFFUSION_RATE * delta;
      }
    }

    // Send the updated grid back to the main thread
    const response: WorkerResponse = { type: "updateComplete", grid: newGrid };
    // eslint-disable-next-line no-undef
    self.postMessage(response, { transfer: [newGrid.buffer] });
  }
};
