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
});
