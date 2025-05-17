import { defineQuery, enterQuery, exitQuery } from "bitecs";
import type { IWorld } from "bitecs";
import { Application, Container, Sprite as PixiSprite, Assets } from "pixi.js";
import { Position, Velocity, Sprite, PlayerControlled } from "./components";

// Input System
export const InputSystem = (world: IWorld) => {
  const query = defineQuery([PlayerControlled, Velocity]);
  const keys = new Set<string>();

  window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    keys.add(key);
    console.log("Key pressed:", key, "Active keys:", Array.from(keys));
  });

  window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    keys.delete(key);
    console.log("Key released:", key, "Active keys:", Array.from(keys));
  });

  return () => {
    const entities = query(world);
    for (const eid of entities) {
      const speed = PlayerControlled.speed[eid];
      const oldVelocity = { x: Velocity.x[eid], y: Velocity.y[eid] };

      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      if (keys.has("w") || keys.has("arrowup")) Velocity.y[eid] = -speed;
      if (keys.has("s") || keys.has("arrowdown")) Velocity.y[eid] = speed;
      if (keys.has("a") || keys.has("arrowleft")) Velocity.x[eid] = -speed;
      if (keys.has("d") || keys.has("arrowright")) Velocity.x[eid] = speed;

      if (
        oldVelocity.x !== Velocity.x[eid] ||
        oldVelocity.y !== Velocity.y[eid]
      ) {
        console.log("Velocity changed:", {
          entity: eid,
          old: oldVelocity,
          new: { x: Velocity.x[eid], y: Velocity.y[eid] },
        });
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
      const oldPosition = { x: Position.x[eid], y: Position.y[eid] };
      const velocity = { x: Velocity.x[eid], y: Velocity.y[eid] };

      Position.x[eid] += Velocity.x[eid] * delta;
      Position.y[eid] += Velocity.y[eid] * delta;

      if (velocity.x !== 0 || velocity.y !== 0) {
        console.log("Entity moved:", {
          entity: eid,
          delta,
          velocity,
          oldPosition,
          newPosition: { x: Position.x[eid], y: Position.y[eid] },
        });
      }
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

  return () => {
    // Handle new entities
    for (const eid of enter(world)) {
      try {
        const sprite = new PixiSprite(Assets.get("ant"));
        console.log("Created sprite:", sprite);
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
        console.log("Sprite position updated:", {
          entity: eid,
          position: { x: sprite.x, y: sprite.y },
        });
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

    // Update camera position to follow player
    const playerQuery = defineQuery([Position, PlayerControlled]);
    const players = playerQuery(world);
    if (players.length > 0) {
      const playerEid = players[0];
      const playerX = Position.x[playerEid];
      const playerY = Position.y[playerEid];

      // Setze die Kamera auf die Spielerposition
      container.position.set(
        app.screen.width / 2 - playerX,
        app.screen.height / 2 - playerY
      );

      console.log("Camera position updated:", {
        playerPosition: { x: playerX, y: playerY },
        cameraPosition: { x: container.position.x, y: container.position.y },
      });
    }
  };
};
