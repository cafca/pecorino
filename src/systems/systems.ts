import { defineQuery, enterQuery, exitQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Application, Container, Sprite as PixiSprite, Assets } from "pixi.js";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
} from "../game/components";
import { PheromoneGrid } from "../game/pheromoneGrid";

// Input System
export const InputSystem = (world: IWorld) => {
  const query = defineQuery([PlayerControlled, Velocity]);
  const keys = new Set<string>();

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys.add(key);
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    keys.delete(key);
  });

  return () => {
    const entities = query(world);
    for (const eid of entities) {
      // Only handle player-controlled ants
      if (PlayerControlled.isPlayer[eid] === 1) {
        const speed = PlayerControlled.speed[eid];

        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;

        if (keys.has("w") || keys.has("arrowup")) Velocity.y[eid] = -speed;
        if (keys.has("s") || keys.has("arrowdown")) Velocity.y[eid] = speed;
        if (keys.has("a") || keys.has("arrowleft")) Velocity.x[eid] = -speed;
        if (keys.has("d") || keys.has("arrowright")) Velocity.x[eid] = speed;
      }
    }
  };
};

// Movement System
export const MovementSystem = (world: IWorld) => {
  const query = defineQuery([Position, Velocity]);

  return (delta: number) => {
    const entities = query(world);
    for (const eid of entities) {
      Position.x[eid] += Velocity.x[eid] * delta;
      Position.y[eid] += Velocity.y[eid] * delta;
    }
  };
};

// Render System
export const RenderSystem = (app: Application) => (world: IWorld) => {
  const query = defineQuery([Position, Sprite]);
  const enter = enterQuery(query);
  const exit = exitQuery(query);
  const sprites = new Map<number, PixiSprite>();
  const container = new Container();
  const pheromoneContainer = new Container();
  app.stage.addChild(container);
  app.stage.addChild(pheromoneContainer);

  // Center the containers initially
  container.position.set(app.screen.width / 2, app.screen.height / 2);
  pheromoneContainer.position.set(app.screen.width / 2, app.screen.height / 2);
  pheromoneContainer.scale.set(1);

  // Create a pool of pheromone sprites to reuse
  const pheromonePool: PixiSprite[] = [];
  const activePheromones = new Set<PixiSprite>();
  const POOL_SIZE = 100; // Maximum number of pheromone sprites to show

  // Initialize the pool
  for (let i = 0; i < POOL_SIZE; i++) {
    const sprite = new PixiSprite(Assets.get("circle"));
    sprite.anchor.set(0.5);
    sprite.scale.set(0.5);
    sprite.visible = false;
    pheromoneContainer.addChild(sprite);
    pheromonePool.push(sprite);
  }

  return () => {
    // Handle new entities
    for (const eid of enter(world)) {
      try {
        let texture;
        switch (Sprite.texture[eid]) {
          case 0:
            texture = "ant";
            break;
          case 1:
            texture = "food";
            break;
          case 2:
            texture = "nest";
            break;
          default:
            texture = "ant";
        }
        const sprite = new PixiSprite(Assets.get(texture));
        sprite.anchor.set(0.5);
        sprite.scale.set(Sprite.scale[eid]);
        container.addChild(sprite);
        sprites.set(eid, sprite);
      } catch (error) {
        console.error("Error creating sprite:", error);
      }
    }

    // Update positions and tints
    const entities = query(world);
    for (const eid of entities) {
      const sprite = sprites.get(eid);
      if (sprite) {
        sprite.x = Position.x[eid];
        sprite.y = Position.y[eid];

        if (Sprite.texture[eid] === 0 && ForagerRole.foodCarried[eid] === 1) {
          sprite.tint = 0xff0000; // red
        } else {
          sprite.tint = 0xffffff; // white (normal)
        }
      }
    }

    // Handle removed entities
    for (const eid of exit(world)) {
      const sprite = sprites.get(eid);
      if (sprite) {
        container.removeChild(sprite);
        sprite.destroy();
        sprites.delete(eid);
      }
    }

    // Reset all pheromone sprites
    for (const sprite of activePheromones) {
      sprite.visible = false;
      pheromonePool.push(sprite);
    }
    activePheromones.clear();

    // Draw pheromones
    const grid = (window as { game?: { pheromoneGrid: PheromoneGrid } }).game
      ?.pheromoneGrid;
    if (grid) {
      const resolution = grid.getResolution();
      const width = grid.getGridWidth();
      const height = grid.getGridHeight();
      const gridData = grid.getGridData();

      // Collect pheromone points with their strengths
      const pheromonePoints: { x: number; y: number; strength: number }[] = [];
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const strength = gridData[index];
          if (strength > 0) {
            pheromonePoints.push({
              x: x / resolution,
              y: y / resolution,
              strength,
            });
          }
        }
      }

      // Sort by strength to show strongest pheromones
      pheromonePoints.sort((a, b) => b.strength - a.strength);

      // Show only the strongest pheromones up to pool size
      for (let i = 0; i < Math.min(pheromonePoints.length, POOL_SIZE); i++) {
        const point = pheromonePoints[i];
        const sprite = pheromonePool.pop();
        if (sprite) {
          sprite.x = point.x;
          sprite.y = point.y;
          const alpha = Math.min(point.strength, 1);
          const color = 0x0000ff + Math.floor(alpha * 0xff0000);
          sprite.tint = color;
          sprite.alpha = alpha;
          sprite.visible = true;
          activePheromones.add(sprite);
        }
      }
    }
  };
};

// Pheromone Deposit System
export const PheromoneDepositSystem =
  (pheromoneGrid: PheromoneGrid) => (world: IWorld) => {
    const query = defineQuery([Position, PheromoneEmitter, ForagerRole]);

    return () => {
      const entities = query(world);
      for (const eid of entities) {
        console.log(`Ant ${eid} state:`, {
          isEmitting: PheromoneEmitter.isEmitting[eid],
          foragerState: ForagerRole.state[eid],
          foodCarried: ForagerRole.foodCarried[eid],
          position: { x: Position.x[eid], y: Position.y[eid] },
        });

        if (PheromoneEmitter.isEmitting[eid] && ForagerRole.state[eid] === 1) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          const strength = PheromoneEmitter.strength[eid];
          pheromoneGrid.deposit(x, y, strength);
          console.log(
            `Ant ${eid} deposited pheromone at (${x.toFixed(1)}, ${y.toFixed(1)}) with strength ${strength}`
          );
        }
      }
    };
  };

// Debug info type for pheromone following
export type PheromoneFollowDebugInfo = {
  eid: number;
  position: { x: number; y: number };
  samples: { angle: number; x: number; y: number; value: number }[];
  bestDirection: { x: number; y: number; angle: number; value: number };
  velocity: { x: number; y: number };
};

// Pheromone Follow System with optional debug callback
export const PheromoneFollowSystem =
  (
    pheromoneGrid: PheromoneGrid,
    debugCb?: (info: PheromoneFollowDebugInfo) => void
  ) =>
  (world: IWorld) => {
    const query = defineQuery([
      Position,
      Velocity,
      PheromoneSensor,
      ForagerRole,
    ]);

    return () => {
      const entities = query(world);
      for (const eid of entities) {
        console.log(`Ant ${eid} checking for pheromones:`, {
          foragerState: ForagerRole.state[eid],
          position: { x: Position.x[eid], y: Position.y[eid] },
          sensorRadius: PheromoneSensor.radius[eid],
        });

        if (ForagerRole.state[eid] === 0) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          const radius = PheromoneSensor.radius[eid];
          const sensitivity = PheromoneSensor.sensitivity[eid];

          // Area-based sampling: sample all grid points within the sensor radius
          let sumX = 0;
          let sumY = 0;
          let total = 0;
          const samples: {
            angle: number;
            x: number;
            y: number;
            value: number;
          }[] = [];

          // Sample in a disk around the ant
          const step = 1; // 1 unit step for sampling
          for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
              if (dx * dx + dy * dy <= radius * radius) {
                const sampleX = x + dx;
                const sampleY = y + dy;
                const value = pheromoneGrid.sample(sampleX, sampleY);
                if (value > 0) {
                  console.log(
                    `Ant ${eid} detected pheromone at (${sampleX.toFixed(1)}, ${sampleY.toFixed(1)}) with strength ${value.toFixed(2)}`
                  );
                }
                samples.push({
                  angle: Math.atan2(dy, dx),
                  x: sampleX,
                  y: sampleY,
                  value,
                });
                sumX += dx * value;
                sumY += dy * value;
                total += value;
              }
            }
          }

          // Compute movement direction
          let vx = 0;
          let vy = 0;
          if (total > 0 && (sumX !== 0 || sumY !== 0)) {
            // Normalize the gradient direction
            const len = Math.sqrt(sumX * sumX + sumY * sumY);
            vx = (sumX / len) * 100 * sensitivity;
            vy = (sumY / len) * 100 * sensitivity;
            console.log(
              `Ant ${eid} following pheromone trail: total strength ${total.toFixed(2)}, direction (${vx.toFixed(1)}, ${vy.toFixed(1)})`
            );
          }
          Velocity.x[eid] = vx;
          Velocity.y[eid] = vy;

          // For debug
          if (debugCb) {
            debugCb({
              eid,
              position: { x, y },
              samples,
              bestDirection: {
                x: sumX,
                y: sumY,
                angle: Math.atan2(sumY, sumX),
                value: total,
              },
              velocity: { x: vx, y: vy },
            });
          }
        }
      }
    };
  };

export { ForageBehaviorSystem } from "./forage-behavior";
