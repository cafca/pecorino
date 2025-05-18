import { defineComponent, Types } from "bitecs";

export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32,
});

export const Sprite = defineComponent({
  texture: Types.ui8,
  width: Types.ui16,
  height: Types.ui16,
  scale: Types.f32,
});

export const PlayerControlled = defineComponent({
  speed: Types.f32,
  isPlayer: Types.ui8, // 1 for player, 0 for AI
});

// Neue Komponenten für das Pheromon-System
export const PheromoneEmitter = defineComponent({
  strength: Types.f32,
  isEmitting: Types.ui8,
});

export const PheromoneSensor = defineComponent({
  radius: Types.f32,
  sensitivity: Types.f32,
});

export const ForagerRole = defineComponent({
  state: Types.ui8, // 0: FindFood, 1: CarryFood
  foodCarried: Types.ui8,
});

export const Target = defineComponent({
  x: Types.f32,
  y: Types.f32,
  type: Types.ui8, // 0: Food, 1: Nest, 2: Direct
});

export const Food = defineComponent({
  amount: Types.f32,
});

export const Nest = defineComponent({
  foodCount: Types.f32,
});

export enum AntStateType {
  IDLE = 0,
  EXPLORING = 1,
  FOLLOWING_TRAIL = 2,
  CARRYING_FOOD = 3,
  RETURNING_TO_NEST = 4,
  PLAYER_CONTROLLED = 5,
  PICKING_UP_FOOD = 6,
}

export const AntState = defineComponent({
  currentState: Types.ui8,
  previousState: Types.ui8,
  stateTimer: Types.f32,
});

export const Age = defineComponent({
  currentAge: Types.f32,
  maxAge: Types.f32,
});
