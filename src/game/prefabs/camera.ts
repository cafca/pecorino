import { addComponent, addEntity, type IWorld } from "bitecs";
import { Camera } from "../components/Camera";

export interface CameraOptions {
  x?: number;
  y?: number;
  zoom?: number;
}

export const createCamera = (world: IWorld, options: CameraOptions = {}) => {
  const cameraEntity = addEntity(world);
  addComponent(world, Camera, cameraEntity);

  // Initialize with default values or provided options
  Camera.x[cameraEntity] = options.x ?? 0;
  Camera.y[cameraEntity] = options.y ?? 0;
  Camera.zoom[cameraEntity] = options.zoom ?? 1;
  Camera.isDragging[cameraEntity] = 0;
  Camera.dragStartX[cameraEntity] = 0;
  Camera.dragStartY[cameraEntity] = 0;
  Camera.lastX[cameraEntity] = 0;
  Camera.lastY[cameraEntity] = 0;

  return cameraEntity;
};
