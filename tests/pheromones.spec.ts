import { test, expect } from "@playwright/test";
import { isGameReady } from "./utils";

test.describe("Pheromone Trails", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Wait for React app to initialize and game to be ready
    await page.waitForFunction(isGameReady, { timeout: 5000 });

    // Additional wait to ensure game loop is running
    await page.waitForTimeout(100);

    page.on("console", (message) => {
      // eslint-disable-next-line no-undef
      console.log(`PAGE LOG: ${message.text()}`);
    });
  });

  // test("ants deposit pheromones after finding food", async ({ page }) => {
  //   const initialPheromoneGrid = await page.evaluate(() => {
  //     // @ts-expect-error window.game is not typed
  //     // eslint-disable-next-line no-undef
  //     const game: Game = window.game;
  //     return game.getPheromoneGridForTesting();
  //   });

  //   // Wait for ants to find food and start depositing pheromones
  //   await new Promise<void>((resolve) => {
  //     // eslint-disable-next-line no-undef
  //     setTimeout(() => resolve(), 5000);
  //   });

  //   const finalPheromoneGrid = await page.evaluate(() => {
  //     // @ts-expect-error window.game is not typed
  //     // eslint-disable-next-line no-undef
  //     const game: Game = window.game;
  //     return game.getPheromoneGridForTesting();
  //   });

  //   for (let x = 0; x < 100; x++) {
  //     for (let y = 0; y < 100; y++) {
  //       const initialPheromone = initialPheromoneGrid.sample(x, y);
  //       const finalPheromone = finalPheromoneGrid.sample(x, y);
  //       expect(finalPheromone).toBeGreaterThan(initialPheromone);
  //     }
  //   }
  // });
});
