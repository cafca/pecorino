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
