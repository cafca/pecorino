import {
  Position,
  Velocity,
  PlayerControlled,
  Target,
} from "@/game/components";
import { type IWorld, defineQuery } from "bitecs";

export const MovementSystem = (world: IWorld) => {
  const query = defineQuery([Position, Velocity]);

  return (delta: number) => {
    const entities = query(world);
    const gridDimensionX = window.innerWidth;
    const gridDimensionY = window.innerHeight;

    // Use screen dimensions directly as boundaries
    for (const eid of entities) {
      // If the ant is an NPC and has a current target, set
      // its velocity towards the target.
      if (!PlayerControlled.isPlayer[eid] && Target.x[eid] !== undefined) {
        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const speed = PlayerControlled.speed[eid] || 1;
          Velocity.x[eid] = (dx / distance) * speed;
          Velocity.y[eid] = (dy / distance) * speed;
        }
      }

      // Calculate new position
      let newX = Position.x[eid] + Velocity.x[eid] * delta;
      let newY = Position.y[eid] + Velocity.y[eid] * delta;

      // Handle boundaries with screen coordinates
      if (newX <= 0) {
        newX = 0;
        Velocity.x[eid] = 0;
      } else if (newX >= gridDimensionX) {
        newX = gridDimensionX;
        Velocity.x[eid] = 0;
      }

      if (newY <= 0) {
        newY = 0;
        Velocity.y[eid] = 0;
      } else if (newY >= gridDimensionY) {
        newY = gridDimensionY;
        Velocity.y[eid] = 0;
      }

      // Update positions
      Position.x[eid] = newX;
      Position.y[eid] = newY;
    }
  };
};
