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
    positions: { [key: string]: [number, number] };
    timestamp: string;
  }[];
  grid_dimensions: {
    width: number;
    height: number;
  };
}

interface AnimationProps {
  animationData: AnimationData | null;
  error: string | null;
}

const generateRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
};

const getAllRobots = (timeLog: AnimationData["time_log"]) => {
  const robotSet = new Set<string>();
  timeLog.forEach(({ positions }) => {
    Object.keys(positions).forEach((robotId) => {
      robotSet.add(robotId);
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
    return robotColors[value] || "bg-gray-500";
  };

  return (
    <div
      className={`aspect-square border border-gray-300 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 ${getBackgroundColor()}`}
    >
      {value === "X" ? (
        <span className="text-white font-bold">X</span>
      ) : value !== "." ? (
        <span className="text-white font-bold">{value}</span>
      ) : null}
    </div>
  );
};

const Animation: React.FC<AnimationProps> = ({ animationData, error }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1000);
  const [robotColors, setRobotColors] = useState<{ [key: string]: string }>({});

  const gridWidth = animationData?.grid_dimensions.width || 0;
  const gridHeight = animationData?.grid_dimensions.height || 0;
  const timeLogLength = animationData?.time_log.length || 0;

  useEffect(() => {
    if (animationData) {
      try {
        const robots = getAllRobots(animationData.time_log);
        const colors: { [key: string]: string } = {};
        robots.forEach((robot) => {
          colors[robot] = generateRandomColor();
        });
        setRobotColors(colors);
      } catch (err) {
        console.error("Error initializing robot colors", err);
      }
    }
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
    setPlaybackSpeed(2000 - newSpeed[0]);
  };

  const currentGrid = useMemo(() => {
    if (!animationData) return [];
    const grid = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill("."));
    const positions = animationData.time_log[currentStep]?.positions;

    if (positions) {
      Object.entries(positions).forEach(([robotId, [x, y]]) => {
        if (x >= 0 && x < gridHeight && y >= 0 && y < gridWidth) {
          grid[x][y] = robotId;
        }
      });
    }

    return grid;
  }, [animationData, currentStep, gridWidth, gridHeight]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error ===
          "Deadlock detected: Some bots cannot reach their goals due to the configuration"
            ? "Deadlock detected: Some bots cannot reach their goals due to the configuration"
            : "No valid paths found for all bots"}
        </AlertDescription>
      </Alert>
    );
  }

  if (!animationData) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>No animation data available</AlertDescription>
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
        <Button
          onClick={togglePlayPause}
          className="bg-orange-500 text-white hover:bg-orange-600 transition duration-200"
        >
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
