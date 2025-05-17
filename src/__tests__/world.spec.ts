import { describe, it, expect, vi, beforeEach } from "vitest";
import { World } from "../game/world";
import * as PIXI from "pixi.js";

describe("World", () => {
  let world: World;
  let mockApp: PIXI.Application;

  beforeEach(() => {
    // Mock PIXI.Application
    mockApp = {
      stage: new PIXI.Container(),
      ticker: {
        add: vi.fn(),
        remove: vi.fn(),
      },
    } as unknown as PIXI.Application;

    world = new World(mockApp);
  });

  it("should initialize with correct properties", () => {
    expect(world).toBeDefined();
    expect(world.app).toBe(mockApp);
    expect(world.entities).toBeDefined();
    expect(world.systems).toBeDefined();
  });

  it("should start game loop when initialized", () => {
    world.init();
    expect(mockApp.ticker.add).toHaveBeenCalled();
  });

  it("should stop game loop when destroyed", () => {
    world.init();
    world.destroy();
    expect(mockApp.ticker.remove).toHaveBeenCalled();
  });
});
