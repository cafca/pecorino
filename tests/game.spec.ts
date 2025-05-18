import { test, expect } from "@playwright/test";
import { Game } from "../src/game/game";
import { isGameReady } from "./utils";

test.describe("game", () => {
  test.beforeEach(async ({ page }) => {
    page.on("console", (message) => {
      // eslint-disable-next-line no-undef
      console.log(`PAGE LOG: ${message.text()}`);
    });

    await page.goto("/");

    // Wait for React app to initialize and game to be ready
    await page.waitForFunction(isGameReady, { timeout: 5000 });

    // Additional wait to ensure game loop is running
    await page.waitForTimeout(100);
  });

  test.describe("game controls", () => {
    test("arrow keys move the player", async ({ page }) => {
      const initialPosition = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowRight");
      const endPosition = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      expect(endPosition.x).toBeGreaterThan(initialPosition.x);
      expect(endPosition.y).toBe(initialPosition.y);
    });

    test("WASD keys move the player", async ({ page }) => {
      const initialPosition = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      await page.keyboard.down("d");
      await page.waitForTimeout(100);
      await page.keyboard.up("d");
      const endPosition = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      expect(endPosition.x).toBeGreaterThan(initialPosition.x);
      expect(endPosition.y).toBe(initialPosition.y);
    });

    test("clicking the speed button toggles simulation speed", async ({
      page,
    }) => {
      // Get initial speed
      const initialSpeed = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getHUDState().simulationSpeed;
      });

      // Click speed toggle button
      await page.click('button:has-text("Speed")');

      // Get new speed
      const newSpeed = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getHUDState().simulationSpeed;
      });

      // Speed should have changed
      expect(newSpeed).not.toBe(initialSpeed);

      // Click again to toggle back
      await page.click('button:has-text("Speed")');

      // Speed should be back to initial value
      const finalSpeed = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getHUDState().simulationSpeed;
      });
      expect(finalSpeed).toBe(initialSpeed);
    });

    test("clicking the game container creates food", async ({ page }) => {
      // Remove all ants so ants don't deposit food
      await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        game.setAntCount(0);
      });

      // Get initial food in world and set spawn rate to 0
      const initialFoodInWorld = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        game.setSpawnRate(Infinity);
        return game.getHUDState().foodInWorld;
      });

      // Click in the center of the game container
      const container = page.locator("#game-container").first();
      const box = await container.boundingBox();
      if (!box) throw new Error("Could not get container bounds");

      const posX = box.x + box.width / 2;
      const posY = box.y + box.height / 2;

      await page.mouse.click(posX, posY);

      // Wait for food count to increase
      await page.waitForFunction(
        (initialCount) => {
          // @ts-expect-error window.game is not typed
          // eslint-disable-next-line no-undef
          const game = window.game;
          return game.getHUDState().foodInWorld > initialCount;
        },
        initialFoodInWorld,
        { timeout: 5000 }
      );

      // Get new food in world
      const newFoodInWorld = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game = window.game;
        return game.getHUDState().foodInWorld;
      });

      // Food in world should have increased
      expect(newFoodInWorld).toBe(initialFoodInWorld + 1);

      // Click multiple times in different locations
      const clicks = [
        { x: box.width - 100, y: 100 }, // top-right
        { x: 100, y: box.height - 100 }, // bottom-left
      ];

      for (const click of clicks) {
        await page.mouse.click(click.x, click.y);
        await page.waitForFunction(
          (currentCount) => {
            // @ts-expect-error window.game is not typed
            // eslint-disable-next-line no-undef
            const game = window.game;
            return game.getHUDState().foodInWorld > currentCount;
          },
          newFoodInWorld,
          { timeout: 5000 }
        );
      }

      // Verify final food count
      const finalFoodInWorld = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game = window.game;
        return game.getHUDState().foodInWorld;
      });

      expect(finalFoodInWorld).toBe(initialFoodInWorld + 2); // 1 from center click + 2 from edge clicks
    });

    test("initial food in world is 5", async ({ page }) => {
      const foodInWorld = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game = window.game;
        return game.getHUDState().foodInWorld;
      });
      expect(foodInWorld).toBe(5);
    });
  });
});
