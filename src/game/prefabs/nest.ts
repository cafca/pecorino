import { addEntity } from "bitecs";
import type { IWorld } from "bitecs";
import { NestBundle, applyBundle } from "../components/bundles";
import { Position, Sprite, Nest } from "@/game/components";

export interface NestConfig {
  x: number;
  y: number;
  initialFoodCount?: number;
}

export function createNest(world: IWorld, config: NestConfig) {
  const eid = addEntity(world);

  // Add all components using the bundle
  applyBundle(world, eid, NestBundle);

  // Set initial values
  Position.x[eid] = config.x;
  Position.y[eid] = config.y;
  Sprite.texture[eid] = 2; // nest texture
  Sprite.width[eid] = 64; // Make nest bigger than ants
  Sprite.height[eid] = 64;
  Sprite.scale[eid] = 0.05;
  Nest.foodCount[eid] = config.initialFoodCount ?? 0;

  return eid;
}
