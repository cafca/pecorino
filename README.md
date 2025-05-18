# Pecorino - Ant Colony Simulation

A real-time ant colony simulation game where you control an ant and interact with AI-controlled ants in a dynamic environment.

## Features

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
