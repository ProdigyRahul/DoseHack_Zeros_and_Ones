import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AnimationData {
  movement_stats: {
    average_movements: number;
    max_movements: number;
    total_movements: { [key: string]: number };
  };
  time_log: {
    grid: string[][];
    timestamp: string;
  }[];
  grid_dimensions: {
    width: number;
    height: number;
  };
}

interface AnimationProps {
  animationData: AnimationData;
}

// Utility to generate random color for each robot
const generateRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// Utility to track robots across the entire animation, not just the first frame
const getAllRobots = (timeLog: { grid: string[][] }[]) => {
  const robotSet = new Set<string>();
  timeLog.forEach(({ grid }) => {
    grid.forEach((row) => {
      row.forEach((cell) => {
        if (cell !== "X" && cell !== ".") {
          robotSet.add(cell);
        }
      });
    });
  });
  return Array.from(robotSet);
};

const GridSquare: React.FC<{
  value: string;
  robotColors: { [key: string]: string };
}> = ({ value, robotColors }) => {
  const getBackgroundColor = () => {
    if (value === "X") return "bg-orange-500";
    if (value === ".") return "bg-gray-100";
    return robotColors[value] || "bg-gray-500"; // Use assigned robot color
  };

  return (
    <div
      className={`aspect-square border border-gray-300 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 ${getBackgroundColor()}`}
    >
      {value === "X" ? (
        <span className="text-white font-bold">X</span>
      ) : value !== "." ? (
        <span className="text-white font-bold">{value}</span> // Display robot ID
      ) : null}
    </div>
  );
};

const Animation: React.FC<AnimationProps> = ({ animationData }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [error, setError] = useState<string | null>(null);
  const [robotColors, setRobotColors] = useState<{ [key: string]: string }>({});

  const { width: gridWidth, height: gridHeight } =
    animationData.grid_dimensions;
  const timeLogLength = animationData.time_log.length;

  // Assign consistent colors to each robot based on their ID and ensure tracking of all robots
  useEffect(() => {
    const robots = getAllRobots(animationData.time_log);
    const colors: { [key: string]: string } = {};
    robots.forEach((robot) => {
      colors[robot] = generateRandomColor();
    });
    setRobotColors(colors);
  }, [animationData]);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prevStep) =>
      prevStep < timeLogLength - 1 ? prevStep + 1 : prevStep
    );
  }, [timeLogLength]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(goToNextStep, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, goToNextStep]);

  const togglePlayPause = () => setIsPlaying((prev) => !prev);

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setIsPlaying(false);
  };

  const handleSpeedChange = (newSpeed: number[]) => {
    setPlaybackSpeed(2000 - newSpeed[0]); // Invert the scale
  };

  const currentGrid = useMemo(() => {
    return animationData.time_log[currentStep]?.grid || [];
  }, [animationData.time_log, currentStep]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col items-center p-8 space-y-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 inline-block text-transparent bg-clip-text mb-6">
        Multi-Robot Animation
      </h1>

      <div
        className="grid gap-1 mb-6"
        style={{
          gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
          width: `${gridWidth * 60}px`,
          height: `${gridHeight * 60}px`,
        }}
      >
        {currentGrid.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <GridSquare
              key={`${rowIndex}-${colIndex}`}
              value={cell}
              robotColors={robotColors}
            />
          ))
        )}
      </div>

      <div className="flex items-center space-x-4">
        <Button onClick={() => goToStep(0)} disabled={currentStep === 0}>
          <SkipBack size={24} />
        </Button>
        <Button onClick={togglePlayPause}>
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </Button>
        <Button
          onClick={() => goToStep(timeLogLength - 1)}
          disabled={currentStep === timeLogLength - 1}
        >
          <SkipForward size={24} />
        </Button>
      </div>

      <div className="w-64">
        <Slider
          defaultValue={[1000]}
          max={1900}
          min={100}
          step={100}
          onValueChange={handleSpeedChange}
        />
        <div className="flex justify-between mt-2">
          <span>Slow</span>
          <span>Fast</span>
        </div>
      </div>

      <div className="text-center mt-4">
        <p className="text-xl font-semibold">
          {animationData.time_log[currentStep]?.timestamp || "No data"}
        </p>
        <p>
          Step: {currentStep + 1} / {timeLogLength}
        </p>
      </div>

      <div className="mt-4 text-left">
        <h2 className="text-2xl font-semibold mb-2">Movement Stats</h2>
        <p>
          Average Movements:{" "}
          {animationData.movement_stats.average_movements.toFixed(2)}
        </p>
        <p>Max Movements: {animationData.movement_stats.max_movements}</p>
        <h3 className="text-xl font-semibold mt-2 mb-1">
          Total Movements per Robot:
        </h3>
        <ul>
          {Object.entries(animationData.movement_stats.total_movements).map(
            ([robotId, movements]) => (
              <li key={robotId}>
                Robot {robotId}: {movements} movements
              </li>
            )
          )}
        </ul>
      </div>
    </div>
  );
};

export default Animation;
