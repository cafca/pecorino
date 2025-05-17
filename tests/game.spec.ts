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
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(100);
      await page.keyboard.up("ArrowRight");
      const position = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBe(32); // initial y position of the player
    });

    test("WASD keys move the player", async ({ page }) => {
      await page.keyboard.down("d");
      await page.waitForTimeout(100);
      await page.keyboard.up("d");
      const position = await page.evaluate(() => {
        // @ts-expect-error window.game is not typed
        // eslint-disable-next-line no-undef
        const game: Game = window.game;
        return game.getPlayerPosition();
      });
      expect(position.x).toBeGreaterThan(0);
      expect(position.y).toBe(32);
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
  });
});
