import { addEntity } from "bitecs";
import type { IWorld } from "bitecs";
import { FoodBundle, applyBundle } from "../components/bundles";
import { Position, Sprite, Food } from "@/game/components";
import { WORLD_WIDTH } from "../constants";
import { WORLD_HEIGHT } from "../constants";

export interface FoodConfig {
  x: number;
  y: number;
  amount?: number;
}

export function createFood(world: IWorld, config: FoodConfig) {
  const eid = addEntity(world);

  // Add all components using the bundle
  applyBundle(world, eid, FoodBundle);

  // Set initial values
  Position.x[eid] = Math.max(0, Math.min(config.x, WORLD_WIDTH));
  Position.y[eid] = Math.max(0, Math.min(config.y, WORLD_HEIGHT));
  Sprite.texture[eid] = 1; // food texture
  Sprite.width[eid] = 32;
  Sprite.height[eid] = 32;
  Sprite.scale[eid] = 0.025;
  Food.amount[eid] = config.amount ?? 1;

  return eid;
}
