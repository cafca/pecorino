import { describe, expect, test, beforeEach } from "vitest";
import { createWorld, defineQuery } from "bitecs";
import { Nest, ForagerRole, Target } from "../game/components";
import { ForageBehaviorSystem } from "../systems";
import { ANT_SPAWN_COST, NEST_RADIUS } from "@/game/constants";
import { createNest } from "@/game/prefabs/nest";
import { createAnt } from "@/game/prefabs/ant";

describe("Nest", () => {
  let world: ReturnType<typeof createWorld>;

  beforeEach(() => {
    world = createWorld();
  });

  test("nest is created with 0 food", () => {
    const nest = createNest(world, {
      x: 0,
      y: 0,
    });

    // Verify initial food count
    expect(Nest.foodCount[nest]).toBe(0);
  });

  test("nest food count increases when food is deposited", () => {
    const nest = createNest(world, {
      x: 0,
      y: 0,
    });

    // Create an ant carrying food
    const ant = createAnt(world, {
      x: NEST_RADIUS / 2,
      y: NEST_RADIUS / 2,
      isPlayer: false,
      initialAge: 0,
    });

    ForagerRole.state[ant] = 1; // Carrying food
    ForagerRole.foodCarried[ant] = 1;
    Target.x[ant] = 0;
    Target.y[ant] = 0;
    Target.type[ant] = 1;

    // Run forage behavior system
    const forageSystem = ForageBehaviorSystem(world);
    forageSystem();

    // Verify food count increased
    expect(Nest.foodCount[nest]).toBe(1);
  });

  test(
    "spawns new ant when " + ANT_SPAWN_COST + " food items are collected",
    () => {
      const world = createWorld();

      // Create nest
      const nest = createNest(world, {
        x: 0,
        y: 0,
      });

      // Create initial ant
      const ant = createAnt(world, {
        x: NEST_RADIUS / 2,
        y: NEST_RADIUS / 2,
        isPlayer: false,
        initialAge: 0,
      });

      ForagerRole.state[ant] = 1; // Carrying food
      ForagerRole.foodCarried[ant] = 1;
      Target.x[ant] = 0;
      Target.y[ant] = 0;
      Target.type[ant] = 1;

      // Set initial food count to ANT_SPAWN_COST - 1
      Nest.foodCount[nest] = ANT_SPAWN_COST - 1;

      // Get initial ant count
      const antQuery = defineQuery([ForagerRole]);
      const initialAntCount = antQuery(world).length;

      // Run forage behavior system to deposit last food item
      const forageSystem = ForageBehaviorSystem(world);
      forageSystem();

      // Verify a new ant was spawned
      const finalAntCount = antQuery(world).length;
      expect(finalAntCount).toBe(initialAntCount + 1);

      // Verify food count was reset to 0
      expect(Nest.foodCount[nest]).toBe(0);
    }
  );
});
