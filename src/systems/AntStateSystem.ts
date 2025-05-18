import {
  AntState,
  Position,
  Velocity,
  ForagerRole,
  PlayerControlled,
  AntStateType,
} from "@/game/components";
import { type IWorld, defineQuery } from "bitecs";

export const AntStateSystem = (world: IWorld) => {
  const foragerEntityQuery = defineQuery([
    AntState,
    Position,
    Velocity,
    ForagerRole,
    PlayerControlled,
  ]);

  return () => {
    const foragerEntities = foragerEntityQuery(world);
    for (const eid of foragerEntities) {
      // State transition logic
      if (PlayerControlled.isPlayer[eid] === 1) {
        AntState.currentState[eid] = AntStateType.PLAYER_CONTROLLED;
      } else if (ForagerRole.foodCarried[eid] === 1) {
        AntState.currentState[eid] = AntStateType.CARRYING_FOOD;
      } else if (AntState.currentState[eid] === AntStateType.PICKING_UP_FOOD) {
        // Keep PICKING_UP_FOOD state until food is picked up or lost
        // The ForageBehaviorSystem will handle transitioning out of this state
      } else if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
        AntState.currentState[eid] = AntStateType.EXPLORING;
      } else {
        AntState.currentState[eid] = AntStateType.IDLE;
      }

      // Update state timer
      if (AntState.previousState[eid] !== AntState.currentState[eid]) {
        AntState.stateTimer[eid] = 0;
        AntState.previousState[eid] = AntState.currentState[eid];
      } else {
        AntState.stateTimer[eid] += 1;
      }
    }
  };
};
