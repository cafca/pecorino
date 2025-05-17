/**
 * Manages a grid-based pheromone system for ant colony simulation.
 * The grid stores pheromone concentrations that can be deposited, sampled, and updated over time.
 *
 * Features:
 * - Grid-based storage with configurable resolution (default 1/4 tile)
 * - Pheromone deposition and sampling at world coordinates
 * - Evaporation and diffusion simulation
 * - Boundary checking for safe access
 */
export class PheromoneGrid {
  private grid: Float32Array;
  private width: number;
  private height: number;
  private resolution: number = 4; // 1/4 tile resolution

  constructor(width: number, height: number) {
    this.width = width * this.resolution;
    this.height = height * this.resolution;
    this.grid = new Float32Array(this.width * this.height);
  }

  // Add getter methods
  getGridWidth(): number {
    return this.width;
  }

  getGridHeight(): number {
    return this.height;
  }

  getResolution(): number {
    return this.resolution;
  }

  getGridData(): Float32Array {
    return this.grid;
  }

  deposit(x: number, y: number, strength: number): void {
    const gridX = Math.floor(x * this.resolution);
    const gridY = Math.floor(y * this.resolution);

    if (this.isValidPosition(gridX, gridY)) {
      const index = gridY * this.width + gridX;
      this.grid[index] += strength;
    }
  }

  sample(x: number, y: number): number {
    const gridX = Math.floor(x * this.resolution);
    const gridY = Math.floor(y * this.resolution);

    if (!this.isValidPosition(gridX, gridY)) {
      return 0;
    }

    const index = gridY * this.width + gridX;
    return this.grid[index];
  }

  update(deltaTime: number): void {
    const evaporationRate = 0.1 * deltaTime;
    const diffusionRate = 0.05 * deltaTime;

    // Create temporary array for diffusion
    const tempGrid = new Float32Array(this.width * this.height);

    // First pass: Apply evaporation and prepare diffusion
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const currentValue = this.grid[index];

        // Evaporation
        const newValue = currentValue * (1 - evaporationRate);
        tempGrid[index] = newValue;
      }
    }

    // Second pass: Apply diffusion
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const index = y * this.width + x;
        const currentValue = tempGrid[index];

        if (currentValue > 0) {
          const diffusionAmount = currentValue * diffusionRate;
          this.diffuseToNeighbors(x, y, diffusionAmount, tempGrid);
        }
      }
    }

    // Update main grid with new values
    this.grid = tempGrid;
  }

  private diffuseToNeighbors(
    x: number,
    y: number,
    amount: number,
    targetGrid: Float32Array
  ): void {
    const directions = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (const dir of directions) {
      const newX = x + dir.dx;
      const newY = y + dir.dy;

      if (this.isValidPosition(newX, newY)) {
        const index = newY * this.width + newX;
        targetGrid[index] += amount / 4;
      }
    }
  }

  private isValidPosition(x: number, y: number): boolean {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }
}
