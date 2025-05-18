import { addEntity } from "bitecs";
import type { IWorld } from "bitecs";
import { FoodBundle, applyBundle } from "../components/bundles";
import { Position, Sprite, Food } from "@/game/components";

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
  Position.x[eid] = config.x;
  Position.y[eid] = config.y;
  Sprite.texture[eid] = 1; // food texture
  Sprite.width[eid] = 32;
  Sprite.height[eid] = 32;
  Sprite.scale[eid] = 0.025;
  Food.amount[eid] = config.amount ?? 1;

  return eid;
}
