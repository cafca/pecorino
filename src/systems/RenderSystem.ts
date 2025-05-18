import { defineQuery, enterQuery, exitQuery } from "bitecs";
import type { IWorld } from "bitecs";
import {
  Application,
  Container,
  Sprite as PixiSprite,
  Assets,
  Text,
} from "pixi.js";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  ForagerRole,
  AntState,
  Age,
  AntStateType,
  Target,
} from "@/game/components";

// Render System
export const RenderSystem = (app: Application) => (world: IWorld) => {
  const query = defineQuery([Position, Sprite]);
  const enter = enterQuery(query);
  const exit = exitQuery(query);
  const sprites = new Map<number, PixiSprite>();
  const labels = new Map<number, Text>();

  const container = app.stage.children[0] as Container;

  const createSprite = (eid: number) => {
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

    if (ForagerRole.foodCarried[eid] === 1) {
      sprite.tint = 0xff0000; // Red tint for ants carrying food
    } else {
      sprite.tint = 0xffffff; // White (no tint) for ants searching for food
    }

    return sprite;
  };

  const createLabel = () => {
    const label = new Text("", {
      fontSize: 12,
      fill: 0x666666,
      align: "center",
    });
    label.anchor.set(1.5);
    return label;
  };

  const handleNewEntities = (newEntities: number[]) => {
    for (const eid of newEntities) {
      const sprite = createSprite(eid);
      container.addChild(sprite);
      sprites.set(eid, sprite);

      if (Sprite.texture[eid] === 0) {
        const label = createLabel();
        container.addChild(label);
        labels.set(eid, label);
      }
    }
  };

  const handleRemovedEntities = (removedEntities: number[]) => {
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
  };

  const updateEntitySprite = (eid: number) => {
    const sprite = sprites.get(eid);
    if (!sprite) return;

    sprite.x = Position.x[eid];
    sprite.y = Position.y[eid];

    if (Sprite.texture[eid] === 0) {
      if (Velocity.x[eid] !== 0 || Velocity.y[eid] !== 0) {
        const movingRight =
          Math.cos(Math.atan2(Velocity.y[eid], Velocity.x[eid])) > 0;

        if (Target.x[eid] !== 0 && !PlayerControlled.isPlayer[eid]) {
          if (movingRight) {
            sprite.rotation = Math.atan2(
              Target.y[eid] - Position.y[eid],
              Target.x[eid] - Position.x[eid]
            );
          } else {
            sprite.rotation =
              Math.atan2(
                Target.y[eid] - Position.y[eid],
                Target.x[eid] - Position.x[eid]
              ) + Math.PI;
          }
        }

        sprite.scale.x = movingRight
          ? -Math.abs(sprite.scale.y)
          : Math.abs(sprite.scale.y);
      }
      updateLabel(eid);
    } else {
      sprite.rotation = 0;
    }
  };

  const updateLabel = (eid: number) => {
    const label = labels.get(eid);
    if (!label) return;

    const stateType = AntState.currentState[eid];
    const stateText = AntStateType[stateType];
    const isPlayer = PlayerControlled.isPlayer[eid] === 1;
    const age = Age.currentAge[eid];
    const maxAge = Age.maxAge[eid];
    const agePercentage = Math.floor((age / maxAge) * 100);

    label.text = isPlayer ? "YOU" : `${stateText} | Age: ${agePercentage}%`;
    label.position.set(Position.x[eid], Position.y[eid] - 20);
  };

  // Initialize
  container.position.set(0, 0);

  return () => {
    handleNewEntities(enter(world));
    handleRemovedEntities(exit(world));

    const entities = query(world);
    for (const eid of entities) {
      updateEntitySprite(eid);
    }
  };
};
