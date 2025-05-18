import { defineQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Graphics } from "pixi.js";
import { Position, Target, TargetVisualization } from "../game/components";

export const TargetVisualizationSystem = (graphics: Graphics) => {
  const targetQuery = defineQuery([Position, Target, TargetVisualization]);

  return (world: IWorld) => {
    graphics.clear();
    // use pixi v8 syntax
    graphics.setStrokeStyle({
      color: "red",
      width: 5,
      alpha: 0.5,
    });

    const entities = targetQuery(world);
    entities.forEach((eid) => {
      if (TargetVisualization.visible[eid] === 1) {
        // Get raw coordinates
        const startX = Position.x[eid];
        const startY = Position.y[eid];
        const endX = Target.x[eid];
        const endY = Target.y[eid];

        graphics.moveTo(startX, startY);
        graphics.lineTo(endX, endY);

        // console.log("Drawing line from", startX, startY, "to", endX, endY);
      }
    });
  };
};
