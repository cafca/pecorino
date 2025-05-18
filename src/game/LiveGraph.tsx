import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { MAX_DATA_POINTS } from "./constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LiveGraphProps {
  foodInWorld: number;
  antCount: number;
}

export const LiveGraph: React.FC<LiveGraphProps> = ({
  foodInWorld,
  antCount,
}) => {
  const foodDataRef = useRef<number[]>([]);
  const antDataRef = useRef<number[]>([]);
  const labelsRef = useRef<string[]>([]);

  useEffect(() => {
    // Update data arrays
    foodDataRef.current.push(foodInWorld);
    antDataRef.current.push(antCount);
    labelsRef.current.push("");

    // Keep only the last MAX_DATA_POINTS
    if (foodDataRef.current.length > MAX_DATA_POINTS) {
      foodDataRef.current.shift();
      antDataRef.current.shift();
      labelsRef.current.shift();
    }
  }, [foodInWorld, antCount]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 0, // Disable animations for better performance
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.1)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
      x: {
        display: false,
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "rgba(255, 255, 255, 0.7)",
        },
      },
    },
  };

  const data = {
    labels: labelsRef.current,
    datasets: [
      {
        label: "Food in World",
        data: foodDataRef.current,
        borderColor: "rgb(75, 192, 75)",
        backgroundColor: "rgba(75, 192, 75, 0.5)",
        tension: 0.3,
      },
      {
        label: "Ant Count",
        data: antDataRef.current,
        borderColor: "rgb(75, 192, 192)",
        backgroundColor: "rgba(75, 192, 192, 0.5)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 20,
        right: 20,
        width: "300px",
        height: "200px",
        background: "rgba(0, 0, 0, 0.7)",
        borderRadius: "8px",
        padding: "10px",
      }}
    >
      <Line options={options} data={data} />
    </div>
  );
};
