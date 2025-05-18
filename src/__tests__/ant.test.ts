import { describe, expect, test, beforeEach } from "vitest";
import { createWorld, hasComponent } from "bitecs";
import {
  Position,
  Velocity,
  PlayerControlled,
  ForagerRole,
  Target,
  Age,
  AntState,
} from "../game/components";
import { AgingSystem } from "../systems";
import { ANT_MAX_AGE, ANT_AGE_INCREMENT } from "../game/constants";
import { createAnt } from "@/game/prefabs/ant";

describe("Ant Components", () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  test("ant has all required components", () => {
    const ant = createAnt(world, {
      x: 100,
      y: 100,
      isPlayer: false,
      initialAge: 0,
    });

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
    const ant = createAnt(world, {
      x: 100,
      y: 100,
      isPlayer: false,
      initialAge: 0,
    });

    // Verify values
    expect(Position.x[ant]).toBe(100);
    expect(Position.y[ant]).toBe(100);
    expect(Velocity.x[ant]).toBe(0);
    expect(Velocity.y[ant]).toBe(0);
    expect(PlayerControlled.speed[ant]).toBe(100);
    expect(PlayerControlled.isPlayer[ant]).toBe(0);
    expect(ForagerRole.state[ant]).toBe(0);
    expect(ForagerRole.foodCarried[ant]).toBe(0);
    expect(Target.x[ant]).toBe(100);
    expect(Target.y[ant]).toBe(100);
    expect(Target.type[ant]).toBe(0);
    expect(AntState.currentState[ant]).toBe(0);
    expect(AntState.previousState[ant]).toBe(0);
    expect(AntState.stateTimer[ant]).toBe(0);
    expect(Age.currentAge[ant]).toBe(0);
    expect(Age.maxAge[ant]).toBe(ANT_MAX_AGE);
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
    const ant = createAnt(world, {
      x: 100,
      y: 100,
      isPlayer: false,
      initialAge: 0,
    });

    // Run aging system for 1 second
    agingSystem(1.0);

    // Age should increase by ANT_AGE_INCREMENT
    expect(Age.currentAge[ant]).toBe(ANT_AGE_INCREMENT);
    expect(Age.maxAge[ant]).toBe(ANT_MAX_AGE);
  });

  test("ant dies when reaching max age", () => {
    const ant = createAnt(world, {
      x: 100,
      y: 100,
      isPlayer: false,
      initialAge: ANT_MAX_AGE - 1,
    });

    // Run aging system for 1 second
    agingSystem(1.0);

    // Ant should be removed (no components)
    expect(hasComponent(world, Position, ant)).toBe(false);
    expect(hasComponent(world, Age, ant)).toBe(false);
  });

  test("player ant does not die from old age", () => {
    const ant = createAnt(world, {
      x: 100,
      y: 100,
      isPlayer: true,
      initialAge: ANT_MAX_AGE - 1,
    });

    // Verify initial values
    expect(Age.currentAge[ant]).toBe(ANT_MAX_AGE - 1);
    expect(Age.maxAge[ant]).toBe(ANT_MAX_AGE);
    expect(PlayerControlled.isPlayer[ant]).toBe(1);

    // Run aging system for 1 second
    agingSystem(1.0);

    // Player ant should still exist
    expect(Position.x[ant]).toBeDefined();
    expect(Age.currentAge[ant]).toBe(ANT_MAX_AGE);
  });
});
