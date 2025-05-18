import { defineQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Velocity, PlayerControlled } from "../game/components";

// Input System
export const InputSystem = (world: IWorld) => {
  const query = defineQuery([PlayerControlled, Velocity]);
  const keys = new Set<string>();

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys.add(key);
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    keys.delete(key);
  });

  return () => {
    const entities = query(world);
    for (const eid of entities) {
      // Only handle player-controlled ants
      if (PlayerControlled.isPlayer[eid] === 1) {
        const speed = PlayerControlled.speed[eid];

        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;

        if (keys.has("w") || keys.has("arrowup")) Velocity.y[eid] = -speed;
        if (keys.has("s") || keys.has("arrowdown")) Velocity.y[eid] = speed;
        if (keys.has("a") || keys.has("arrowleft")) Velocity.x[eid] = -speed;
        if (keys.has("d") || keys.has("arrowright")) Velocity.x[eid] = speed;
      }
    }
  };
};
