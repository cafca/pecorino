import { defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
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
  ForagerRole,
  Target,
  AntState,
  Age,
  AntStateType,
} from "../game/components";
import { ANT_AGE_INCREMENT } from "../game/constants";

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
    const gridDimensionX = window.innerWidth;
    const gridDimensionY = window.innerHeight;

    // If no grid is available, use default boundaries
    const distanceToEdgeX = gridDimensionX / 2;
    const distanceToEdgeY = gridDimensionY / 2;

    for (const eid of entities) {
      // If the ant is an NPC and has a current target, set
      // its velocity towards the target.
      if (!PlayerControlled.isPlayer[eid] && Target.x[eid] !== undefined) {
        const dx = Target.x[eid] - Position.x[eid];
        const dy = Target.y[eid] - Position.y[eid];
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const speed = PlayerControlled.speed[eid] || 1;
          Velocity.x[eid] = (dx / distance) * speed;
          Velocity.y[eid] = (dy / distance) * speed;
        }
      }
      // Calculate new position
      const newX = Position.x[eid] + Velocity.x[eid] * delta;
      const newY = Position.y[eid] + Velocity.y[eid] * delta;

      // Check boundaries and adjust if needed
      if (newX < -distanceToEdgeX) {
        Position.x[eid] = -distanceToEdgeX;
        Velocity.x[eid] = 0;
      } else if (newX > distanceToEdgeX) {
        Position.x[eid] = distanceToEdgeX;
        Velocity.x[eid] = 0;
      } else {
        Position.x[eid] = newX;
      }

      if (newY < -distanceToEdgeY) {
        Position.y[eid] = -distanceToEdgeY;
        Velocity.y[eid] = 0;
      } else if (newY > distanceToEdgeY) {
        Position.y[eid] = distanceToEdgeY;
        Velocity.y[eid] = 0;
      } else {
        Position.y[eid] = newY;
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
  const labels = new Map<number, Text>();
  const container = new Container();
  app.stage.addChild(container);

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
          console.warn(`Unknown texture for entity ${eid}`);
          texture = "ant";
      }
      const sprite = new PixiSprite(Assets.get(texture));
      sprite.anchor.set(0.5);
      sprite.scale.set(Sprite.scale[eid]);

      // Tint ants based on their state
      if (ForagerRole.foodCarried[eid] === 1) {
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
            const isPlayer = PlayerControlled.isPlayer[eid] === 1;
            const age = Age.currentAge[eid];
            const maxAge = Age.maxAge[eid];
            const agePercentage = Math.floor((age / maxAge) * 100);
            label.text = isPlayer
              ? "YOU"
              : `${stateText} | Age: ${agePercentage}%`;
            label.position.set(Position.x[eid], Position.y[eid] - 20);
          }
        } else {
          sprite.rotation = 0;
        }
      }
    }
  };
};

export const AntStateSystem = (world: IWorld) => {
  const foragerEntityQuery = defineQuery([
    AntState,
    Position,
    Velocity,
    ForagerRole,
    PlayerControlled,
  ]);

  return () => {
    const foragerEntities = foragerEntityQuery(world);
    for (const eid of foragerEntities) {
      // State transition logic
      if (PlayerControlled.isPlayer[eid] === 1) {
        AntState.currentState[eid] = AntStateType.PLAYER_CONTROLLED;
      } else if (ForagerRole.foodCarried[eid] === 1) {
        AntState.currentState[eid] = AntStateType.CARRYING_FOOD;
      } else if (AntState.currentState[eid] === AntStateType.PICKING_UP_FOOD) {
        // Keep PICKING_UP_FOOD state until food is picked up or lost
        // The ForageBehaviorSystem will handle transitioning out of this state
      } else if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
        AntState.currentState[eid] = AntStateType.EXPLORING;
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

export const AgingSystem = (world: IWorld) => {
  const query = defineQuery([Age]);

  return (delta: number) => {
    const entities = query(world);
    for (const eid of entities) {
      // Increment age
      Age.currentAge[eid] += ANT_AGE_INCREMENT * delta;

      // Check if ant has reached max age
      if (Age.currentAge[eid] >= Age.maxAge[eid]) {
        // Don't kill player ant
        if (PlayerControlled.isPlayer[eid] === 0) {
          // Remove all components
          removeComponent(world, Position, eid);
          removeComponent(world, Velocity, eid);
          removeComponent(world, Sprite, eid);
          removeComponent(world, PlayerControlled, eid);
          removeComponent(world, ForagerRole, eid);
          removeComponent(world, Target, eid);
          removeComponent(world, AntState, eid);
          removeComponent(world, Age, eid);
        }
      }
    }
  };
};

export { ForageBehaviorSystem } from "./forage-behavior";
