import { describe, expect, test, beforeEach } from "vitest";
import { createWorld, addComponent, addEntity } from "bitecs";
import {
  Position,
  Velocity,
  PlayerControlled,
  PheromoneEmitter,
  PheromoneSensor,
  ForagerRole,
  Target,
} from "../game/components";
import { MovementSystem } from "../systems/systems";

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
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, PheromoneSensor, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    // Verify components are properly initialized
    expect(Position.x[ant]).toBeDefined();
    expect(Position.y[ant]).toBeDefined();
    expect(Velocity.x[ant]).toBeDefined();
    expect(Velocity.y[ant]).toBeDefined();
    expect(PlayerControlled.speed[ant]).toBeDefined();
    expect(PlayerControlled.isPlayer[ant]).toBeDefined();
    expect(PheromoneEmitter.strength[ant]).toBeDefined();
    expect(PheromoneEmitter.isEmitting[ant]).toBeDefined();
    expect(PheromoneSensor.radius[ant]).toBeDefined();
    expect(PheromoneSensor.sensitivity[ant]).toBeDefined();
    expect(ForagerRole.state[ant]).toBeDefined();
    expect(ForagerRole.foodCarried[ant]).toBeDefined();
    expect(Target.x[ant]).toBeDefined();
    expect(Target.y[ant]).toBeDefined();
    expect(Target.type[ant]).toBeDefined();
  });

  test("player ant has correct initial values", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, PheromoneSensor, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    // Set initial values
    Position.x[ant] = 0;
    Position.y[ant] = 0;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PlayerControlled.speed[ant] = 100;
    PlayerControlled.isPlayer[ant] = 1;
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 0;
    PheromoneSensor.radius[ant] = 20;
    PheromoneSensor.sensitivity[ant] = 0.5;
    ForagerRole.state[ant] = 0;
    ForagerRole.foodCarried[ant] = 0;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 0;

    // Verify values
    expect(Position.x[ant]).toBe(0);
    expect(Position.y[ant]).toBe(0);
    expect(Velocity.x[ant]).toBe(0);
    expect(Velocity.y[ant]).toBe(0);
    expect(PlayerControlled.speed[ant]).toBe(100);
    expect(PlayerControlled.isPlayer[ant]).toBe(1);
    expect(PheromoneEmitter.strength[ant]).toBe(1.0);
    expect(PheromoneEmitter.isEmitting[ant]).toBe(0);
    expect(PheromoneSensor.radius[ant]).toBe(20);
    expect(PheromoneSensor.sensitivity[ant]).toBe(0.5);
    expect(ForagerRole.state[ant]).toBe(0);
    expect(ForagerRole.foodCarried[ant]).toBe(0);
    expect(Target.x[ant]).toBe(0);
    expect(Target.y[ant]).toBe(0);
    expect(Target.type[ant]).toBe(0);
  });

  test("agent ant has correct initial values", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);
    addComponent(world, PlayerControlled, ant);
    addComponent(world, PheromoneEmitter, ant);
    addComponent(world, PheromoneSensor, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);

    // Set initial values
    Position.x[ant] = 100;
    Position.y[ant] = 100;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;
    PlayerControlled.speed[ant] = 100;
    PlayerControlled.isPlayer[ant] = 0;
    PheromoneEmitter.strength[ant] = 1.0;
    PheromoneEmitter.isEmitting[ant] = 0;
    PheromoneSensor.radius[ant] = 20;
    PheromoneSensor.sensitivity[ant] = 0.5;
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
    expect(PheromoneEmitter.strength[ant]).toBe(1.0);
    expect(PheromoneEmitter.isEmitting[ant]).toBe(0);
    expect(PheromoneSensor.radius[ant]).toBe(20);
    expect(PheromoneSensor.sensitivity[ant]).toBe(0.5);
    expect(ForagerRole.state[ant]).toBe(0);
    expect(ForagerRole.foodCarried[ant]).toBe(0);
    expect(Target.x[ant]).toBe(0);
    expect(Target.y[ant]).toBe(0);
    expect(Target.type[ant]).toBe(0);
  });
});

describe("Ant Movement", () => {
  let world: ReturnType<typeof createWorld>;
  let movementSystem: (delta: number) => void;

  beforeEach(() => {
    world = createWorld();
    movementSystem = MovementSystem(world);
  });

  test("ant moves based on velocity", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);

    // Set initial position and velocity
    Position.x[ant] = 0;
    Position.y[ant] = 0;
    Velocity.x[ant] = 10;
    Velocity.y[ant] = 5;

    // Run movement system with 0.5s delta
    movementSystem(0.5);

    // Position should be updated: pos = pos + vel * delta
    expect(Position.x[ant]).toBe(5); // 0 + 10 * 0.5
    expect(Position.y[ant]).toBe(2.5); // 0 + 5 * 0.5
  });

  test("ant stops when velocity is zero", () => {
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, Velocity, ant);

    // Set initial position and zero velocity
    Position.x[ant] = 100;
    Position.y[ant] = 100;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;

    // Run movement system
    movementSystem(1.0);

    // Position should remain unchanged
    expect(Position.x[ant]).toBe(100);
    expect(Position.y[ant]).toBe(100);
  });

  test("multiple ants move independently", () => {
    const ant1 = addEntity(world);
    const ant2 = addEntity(world);

    addComponent(world, Position, ant1);
    addComponent(world, Velocity, ant1);
    addComponent(world, Position, ant2);
    addComponent(world, Velocity, ant2);

    // Set different initial positions and velocities
    Position.x[ant1] = 0;
    Position.y[ant1] = 0;
    Velocity.x[ant1] = 10;
    Velocity.y[ant1] = 10;

    Position.x[ant2] = 100;
    Position.y[ant2] = 100;
    Velocity.x[ant2] = -10;
    Velocity.y[ant2] = -10;

    // Run movement system
    movementSystem(1.0);

    // Verify each ant moved correctly
    expect(Position.x[ant1]).toBe(10);
    expect(Position.y[ant1]).toBe(10);
    expect(Position.x[ant2]).toBe(90);
    expect(Position.y[ant2]).toBe(90);
  });
});
