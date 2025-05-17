# Pecorino - Ant Colony Simulation

A real-time ant colony simulation game where you control an ant and interact with AI-controlled ants in a dynamic environment.

## Features

### Ant Movement

- **Player Control**: Control your ant using either:
  - Arrow keys (↑, ↓, ←, →)
  - WASD keys
- **Movement Mechanics**:
  - Smooth movement in all directions
  - Diagonal movement when pressing multiple keys
  - Momentum-based movement system
  - Automatic stopping when no keys are pressed

### Ant Colony

- **Player Ant**: A special ant that you can control directly
- **AI Ants**: Multiple AI-controlled ants that:
  - Follow pheromone trails
  - Search for food
  - Return to the nest
  - Interact with the environment

### Pheromone System

- **Trail Creation**: Ants leave pheromone trails as they move
- **Trail Following**: AI ants can detect and follow pheromone trails
- **Trail Decay**: Pheromones gradually fade over time
- **Grid-based System**: Efficient pheromone tracking using a tile-based grid

### Food System

- **Food Collection**: Ants can pick up and carry food
- **Food Spawning**: New food items spawn periodically
- **Food Tracking**: Visual indication when ants are carrying food (red tint)

### Game Controls

- **Speed Control**: Toggle between normal and fast simulation speed
- **Spawn Rate**: Adjust the rate at which new food items appear
- **HUD Display**: Shows current:
  - Food count in colony
  - Number of ants
  - Simulation speed
  - Food spawn rate

### Technical Features

- Built with React and TypeScript
- Uses PixiJS for rendering
- ECS (Entity Component System) architecture
- Real-time physics simulation
- Responsive design that adapts to window size

## Development

### Prerequisites

- Node.js (latest LTS version recommended)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### Testing

Run the test suite:

```bash
npm test
```

Run end-to-end tests:

```bash
npm run test:e2e
```

## License

MIT
