import { describe, expect, test, beforeEach } from "vitest";
import { createWorld, addComponent, addEntity, defineQuery } from "bitecs";
import {
  Position,
  Nest,
  ForagerRole,
  Target,
  Velocity,
} from "../game/components";
import { ForageBehaviorSystem } from "../systems/systems";

describe("Nest", () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  test("nest is created with 0 food", () => {
    const nest = addEntity(world);
    addComponent(world, Position, nest);
    addComponent(world, Nest, nest);

    // Set initial position
    Position.x[nest] = 0;
    Position.y[nest] = 0;

    // Verify initial food count
    expect(Nest.foodCount[nest]).toBe(0);
  });

  test("nest food count increases when food is deposited", () => {
    const nest = addEntity(world);
    addComponent(world, Position, nest);
    addComponent(world, Nest, nest);

    // Set initial position
    Position.x[nest] = 0;
    Position.y[nest] = 0;

    // Create an ant carrying food
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, Velocity, ant);

    // Set ant position within nest radius (48 units)
    Position.x[ant] = 20;
    Position.y[ant] = 20;
    ForagerRole.state[ant] = 1; // Carrying food
    ForagerRole.foodCarried[ant] = 1;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 1;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;

    // Run forage behavior system
    const forageSystem = ForageBehaviorSystem(world);
    forageSystem();

    // Verify food count increased
    expect(Nest.foodCount[nest]).toBe(1);
  });

  test("spawns new ant when 5 food items are collected", () => {
    const world = createWorld();

    // Create nest
    const nest = addEntity(world);
    addComponent(world, Position, nest);
    addComponent(world, Nest, nest);
    Position.x[nest] = 0;
    Position.y[nest] = 0;

    // Create initial ant
    const ant = addEntity(world);
    addComponent(world, Position, ant);
    addComponent(world, ForagerRole, ant);
    addComponent(world, Target, ant);
    addComponent(world, Velocity, ant);
    Position.x[ant] = 20;
    Position.y[ant] = 20;
    ForagerRole.state[ant] = 1; // Carrying food
    ForagerRole.foodCarried[ant] = 1;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 1;
    Velocity.x[ant] = 0;
    Velocity.y[ant] = 0;

    // Set initial food count to 4
    Nest.foodCount[nest] = 4;

    // Get initial ant count
    const antQuery = defineQuery([ForagerRole]);
    const initialAntCount = antQuery(world).length;

    // Run forage behavior system to deposit 5th food item
    const forageSystem = ForageBehaviorSystem(world);
    forageSystem();

    // Verify a new ant was spawned
    const finalAntCount = antQuery(world).length;
    expect(finalAntCount).toBe(initialAntCount + 1);

    // Verify food count was reset to 0
    expect(Nest.foodCount[nest]).toBe(0);
  });
});
