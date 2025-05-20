export const FOOD_DETECTION_RANGE = 50;
export const FOOD_PICKUP_RANGE = 20;
export const FOOD_PICKUP_TIMEOUT = 3000; // 3 seconds timeout for picking up food
export const NEST_RADIUS = 20;
export const INITIAL_SPAWN_RATE = 3.0;
export const EXPLORATION_RADIUS = 200;
export const EXPLORATION_TARGET_TIMEOUT = 5000; // 5 seconds in milliseconds
export const EXPLORATION_TARGET_REACHED_DISTANCE = 20;
export const ANT_SPAWN_COST = 5;
export const MAX_DATA_POINTS = 50;

// Age-related constants
export const ANT_MAX_AGE = 60; // Maximum age in seconds
export const ANT_AGE_INCREMENT = 1; // How much to increment age per second

// World dimensions
export const WORLD_WIDTH = 960; // 30 tiles × 32 pixels
export const WORLD_HEIGHT = 640; // 20 tiles × 32 pixels

// Camera constants
export const ZOOM_LERP_FACTOR = 0.55; // Adjust this value to control zoom smoothness (0-1)
export const MIN_ZOOM = 1.5;
export const MAX_ZOOM = 5;
export const ZOOM_SPEED = 0.05;
// Add DEFAULT_SHOW_TARGETS to the exports
export const DEFAULT_SHOW_TARGETS = false;

// Movement constants
export const ANT_SPEED = 100; // Speed in world coordinates per second

// Pheromone constants
export const PHEROMONE_GRID_SIZE = 4; // Grid cells per world unit
export const PHEROMONE_DECAY_RATE = 0.1; // Decay per second
export const PHEROMONE_DIFFUSION_RATE = 0.3; // Diffusion rate
export const PHEROMONE_DEPOSIT_RATE = 1.0; // Amount deposited per second
export const PHEROMONE_UPDATE_INTERVAL = 10; // Update decay/diffusion every N frames
export const DEFAULT_SHOW_PHEROMONES = true;
// Trail constants
export const PHEROMONE_TRAIL_INITIAL_STRENGTH = 8.0; // Strength at pickup spot
export const PHEROMONE_TRAIL_SLOPE = 0.05; // Slope for exponential decay along trail
