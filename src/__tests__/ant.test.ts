import { describe, expect, test, beforeEach } from "vitest";
import { createWorld, addComponent, addEntity, hasComponent } from "bitecs";
import {
  Position,
  Velocity,
  PlayerControlled,
  ForagerRole,
  Target,
  Age,
  Sprite,
  AntState,
} from "../game/components";
import { AgingSystem } from "../systems/systems";
import { ANT_MAX_AGE, ANT_AGE_INCREMENT } from "../game/constants";

describe("Ant Components", () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  test("ant has all required components", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    // Verify components are properly initialized
    expect(Position.x[ant]).toBeDefined();
    expect(Position.y[ant]).toBeDefined();
    expect(Velocity.x[ant]).toBeDefined();
    expect(Velocity.y[ant]).toBeDefined();
    expect(PlayerControlled.speed[ant]).toBeDefined();
    expect(PlayerControlled.isPlayer[ant]).toBeDefined();
    expect(ForagerRole.state[ant]).toBeDefined();
    expect(ForagerRole.foodCarried[ant]).toBeDefined();
    expect(Target.x[ant]).toBeDefined();
    expect(Target.y[ant]).toBeDefined();
    expect(Target.type[ant]).toBeDefined();
  });

  test("agent ant has correct initial values", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    // Set initial values
    Position.x[ant] = 100;
    Position.y[ant] = 100;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PlayerControlled.speed[ant] = 100;
    PlayerControlled.isPlayer[ant] = 0;
    ForagerRole.state[ant] = 0;
    ForagerRole.foodCarried[ant] = 0;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 0;

    // Verify values
    expect(Position.x[ant]).toBe(100);
    expect(Position.y[ant]).toBe(100);
    expect(Velocity.x[ant]).toBe(0);
    expect(Velocity.y[ant]).toBe(0);
    expect(PlayerControlled.speed[ant]).toBe(100);
    expect(PlayerControlled.isPlayer[ant]).toBe(0);
    expect(ForagerRole.state[ant]).toBe(0);
    expect(ForagerRole.foodCarried[ant]).toBe(0);
    expect(Target.x[ant]).toBe(0);
    expect(Target.y[ant]).toBe(0);
    expect(Target.type[ant]).toBe(0);
  });
});

describe("Ant Aging", () => {
  let world: ReturnType<typeof createWorld>;
  let agingSystem: (delta: number) => void;

  beforeEach(() => {
    world = createWorld();
    agingSystem = AgingSystem(world);
  });

  test("ant age increases over time", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Age, ant);
    addComponent(world, PlayerControlled, ant);

    // Set initial values
    Age.currentAge[ant] = 0;
    Age.maxAge[ant] = ANT_MAX_AGE;
    PlayerControlled.isPlayer[ant] = 0;

    // Run aging system for 1 second
    agingSystem(1.0);

    // Age should increase by ANT_AGE_INCREMENT
    expect(Age.currentAge[ant]).toBe(ANT_AGE_INCREMENT);
  });

  test("ant dies when reaching max age", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, Sprite, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, AntState, ant);
    addComponent(world, Age, ant);

    // Set initial values
    Age.currentAge[ant] = ANT_MAX_AGE - 1;
    Age.maxAge[ant] = ANT_MAX_AGE;
    PlayerControlled.isPlayer[ant] = 0;

    // Run aging system for 1 second
    agingSystem(1.0);

    // Ant should be removed (no components)
    expect(hasComponent(world, Position, ant)).toBe(false);
    expect(hasComponent(world, Age, ant)).toBe(false);
  });

  test("player ant does not die from old age", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, Sprite, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, AntState, ant);
    addComponent(world, Age, ant);

    // Set initial values
    Age.currentAge[ant] = ANT_MAX_AGE - 1;
    Age.maxAge[ant] = ANT_MAX_AGE;
    PlayerControlled.isPlayer[ant] = 1;

    // Run aging system for 1 second
    agingSystem(1.0);

    // Player ant should still exist
    expect(Position.x[ant]).toBeDefined();
    expect(Age.currentAge[ant]).toBe(ANT_MAX_AGE);
  });
});
