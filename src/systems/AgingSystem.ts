import { Age, PlayerControlled } from "@/game/components";
import { ANT_AGE_INCREMENT } from "@/game/constants";
import { type IWorld, defineQuery, removeEntity } from "bitecs";

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
          // Remove the entire entity instead of individual components
          removeEntity(world, eid);
        }
      }
    }
  };
};
