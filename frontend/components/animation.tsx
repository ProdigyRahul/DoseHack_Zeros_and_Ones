import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, SkipBack, SkipForward } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { motion } from "framer-motion";

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
  obstacles: [number, number][]; // Array of obstacle coordinates
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
    if (value === "X") return "bg-orange-500"; // Obstacles marked as orange
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
  const obstacles = animationData?.obstacles || [];

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

    // Initialize the grid
    const grid = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill("."));

    // Place obstacles in the grid
    obstacles.forEach(([x, y]) => {
      if (x >= 0 && x < gridHeight && y >= 0 && y < gridWidth) {
        grid[x][y] = "X"; // Marking obstacles with "X"
      }
    });

    // Mark robot positions in the grid
    const positions = animationData.time_log[currentStep]?.positions;
    if (positions) {
      Object.entries(positions).forEach(([robotId, [x, y]]) => {
        if (x >= 0 && x < gridHeight && y >= 0 && y < gridWidth) {
          grid[x][y] = robotId; // Mark robots by their ID
        }
      });
    }

    return grid;
  }, [animationData, currentStep, gridWidth, gridHeight, obstacles]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
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

  // Movement statistics from animation data
  const { average_movements, max_movements, total_movements } =
    animationData.movement_stats;

  return (
    <div className="flex flex-col items-center p-8 space-y-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 inline-block text-transparent bg-clip-text mb-6">
        Multi-Robot Animation with Obstacles
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

      <div className="flex space-x-4 items-center">
        <Button onClick={togglePlayPause}>
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Slider
          defaultValue={[2000 - playbackSpeed]}
          max={2000}
          step={100}
          onValueChange={handleSpeedChange}
        />
      </div>

      <div className="flex space-x-4">
        <Button onClick={() => goToStep(0)}>
          <SkipBack />
        </Button>
        <Button onClick={() => goToStep(timeLogLength - 1)}>
          <SkipForward />
        </Button>
      </div>

      {/* Animated Movement Stats Display */}
      <motion.div
        className="mt-8 p-4 rounded-lg bg-gray-800"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-semibold mb-2">Movement Statistics</h2>
        <p>Average Movements: {average_movements}</p>
        <p>Max Movements: {max_movements}</p>
        <h3 className="font-semibold mt-4">Total Movements:</h3>
        <ul>
          {Object.entries(total_movements).map(([key, value]) => (
            <li key={key}>
              {key}: {value}
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
};

export default Animation;
