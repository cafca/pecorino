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
  Target,
  Food,
} from "./components";
import { PheromoneGrid } from "./pheromoneGrid";

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
      const speed = PlayerControlled.speed[eid];

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      if (keys.has("w") || keys.has("arrowup")) Velocity.y[eid] = -speed;
      if (keys.has("s") || keys.has("arrowdown")) Velocity.y[eid] = speed;
      if (keys.has("a") || keys.has("arrowleft")) Velocity.x[eid] = -speed;
      if (keys.has("d") || keys.has("arrowright")) Velocity.x[eid] = speed;
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
  app.stage.addChild(container);

  // Zentriere den Container initial
  container.position.set(app.screen.width / 2, app.screen.height / 2);

  return () => {
    // Handle new entities
    for (const eid of enter(world)) {
      try {
        const texture = Sprite.texture[eid] === 0 ? "ant" : "food";
        const sprite = new PixiSprite(Assets.get(texture));
        sprite.anchor.set(0.5);
        sprite.scale.set(Sprite.scale[eid]);
        container.addChild(sprite);
        sprites.set(eid, sprite);
      } catch (error) {
        console.error("Error creating sprite:", error);
      }
    }

    // Update positions
    const entities = query(world);
    for (const eid of entities) {
      const sprite = sprites.get(eid);
      if (sprite) {
        sprite.x = Position.x[eid];
        sprite.y = Position.y[eid];
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
          const strength = PheromoneEmitter.strength[eid];
          pheromoneGrid.deposit(x, y, strength);
        }
      }
    };
  };

// Pheromone Follow System
export const PheromoneFollowSystem =
  (pheromoneGrid: PheromoneGrid) => (world: IWorld) => {
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

          // Sample pheromone levels in surrounding area
          let maxPheromone = 0;
          let bestDirection = { x: 0, y: 0 };

          for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
            const sampleX = x + Math.cos(angle) * radius;
            const sampleY = y + Math.sin(angle) * radius;
            const pheromoneLevel = pheromoneGrid.sample(sampleX, sampleY);

            if (pheromoneLevel > maxPheromone) {
              maxPheromone = pheromoneLevel;
              bestDirection = { x: Math.cos(angle), y: Math.sin(angle) };
            }
          }

          // Adjust velocity based on pheromone gradient
          if (maxPheromone > 0) {
            const speed = Math.sqrt(
              Velocity.x[eid] * Velocity.x[eid] +
                Velocity.y[eid] * Velocity.y[eid]
            );
            Velocity.x[eid] = bestDirection.x * speed * sensitivity;
            Velocity.y[eid] = bestDirection.y * speed * sensitivity;
          }
        }
      }
    };
  };

// Forage Behavior System
export const ForageBehaviorSystem = (world: IWorld) => {
  const foragerQuery = defineQuery([Position, ForagerRole, Target]);
  const foodQuery = defineQuery([Position, Food]);

  return () => {
    const foragers = foragerQuery(world);
    const foods = foodQuery(world);

    for (const eid of foragers) {
      const state = ForagerRole.state[eid];
      const x = Position.x[eid];
      const y = Position.y[eid];

      switch (state) {
        case 0: {
          // FindFood
          // Find nearest food
          let nearestFood = null;
          let minDist = Infinity;
          for (const foodEid of foods) {
            const dx = Position.x[foodEid] - x;
            const dy = Position.y[foodEid] - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) {
              minDist = dist;
              nearestFood = foodEid;
            }
          }

          if (nearestFood !== null) {
            Target.x[eid] = Position.x[nearestFood];
            Target.y[eid] = Position.y[nearestFood];
            Target.type[eid] = 0; // Food target

            // If close enough to food, pick it up
            if (minDist < 10) {
              ForagerRole.state[eid] = 1; // Switch to CarryFood
              ForagerRole.foodCarried[eid] = 1;
              Food.amount[nearestFood] -= 1;
            }
          }
          break;
        }

        case 1: {
          // CarryFood
          // Set target to nest (0,0)
          Target.x[eid] = 0;
          Target.y[eid] = 0;
          Target.type[eid] = 1; // Nest target

          // If at nest, deposit food
          const distToNest = Math.sqrt(x * x + y * y);
          if (distToNest < 10) {
            ForagerRole.state[eid] = 0; // Switch back to FindFood
            ForagerRole.foodCarried[eid] = 0;
            console.log("Food deposited at nest!");
          }
          break;
        }
      }
    }
  };
};
