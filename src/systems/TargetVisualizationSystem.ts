import { defineQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Graphics } from "pixi.js";
import { Position, Target, TargetVisualization } from "../game/components";
import { Camera } from "../game/components/Camera";

export const TargetVisualizationSystem = (graphics: Graphics) => {
  const targetQuery = defineQuery([Position, Target, TargetVisualization]);
  const cameraQuery = defineQuery([Camera]);

  return (world: IWorld) => {
    graphics.clear();
    // use pixi v8 syntax
    graphics.setStrokeStyle({
      color: "blue",
      width: 3,
      alpha: 0.5,
    });

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

      graphics.moveTo(screenStartX, screenStartY);
      graphics.lineTo(screenEndX, screenEndY);
    });

    // Stroke all lines at once
    graphics.stroke();
  };
};
