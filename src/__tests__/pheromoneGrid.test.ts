import { describe, expect, test, beforeEach } from "vitest";
import { PheromoneGrid } from "../game/pheromoneGrid";

describe("PheromoneGrid", () => {
  let grid: PheromoneGrid;
  const windowWidth = 800;
  const windowHeight = 600;
  const halfWidth = windowWidth / 2;
  const halfHeight = windowHeight / 2;
  const res = 4;

  beforeEach(() => {
    grid = new PheromoneGrid(windowWidth, windowHeight);
  });

  test("initializes with correct dimensions", () => {
    expect(grid.getGridWidth()).toBe(windowWidth * res); // 4x resolution
    expect(grid.getGridHeight()).toBe(windowHeight * res);
  });

  test("handles window resizing", () => {
    const newWidth = 1024;
    const newHeight = 768;
    grid.resize(newWidth, newHeight);
    expect(grid.getGridWidth()).toBe(newWidth * res);
    expect(grid.getGridHeight()).toBe(newHeight * res);
  });

  test("deposits pheromones at window center (0,0)", () => {
    grid.deposit(0, 0, 1.0);
    expect(grid.sample(0, 0)).toBeCloseTo(1.0);
  });

  test("deposits pheromones at window edges (centered)", () => {
    // Corners in centered coordinates
    const corners = [
      { x: -halfWidth, y: -halfHeight }, // top-left
      { x: halfWidth - 1 / res, y: -halfHeight }, // top-right
      { x: -halfWidth, y: halfHeight - 1 / res }, // bottom-left
      { x: halfWidth - 1 / res, y: halfHeight - 1 / res }, // bottom-right
    ];
    corners.forEach(({ x, y }) => {
      grid.deposit(x, y, 1.0);
      expect(grid.sample(x, y)).toBeCloseTo(1.0);
    });
  });

  test("handles coordinates outside window bounds (centered)", () => {
    // Test coordinates beyond window edges
    const outsidePoints = [
      { x: -halfWidth - 1, y: 0 },
      { x: halfWidth + 1, y: 0 },
      { x: 0, y: -halfHeight - 1 },
      { x: 0, y: halfHeight + 1 },
    ];
    outsidePoints.forEach(({ x, y }) => {
      grid.deposit(x, y, 1.0);
      expect(grid.sample(x, y)).toBe(0); // Should not deposit outside bounds
    });
  });

  test("handles sub-grid precision (centered)", () => {
    // Test depositing at sub-grid positions
    const subGridPoints = [
      { x: 0.25, y: 0.25 },
      { x: -0.25, y: 0.25 },
      { x: 0.25, y: -0.25 },
      { x: -0.25, y: -0.25 },
    ];
    subGridPoints.forEach(({ x, y }) => {
      grid.deposit(x, y, 1.0);
      expect(grid.sample(x, y)).toBeCloseTo(1.0);
    });
  });

  test("accumulates pheromones at same location (centered)", () => {
    // Deposit multiple times at the same location
    const x = 100;
    const y = 100;
    grid.deposit(x, y, 1.0);
    grid.deposit(x, y, 1.0);
    grid.deposit(x, y, 1.0);
    expect(grid.sample(x, y)).toBeCloseTo(3.0);
  });

  test("handles rapid resizing (centered)", () => {
    // Test multiple rapid resizes
    const sizes = [
      { width: 400, height: 300 },
      { width: 800, height: 600 },
      { width: 1600, height: 1200 },
      { width: 800, height: 600 },
    ];
    sizes.forEach(({ width, height }) => {
      grid.resize(width, height);
      expect(grid.getGridWidth()).toBe(width * res);
      expect(grid.getGridHeight()).toBe(height * res);
    });
  });
});
