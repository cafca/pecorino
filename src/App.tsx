import React, { useEffect, useState } from "react";
import { Game } from "./game/game";
import { HUD } from "./game/HUD";
import { LiveGraph } from "./game/LiveGraph";
import {
  INITIAL_SPAWN_RATE,
  DEFAULT_SHOW_TARGETS,
  DEFAULT_SHOW_PHEROMONES,
} from "./game/constants";

declare global {
  interface Window {
    game?: Game;
  }
}

export const App: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);
  const [hudState, setHudState] = useState({
    foodCount: 0,
    foodInWorld: 0,
    antCount: 0,
    simulationSpeed: 1,
    spawnRate: INITIAL_SPAWN_RATE,
    showTargets: DEFAULT_SHOW_TARGETS,
  });
  const [showPheromones, setShowPheromones] = useState(DEFAULT_SHOW_PHEROMONES);

  useEffect(() => {
    const initGame = async () => {
      const gameInstance = await Game.create();
      setGame(gameInstance);
      setShowPheromones(
        gameInstance["showPheromones"] ?? DEFAULT_SHOW_PHEROMONES
      );

      // Make game instance available globally for testing
      window.game = gameInstance;

      // Set up HUD update interval
      const hudInterval = setInterval(() => {
        if (gameInstance) {
          setHudState(gameInstance.getHUDState());
        }
      }, 100);

      return () => {
        clearInterval(hudInterval);
        // Clean up global game instance
        delete window.game;
      };
    };

    initGame();
  }, []);

  const handleSpeedToggle = () => {
    if (game) {
      game.toggleSimulationSpeed();
      setHudState(game.getHUDState());
    }
  };

  const handleSpawnRateChange = (rate: number) => {
    if (game) {
      game.setSpawnRate(rate);
      setHudState(game.getHUDState());
    }
  };

  const handleAntCountChange = (count: number) => {
    if (game) {
      game.setAntCount(count);
      setHudState(game.getHUDState());
    }
  };

  const handleToggleTargets = () => {
    if (game) {
      game.toggleTargetVisualization();
      setHudState(game.getHUDState());
    }
  };

  const handleTogglePheromones = () => {
    if (game) {
      game.togglePheromoneOverlay();
      setShowPheromones((prev) => !prev);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        id="game-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
          cursor: "pointer",
        }}
        onClick={(e) => {
          if (game) {
            const rect = e.currentTarget.getBoundingClientRect();
            const camera = game.getCamera();
            const x = (e.clientX - rect.left - camera.x) / camera.zoom;
            const y = (e.clientY - rect.top - camera.y) / camera.zoom;
            game.createFood(x, y);
          }
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        <HUD
          foodCount={hudState.foodCount}
          foodInWorld={hudState.foodInWorld}
          antCount={hudState.antCount}
          simulationSpeed={hudState.simulationSpeed}
          spawnRate={hudState.spawnRate}
          showTargets={hudState.showTargets}
          showPheromones={showPheromones}
          onSpeedToggle={handleSpeedToggle}
          onSpawnRateChange={handleSpawnRateChange}
          onAntCountChange={handleAntCountChange}
          onToggleTargets={handleToggleTargets}
          onTogglePheromones={handleTogglePheromones}
        />
        <LiveGraph
          foodInWorld={hudState.foodInWorld}
          antCount={hudState.antCount}
        />
      </div>
    </div>
  );
};
