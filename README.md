# Insect Simulation Game

Ein ECS-basiertes Insektensimulationsspiel mit PixiJS-Rendering.

## Voraussetzungen

- Node.js 18 oder höher
- npm 9 oder höher

## Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

## Tests ausführen

```bash
# Unit Tests
npm test

# Unit Tests im Watch-Modus
npm run test:watch

# End-to-End Tests
npm run test:e2e
```

## Build

```bash
npm run build
```

## Features

- ECS-basierte Architektur mit bitecs
- PixiJS-Rendering mit 1:1 Pixel-Art-Skalierung
- Steuerung mit WASD/Pfeiltasten
- Kamera folgt dem Spieler
- Unendlich scrollende Karte

## Projektstruktur

- `src/game/components.ts` - ECS-Komponenten
- `src/game/systems.ts` - ECS-Systeme
- `src/game/game.ts` - Hauptspiellogik
- `src/__tests__/` - Unit Tests
- `assets/` - Spiele-Assets (Sprites, Karten, etc.)
