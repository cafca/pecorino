import { World } from "bitecs";

declare global {
  interface GameWorld extends World {
    // Hier können wir später zusätzliche Eigenschaften für die Spielwelt definieren
  }

  interface GameEntity {
    id: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    sprite: {
      texture: number;
      width: number;
      height: number;
      scale: number;
    };
    playerControlled?: {
      speed: number;
    };
  }
}

export {};
