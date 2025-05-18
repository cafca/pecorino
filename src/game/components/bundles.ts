import type { IWorld, ComponentType } from "bitecs";
import { addComponent } from "bitecs";
import {
  Position,
  Velocity,
  Sprite,
  PlayerControlled,
  ForagerRole,
  Target,
  AntState,
  Age,
  Food,
  Nest,
  TargetVisualization,
  Tree,
} from "@/game/components";

export const PhysicsBundle = [Position, Velocity];
export const RenderBundle = [Position, Sprite];

// Entity type bundles
export const AntBundle = [
  ...PhysicsBundle,
  ...RenderBundle,
  PlayerControlled,
  ForagerRole,
  Target,
  AntState,
  Age,
  TargetVisualization,
] as const;

export const FoodBundle = [...RenderBundle, Food] as const;

export const NestBundle = [...RenderBundle, Nest] as const;

export const TreeBundle = [...RenderBundle, Tree] as const;

// Define a more specific type for component properties
type ComponentProperties = {
  [key: string]: "f32" | "ui8" | "ui16" | "i32";
};

export type ComponentBundle = readonly ComponentType<ComponentProperties>[];

export function applyBundle(
  world: IWorld,
  eid: number,
  bundle: ComponentBundle
) {
  bundle.forEach((component) => addComponent(world, component, eid));
}
