import { defineComponent, Types } from "bitecs";

// Constants for pheromone system
export const PHEROMONE_DECAY_RATE = 0.1; // Decay per second
export const PHEROMONE_DIFFUSION_RATE = 0.1; // Diffusion rate
export const PHEROMONE_DEPOSIT_RATE = 1.0; // Amount deposited per second

export const Pheromone = defineComponent({
  // Grid dimensions
  gridWidth: Types.i32,
  gridHeight: Types.i32,

  // Timestamp of last update
  lastUpdateTime: Types.f32,
});

// Helper to store pheromone grids outside ECS
export const pheromoneGrids: Record<number, Float32Array> = {};
