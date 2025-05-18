import { addEntity } from "bitecs";
import type { IWorld } from "bitecs";
import { AntBundle, applyBundle } from "../components/bundles";
import {
  Position,
  PlayerControlled,
  ForagerRole,
  Target,
  AntState,
  Age,
  Sprite,
  TargetVisualization,
} from "@/game/components";
import { ANT_MAX_AGE } from "../constants";

export interface AntConfig {
  x: number;
  y: number;
  isPlayer?: boolean;
  initialAge?: number;
  showTargets?: boolean;
}

export function createAnt(world: IWorld, config: AntConfig) {
  const eid = addEntity(world);

  // Add all components using the bundle
  applyBundle(world, eid, AntBundle);

  // Set initial values
  Position.x[eid] = config.x;
  Position.y[eid] = config.y;
  PlayerControlled.speed[eid] = 100;
  PlayerControlled.isPlayer[eid] = config.isPlayer ? 1 : 0;
  Sprite.texture[eid] = 0; // ant texture
  Sprite.width[eid] = 32;
  Sprite.height[eid] = 32;
  Sprite.scale[eid] = 0.025;
  ForagerRole.state[eid] = 0;
  ForagerRole.foodCarried[eid] = 0;
  Target.x[eid] = config.x;
  Target.y[eid] = config.y;
  Target.type[eid] = 0;
  AntState.currentState[eid] = 0;
  AntState.previousState[eid] = 0;
  AntState.stateTimer[eid] = 0;
  Age.currentAge[eid] = config.initialAge ?? Math.random() * 0.5 * ANT_MAX_AGE;
  Age.maxAge[eid] = ANT_MAX_AGE;
  TargetVisualization.visible[eid] = config.showTargets ? 1 : 0;

  return eid;
}
