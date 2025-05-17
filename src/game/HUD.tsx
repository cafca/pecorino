import React from "react";

interface HUDProps {
  foodCount: number;
  antCount: number;
  simulationSpeed: number;
  spawnRate: number;
  onSpeedToggle: () => void;
  onSpawnRateChange: (rate: number) => void;
}

export const HUD: React.FC<HUDProps> = ({
  foodCount,
  antCount,
  simulationSpeed,
  spawnRate,
  onSpeedToggle,
  onSpawnRateChange,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 20,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            color: "white",
            textShadow: "2px 2px 2px black",
            marginBottom: 10,
          }}
        >
          Food in Colony: {foodCount}
        </div>
        <div
          style={{
            color: "white",
            textShadow: "2px 2px 2px black",
            marginBottom: 10,
          }}
        >
          Ant Population: {antCount}
        </div>
        <div
          style={{
            color: "white",
            textShadow: "2px 2px 2px black",
            marginBottom: 10,
          }}
        >
          Food Spawn Rate: {spawnRate.toFixed(1)}s
          <input
            type="range"
            min="0.5"
            max="10"
            step="0.1"
            value={spawnRate}
            onChange={(e) => onSpawnRateChange(parseFloat(e.target.value))}
            style={{
              width: "200px",
              marginLeft: "10px",
            }}
          />
        </div>
        <button
          onClick={onSpeedToggle}
          style={{
            padding: "8px 16px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Speed: {simulationSpeed}x
        </button>
      </div>
    </div>
  );
};
