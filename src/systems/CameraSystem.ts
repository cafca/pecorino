import { defineQuery } from "bitecs";
import { Camera } from "../game/components/Camera";
import { Container } from "pixi.js";
import { Game } from "../game/game";
import { ZOOM_LERP_FACTOR } from "@/game/constants";

declare const game: Game;

export const CameraSystem = (gameContainer: Container) => {
  const cameraQuery = defineQuery([Camera]);
  let lastMouseX = 0;
  let lastMouseY = 0;
  let targetZoom = 1; // Target zoom level
  let zoomMouseX = 0;
  let zoomMouseY = 0;
  let zoomWorldX = 0;
  let zoomWorldY = 0;
  let isZooming = false;

  // Add event listeners for camera controls
  window.addEventListener("wheel", (e) => {
    const entities = cameraQuery(game.world);
    if (entities.length === 0) return;

    const camera = entities[0];
    const zoomSpeed = 0.1;
    const zoomDelta = -Math.sign(e.deltaY) * zoomSpeed;
    targetZoom = Math.max(0.1, Math.min(5, targetZoom + zoomDelta));

    // Store mouse and world positions for smooth zooming
    zoomMouseX = e.clientX;
    zoomMouseY = e.clientY;
    zoomWorldX = (zoomMouseX - Camera.x[camera]) / Camera.zoom[camera];
    zoomWorldY = (zoomMouseY - Camera.y[camera]) / Camera.zoom[camera];
    isZooming = true;
  });

  window.addEventListener("mousedown", (e) => {
    if (e.button === 1 || e.button === 2) {
      // Middle or right mouse button
      const entities = cameraQuery(game.world);
      if (entities.length === 0) return;

      const camera = entities[0];
      Camera.isDragging[camera] = 1;
      Camera.dragStartX[camera] = e.clientX;
      Camera.dragStartY[camera] = e.clientY;
      Camera.lastX[camera] = Camera.x[camera];
      Camera.lastY[camera] = Camera.y[camera];

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  window.addEventListener("mousemove", (e) => {
    const entities = cameraQuery(game.world);
    if (entities.length === 0) return;

    const camera = entities[0];
    if (Camera.isDragging[camera]) {
      const dx = e.clientX - lastMouseX;
      const dy = e.clientY - lastMouseY;

      Camera.x[camera] += dx;
      Camera.y[camera] += dy;

      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  window.addEventListener("mouseup", () => {
    const entities = cameraQuery(game.world);
    if (entities.length === 0) return;

    const camera = entities[0];
    Camera.isDragging[camera] = 0;
  });

  // Prevent context menu on right click
  window.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  return () => {
    const entities = cameraQuery(game.world);
    if (entities.length === 0) return;

    const camera = entities[0];

    // Smoothly interpolate current zoom to target zoom
    const currentZoom = Camera.zoom[camera];
    const newZoom = currentZoom + (targetZoom - currentZoom) * ZOOM_LERP_FACTOR;
    Camera.zoom[camera] = newZoom;

    // Update camera position to zoom towards mouse position
    if (isZooming) {
      Camera.x[camera] = zoomMouseX - zoomWorldX * newZoom;
      Camera.y[camera] = zoomMouseY - zoomWorldY * newZoom;

      // If we're very close to the target zoom, stop updating position
      if (Math.abs(newZoom - targetZoom) < 0.001) {
        isZooming = false;
      }
    }

    // Apply camera transform to game container
    gameContainer.position.set(Camera.x[camera], Camera.y[camera]);
    gameContainer.scale.set(newZoom);
  };
};
