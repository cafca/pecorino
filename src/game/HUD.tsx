import React from "react";

interface HUDProps {
  foodCount: number;
  antCount: number;
  simulationSpeed: number;
  onSpeedToggle: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  foodCount,
  antCount,
  simulationSpeed,
  onSpeedToggle,
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
