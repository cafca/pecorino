import { test, expect } from "@playwright/test";

test.describe("Ant Movement", () => {
  test("ant moves with arrow keys", async ({ page }) => {
    // Startseite laden
    await page.goto("/");

    // Warten bis das Spiel geladen ist
    await page.waitForSelector("canvas");

    // Initiale Position der Ameise
    const initialPosition = await page.evaluate(([x, y]: [number, number]) => {
      // @ts-expect-error - Zugriff auf das Spiel-Objekt
      const game = window.game;
      if (!game) return { x: 0, y: 0 };

      return {
        x: x,
        y: y,
      };
    });

    console.log("Initial position:", initialPosition);

    // Pfeiltaste nach rechts drücken
    await page.keyboard.press("ArrowRight");
    await page.waitForTimeout(1000); // 1 Sekunde warten

    // Neue Position überprüfen
    const newPosition = await page.evaluate(([x, y]: [number, number]) => {
      // @ts-expect-error - Zugriff auf das Spiel-Objekt
      const game = window.game;
      if (!game) return { x: 0, y: 0 };

      return {
        x: x,
        y: y,
      };
    });

    console.log("New position:", newPosition);

    // Überprüfen, ob sich die Ameise nach rechts bewegt hat
    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y); // Y-Position sollte sich nicht ändern
  });

  test("ant moves with WASD keys", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("canvas");

    // Initiale Position
    const initialPosition = await page.evaluate(([x, y]: [number, number]) => {
      // @ts-expect-error - Zugriff auf das Spiel-Objekt
      const game = window.game;
      if (!game) return { x: 0, y: 0 };

      return {
        x: x,
        y: y,
      };
    });

    console.log("Initial position (WASD test):", initialPosition);

    // D-Taste drücken (rechts)
    await page.keyboard.press("d");
    await page.waitForTimeout(1000);

    // Neue Position überprüfen
    const newPosition = await page.evaluate(([x, y]: [number, number]) => {
      // @ts-expect-error - Zugriff auf das Spiel-Objekt
      const game = window.game;
      if (!game) return { x: 0, y: 0 };

      return {
        x: x,
        y: y,
      };
    });

    console.log("New position (WASD test):", newPosition);

    expect(newPosition.x).toBeGreaterThan(initialPosition.x);
    expect(newPosition.y).toBe(initialPosition.y);
  });
});
