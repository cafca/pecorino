import React, { useEffect, useState } from "react";
import { Game } from "./game/game";
import { HUD } from "./game/HUD";

export const App: React.FC = () => {
  const [game, setGame] = useState<Game | null>(null);
  const [hudState, setHudState] = useState({
    foodCount: 0,
    antCount: 0,
    simulationSpeed: 1,
  });

  useEffect(() => {
    const initGame = async () => {
      const gameInstance = await Game.create();
      setGame(gameInstance);

      // Set up HUD update interval
      const hudInterval = setInterval(() => {
        if (gameInstance) {
          setHudState(gameInstance.getHUDState());
        }
      }, 100);

      return () => {
        clearInterval(hudInterval);
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
          antCount={hudState.antCount}
          simulationSpeed={hudState.simulationSpeed}
          onSpeedToggle={handleSpeedToggle}
        />
      </div>
    </div>
  );
};
