import {
  Age,
  PlayerControlled,
  Position,
  Velocity,
  ForagerRole,
  Target,
  AntState,
} from "@/game/components";
import { ANT_AGE_INCREMENT } from "@/game/constants";
import { type IWorld, defineQuery, removeComponent } from "bitecs";
import { Sprite } from "pixi.js";

export const AgingSystem = (world: IWorld) => {
  const query = defineQuery([Age]);

  return (delta: number) => {
    const entities = query(world);
    for (const eid of entities) {
      // Increment age
      Age.currentAge[eid] += ANT_AGE_INCREMENT * delta;

      // Check if ant has reached max age
      if (Age.currentAge[eid] >= Age.maxAge[eid]) {
        // Don't kill player ant
        if (PlayerControlled.isPlayer[eid] === 0) {
          // Remove all components
          removeComponent(world, Position, eid);
          removeComponent(world, Velocity, eid);
          removeComponent(world, Sprite, eid);
          removeComponent(world, PlayerControlled, eid);
          removeComponent(world, ForagerRole, eid);
          removeComponent(world, Target, eid);
          removeComponent(world, AntState, eid);
          removeComponent(world, Age, eid);
        }
      }
    }
  };
};
