import { addEntity, type IWorld } from "bitecs";
import { TreeBundle } from "../components/bundles";
import { Position, Sprite } from "../components";
import { applyBundle } from "../components/bundles";

export function createTree(
  world: IWorld,
  { x, y }: { x: number; y: number }
): number {
  const eid = addEntity(world);
  applyBundle(world, eid, TreeBundle);
  Position.x[eid] = x;
  Position.y[eid] = y;
  Sprite.texture[eid] = 3;
  Sprite.width[eid] = 32;
  Sprite.height[eid] = 32;
  Sprite.scale[eid] = 0.05;
  return eid;
}
