import * as PIXI from "pixi.js";
import { createWorld } from "bitecs";

export class World {
  public app: PIXI.Application;
  public entities: ReturnType<typeof createWorld>;
  public systems: Array<(delta: number) => void>;

  constructor(app: PIXI.Application) {
    this.app = app;
    this.entities = createWorld();
    this.systems = [];
  }

  public init(): void {
    this.app.ticker.add(this.update.bind(this));
  }

  public destroy(): void {
    this.app.ticker.remove(this.update.bind(this));
  }

  private update(delta: number): void {
    for (const system of this.systems) {
      system(delta);
    }
  }
}
