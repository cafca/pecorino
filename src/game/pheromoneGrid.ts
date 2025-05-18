export class PheromoneGrid {
  private grid: Float32Array = new Float32Array(0);
  private width: number = 0;
  private height: number = 0;
  private resolution: number = 4; // 1/4 tile resolution
  private worldWidth: number;
  private worldHeight: number;

  constructor(width: number, height: number) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this.worldWidth = width;
    this.worldHeight = height;
    this.width = Math.ceil(width * this.resolution);
    this.height = Math.ceil(height * this.resolution);
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

  private worldToGrid(x: number, y: number): { x: number; y: number } {
    // Convert world coordinates (centered at 0,0) to grid coordinates
    // World coordinates range from -width/2 to width/2 and -height/2 to height/2
    const gridX = Math.floor((x + this.worldWidth / 2) * this.resolution);
    const gridY = Math.floor((y + this.worldHeight / 2) * this.resolution);
    return { x: gridX, y: gridY };
  }

  deposit(x: number, y: number, strength: number): void {
    const { x: gridX, y: gridY } = this.worldToGrid(x, y);
    if (this.isValidPosition(gridX, gridY)) {
      const index = gridY * this.width + gridX;
      this.grid[index] += strength;
    }
  }

  sample(x: number, y: number): number {
    const { x: gridX, y: gridY } = this.worldToGrid(x, y);
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
