import { Application } from "pixi.js";
import { World } from "./game/world";

// PixiJS-Anwendung initialisieren
const app = new Application();
await app.init({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0x1099bb,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

// Canvas zum DOM hinzufügen
document.body.appendChild(app.canvas as HTMLCanvasElement);

// WebGL-Kontext wiederherstellen
app.canvas.addEventListener("webglcontextlost", (e) => {
  e.preventDefault();
  console.log("WebGL context lost, attempting to restore...");
});

app.canvas.addEventListener("webglcontextrestored", () => {
  console.log("WebGL context restored");
  app.renderer.clear();
});

// Responsive Design
window.addEventListener("resize", () => {
  app.renderer.resize(window.innerWidth, window.innerHeight);
});

// Spielwelt initialisieren
const world = new World(app);

// Game Loop
app.ticker.add(() => {
  world.update(app.ticker.deltaMS);
});
