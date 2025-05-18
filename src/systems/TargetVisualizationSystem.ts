import { defineQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Graphics, type StrokeInput } from "pixi.js";
import {
  AntState,
  AntStateType,
  Position,
  Target,
  TargetVisualization,
} from "../game/components";
import { Camera } from "../game/components/Camera";

export const TargetVisualizationSystem = (graphics: Graphics) => {
  const targetQuery = defineQuery([Position, Target, TargetVisualization]);
  const cameraQuery = defineQuery([Camera]);

  return (world: IWorld) => {
    graphics.clear();

    const cameraEntities = cameraQuery(world);
    if (cameraEntities.length === 0) return;

    const camera = cameraEntities[0];
    const zoom = Camera.zoom[camera];
    const cameraX = Camera.x[camera];
    const cameraY = Camera.y[camera];

    const entities = targetQuery(world);
    entities.forEach((eid) => {
      if (TargetVisualization.visible[eid] === 0) {
        // player or disabled
        return;
      }

      graphics.setStrokeStyle(getAntStateStyle(eid));

      // Get world coordinates
      const startX = Position.x[eid];
      const startY = Position.y[eid];
      const endX = Target.x[eid];
      const endY = Target.y[eid];

      // Convert to screen coordinates
      const screenStartX = startX * zoom + cameraX;
      const screenStartY = startY * zoom + cameraY;
      const screenEndX = endX * zoom + cameraX;
      const screenEndY = endY * zoom + cameraY;

      // Draw and stroke each line individually
      graphics.moveTo(screenStartX, screenStartY);
      graphics.lineTo(screenEndX, screenEndY);
      graphics.stroke();
    });
  };
};

function getAntStateStyle(eid: number): StrokeInput {
  const state = AntState.currentState[eid];
  const baseStyle = {
    width: 3,
    alpha: 0.5,
  };
  switch (state) {
    case AntStateType.EXPLORING:
      return {
        color: "blue",
        ...baseStyle,
      };
    case AntStateType.CARRYING_FOOD:
      return {
        color: "green",
        ...baseStyle,
      };
    case AntStateType.PICKING_UP_FOOD:
      return {
        color: "red",
        ...baseStyle,
      };
    default:
      return {
        color: "gray",
        ...baseStyle,
      };
  }
}
