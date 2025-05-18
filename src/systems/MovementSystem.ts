import {
  Position,
  Velocity,
  PlayerControlled,
  Target,
} from "@/game/components";
import { Camera } from "@/game/components/Camera";
import { type IWorld, defineQuery } from "bitecs";
import { WORLD_WIDTH, WORLD_HEIGHT } from "@/game/constants";

export const MovementSystem = (world: IWorld) => {
  const query = defineQuery([Position, Velocity]);
  const cameraQuery = defineQuery([Camera]);

  return (delta: number) => {
    const entities = query(world);
    const cameraEntities = cameraQuery(world);
    if (cameraEntities.length === 0) return;

    const camera = cameraEntities[0];
    const zoom = Camera.zoom[camera];

    // Use world coordinates for boundaries
    for (const eid of entities) {
      // If the ant is an NPC and has a current target, set
      // its velocity towards the target.
      if (!PlayerControlled.isPlayer[eid] && Target.x[eid] !== undefined) {
        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const speed = PlayerControlled.speed[eid] || 1;
          // Scale speed based on zoom level for NPCs
          const scaledSpeed = speed / zoom;
          Velocity.x[eid] = (dx / distance) * scaledSpeed;
          Velocity.y[eid] = (dy / distance) * scaledSpeed;
        }
      }

      // Calculate new position
      let newX = Position.x[eid] + Velocity.x[eid] * delta;
      let newY = Position.y[eid] + Velocity.y[eid] * delta;

      // Handle boundaries with world coordinates
      if (newX <= 0) {
        newX = 0;
        Velocity.x[eid] = 0;
      } else if (newX >= WORLD_WIDTH) {
        newX = WORLD_WIDTH;
        Velocity.x[eid] = 0;
      }

      if (newY <= 0) {
        newY = 0;
        Velocity.y[eid] = 0;
      } else if (newY >= WORLD_HEIGHT) {
        newY = WORLD_HEIGHT;
        Velocity.y[eid] = 0;
      }

      // Update positions
      Position.x[eid] = newX;
      Position.y[eid] = newY;
    }
  };
};
