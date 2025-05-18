import { defineQuery } from "bitecs";
import { Camera } from "../game/components/Camera";
import { Container } from "pixi.js";
import { Game } from "../game/game";

declare const game: Game;

export const CameraSystem = (gameContainer: Container) => {
  const cameraQuery = defineQuery([Camera]);
  let lastMouseX = 0;
  let lastMouseY = 0;

  // Add event listeners for camera controls
  window.addEventListener("wheel", (e) => {
    const entities = cameraQuery(game.world);
    if (entities.length === 0) return;

    const camera = entities[0];
    const zoomSpeed = 0.1;
    const zoomDelta = -Math.sign(e.deltaY) * zoomSpeed;
    const newZoom = Math.max(0.1, Math.min(5, Camera.zoom[camera] + zoomDelta));

    // Calculate mouse position in world space before zoom
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const worldX = (mouseX - Camera.x[camera]) / Camera.zoom[camera];
    const worldY = (mouseY - Camera.y[camera]) / Camera.zoom[camera];

    // Update zoom
    Camera.zoom[camera] = newZoom;

    // Adjust camera position to zoom towards mouse position
    Camera.x[camera] = mouseX - worldX * newZoom;
    Camera.y[camera] = mouseY - worldY * newZoom;
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

    // Apply camera transform to game container
    gameContainer.position.set(Camera.x[camera], Camera.y[camera]);
    gameContainer.scale.set(Camera.zoom[camera]);
  };
};
