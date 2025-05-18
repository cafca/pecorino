import { defineQuery, enterQuery, exitQuery } from "bitecs";
import type { IWorld } from "bitecs";
import {
  Application,
  Container,
  Sprite as PixiSprite,
  Assets,
  Graphics,
  Text,
} from "pixi.js";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  AntState,
  AntStateType,
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
  const labels = new Map<number, Text>();
  const container = new Container();
  const pheromoneContainer = new Container();
  app.stage.addChild(container);
  app.stage.addChild(pheromoneContainer);

  // Add sand-colored background
  const background = new Graphics();
  background.beginFill(0xeeda94); // Sand color
  background.drawRect(
    -app.screen.width / 2,
    -app.screen.height / 2,
    app.screen.width,
    app.screen.height
  );
  background.endFill();
  container.addChild(background);

  // Center the containers initially
  container.position.set(app.screen.width / 2, app.screen.height / 2);
  pheromoneContainer.position.set(app.screen.width / 2, app.screen.height / 2);
  pheromoneContainer.scale.set(1);

  // Create a graphics object for pheromone visualization
  const pheromoneGraphics = new Graphics();
  pheromoneContainer.addChild(pheromoneGraphics);

  return () => {
    // Handle new entities
    const newEntities = enter(world);
    for (const eid of newEntities) {
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

      // Tint ants based on their state
      if (ForagerRole.state[eid] === 1) {
        sprite.tint = 0xff0000; // Red tint for ants carrying food
      } else {
        sprite.tint = 0xffffff; // White (no tint) for ants searching for food
      }

      container.addChild(sprite);
      sprites.set(eid, sprite);

      // Create label for ants
      if (Sprite.texture[eid] === 0) {
        const label = new Text("", {
          fontSize: 12,
          fill: 0x666666,
          align: "center",
        });
        label.anchor.set(1.5);
        container.addChild(label);
        labels.set(eid, label);
      }
    }

    // Handle removed entities
    const removedEntities = exit(world);
    for (const eid of removedEntities) {
      const sprite = sprites.get(eid);
      if (sprite) {
        container.removeChild(sprite);
        sprites.delete(eid);
      }
      const label = labels.get(eid);
      if (label) {
        container.removeChild(label);
        labels.delete(eid);
      }
    }

    // Update entity sprites and labels
    const entities = query(world);
    for (const eid of entities) {
      const sprite = sprites.get(eid);
      if (sprite) {
        sprite.x = Position.x[eid];
        sprite.y = Position.y[eid];
        // Only rotate ants, keep food and nest upright
        if (Sprite.texture[eid] === 0) {
          // 0 is ant texture
          // Calculate rotation based on velocity for both player and AI ants
          if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
            sprite.rotation =
              Math.atan2(Velocity.y[eid], Velocity.x[eid]) + Math.PI;
          }

          // Update label for ants
          const label = labels.get(eid);
          if (label) {
            const stateType = AntState.currentState[eid];
            const stateText = AntStateType[stateType];
            label.text = stateText;
            label.x = Position.x[eid];
            label.y = Position.y[eid] - 20; // Position label above the ant
          }
        } else {
          sprite.rotation = 0;
        }
      }
    }

    // Update pheromone visualization
    const grid = (window as { game?: { pheromoneGrid: PheromoneGrid } }).game
      ?.pheromoneGrid;
    if (grid) {
      const resolution = grid.getResolution();
      const width = grid.getGridWidth();
      const height = grid.getGridHeight();
      const gridData = grid.getGridData();

      // Clear previous pheromone visualization
      pheromoneGraphics.clear();

      // Draw pheromone trails using a heatmap-like approach
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = y * width + x;
          const strength = gridData[index];

          if (strength > 0) {
            // Convert grid coordinates to world coordinates
            const worldX = x / resolution;
            const worldY = y / resolution;

            // Calculate color based on strength
            const alpha = Math.min(strength, 1);
            const color = 0x00ff00 + Math.floor(alpha * 0x0000ff); // Green to blue gradient

            // Draw a larger circle for each pheromone point
            pheromoneGraphics.beginFill(color, alpha * 0.5);
            pheromoneGraphics.drawCircle(worldX, worldY, 5.0);
            pheromoneGraphics.endFill();
          }
        }
      }
    } else {
      console.warn("No pheromone grid found in game instance");
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
        if (PheromoneEmitter.isEmitting[eid] && ForagerRole.state[eid] === 1) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          pheromoneGrid.deposit(x, y, 1.0);
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

export const AntStateSystem = (world: IWorld) => {
  const query = defineQuery([
    AntState,
    Position,
    Velocity,
    ForagerRole,
    PlayerControlled,
  ]);

  return () => {
    const entities = query(world);
    for (const eid of entities) {
      // State transition logic
      if (PlayerControlled.isPlayer[eid] === 1) {
        AntState.currentState[eid] = AntStateType.PLAYER_CONTROLLED;
      } else if (ForagerRole.foodCarried[eid] === 1) {
        AntState.currentState[eid] = AntStateType.CARRYING_FOOD;
      } else if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
        const pheromoneValue =
          (
            window as { game?: { pheromoneGrid: PheromoneGrid } }
          ).game?.pheromoneGrid?.sample(Position.x[eid], Position.y[eid]) || 0;

        AntState.currentState[eid] =
          pheromoneValue > 0
            ? AntStateType.FOLLOWING_TRAIL
            : AntStateType.EXPLORING;
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
