import { defineComponent, Types } from "bitecs";

export const Camera = defineComponent({
  x: Types.f32, // Camera position X in world coordinates
  y: Types.f32, // Camera position Y in world coordinates
  zoom: Types.f32, // Camera zoom level
  isDragging: Types.ui8, // Whether the camera is being dragged
  dragStartX: Types.f32, // Mouse position when drag started
  dragStartY: Types.f32, // Mouse position when drag started
  lastX: Types.f32, // Last camera position X
  lastY: Types.f32, // Last camera position Y
});
