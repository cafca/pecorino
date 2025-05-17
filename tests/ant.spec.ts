import { test, expect } from "@playwright/test";
import { Game } from "../src/game/game";

interface Window {
  game: Game;
}

test.describe("Ant Movement", () => {
  let window: Window;

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("canvas");

    window = await page.evaluate(() => window);

    page.on("console", (message) => {
      // eslint-disable-next-line no-undef
      console.log(`PAGE LOG: ${message.text()}`);
    });
  });

  test.only("ant moves with arrow keys", async ({ page }) => {
    // Initiale Position der Ameise
    const initialPosition = await page.evaluate(() => {
      const game = window.game;
      if (!game) return { x: 0, y: 0 };
      return game.getPlayerPosition();
    });

    // Pfeiltaste nach rechts drücken und halten
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(100); // Kurze Pause für die Bewegung

    // Neue Position überprüfen
    const newPosition = await page.evaluate(() => {
      const game = window.game;
      if (!game) return { x: 0, y: 0 };
      return game.getPlayerPosition();
    });

    // Taste loslassen
    await page.keyboard.up("ArrowRight");

    // Überprüfen, ob sich die Ameise nach rechts bewegt hat
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y); // Y-Position sollte sich nicht ändern
  });

  test("ant moves with WASD keys", async ({ page }) => {
    // Initiale Position
    const initialPosition = await page.evaluate(() => {
      const game = window.game;
      if (!game) return { x: 0, y: 0 };
      return game.getPlayerPosition();
    });

    // D-Taste drücken und halten (rechts)
    await page.keyboard.down("d");
    await page.waitForTimeout(100); // Kurze Pause für die Bewegung

    // Neue Position überprüfen
    const newPosition = await page.evaluate(() => {
      const game = window.game;
      if (!game) return { x: 0, y: 0 };
      return game.getPlayerPosition();
    });

    // Taste loslassen
    await page.keyboard.up("d");

    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y);
  });
});
