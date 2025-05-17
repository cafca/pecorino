import { test, expect } from "@playwright/test";
import { Game } from "../src/game/game";
import { isGameReady } from "./utils";

test.describe("Ant Movement", () => {
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

  test("player ant moves with arrow keys", async ({ page }) => {
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Press right arrow key
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(100);
    await page.keyboard.up("ArrowRight");

    // Get new position
    const newPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Verify player ant moved right
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y); // Y position should not change
  });

  test("player ant moves with WASD keys", async ({ page }) => {
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Press D key
    await page.keyboard.down("d");
    await page.waitForTimeout(100);
    await page.keyboard.up("d");

    // Get new position
    const newPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Verify player ant moved right
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y);
  });

  test("player ant moves diagonally with multiple keys", async ({ page }) => {
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Press D and S keys simultaneously
    await page.keyboard.down("d");
    await page.keyboard.down("s");
    await page.waitForTimeout(100);
    await page.keyboard.up("d");
    await page.keyboard.up("s");

    // Get new position
    const newPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Verify player ant moved diagonally
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBeGreaterThan(initialPosition.y);
  });

  test("player ant stops when no keys are pressed", async ({ page }) => {
    // Get initial position
    const initialPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Press D key
    await page.keyboard.down("d");
    await page.waitForTimeout(100);
    // Release D key
    await page.keyboard.up("d");

    // Wait for ant to stop
    await page.waitForTimeout(100);

    // Get final position
    const finalPosition = await page.evaluate(() => {
      // @ts-expect-error window.game is not typed
      // eslint-disable-next-line no-undef
      const game: Game = window.game;
      return game.getPlayerPosition();
    });

    // Verify ant has stopped
    expect(finalPosition.x).toBeGreaterThan(initialPosition.x);
    expect(finalPosition.y).toBe(initialPosition.y);
  });
});
