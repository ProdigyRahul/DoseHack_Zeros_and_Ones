"use client";
import React, { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Animation from "@/components/animation";

const GridSquare = ({ value, type, onDrop, onDragStart }) => (
  <div
    className={`aspect-square border border-gray-300 flex items-center justify-center rounded-lg shadow-md transition-all duration-200 ${
      type === "obstacle"
        ? "bg-orange-500"
        : type === "start"
        ? "bg-green-500"
        : type === "end"
        ? "bg-red-500"
        : "bg-gray-100"
    }`}
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => onDrop(e, value)}
    draggable={type !== null}
    onDragStart={(e) => onDragStart(e, value, type)}
  >
    {value}
  </div>
);

const DraggableItem = ({ type }) => (
  <div
    draggable
    className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold cursor-pointer hover:scale-105 transition-transform duration-200 ${
      type === "obstacle"
        ? "bg-orange-500"
        : type === "start"
        ? "bg-green-500"
        : "bg-red-500"
    }`}
    onDragStart={(e) => e.dataTransfer.setData("text/plain", type)}
  >
    {type === "obstacle" ? "O" : type === "start" ? "S" : "E"}
  </div>
);

export default function AdvancedRobotGridSetup() {
  const [gridWidth, setGridWidth] = useState(3);
  const [gridHeight, setGridHeight] = useState(3);
  const [robotCount, setRobotCount] = useState(1);
  const [grid, setGrid] = useState([]);
  const remainingStartPositions = useRef(robotCount);
  const remainingEndPositions = useRef(robotCount);
  const [currentStep, setCurrentStep] = useState(null);
  const [animationData, setAnimationData] = useState(null);

  const startCounter = useRef(1);
  const endCounter = useRef(1);

  const createGrid = () => {
    if (gridWidth < 3 || gridHeight < 3) {
      alert("Please enter valid grid dimensions (minimum 3x3)");
      return;
    }
    const newGrid = Array.from({ length: gridHeight }, (_, row) =>
      Array.from({ length: gridWidth }, (_, col) => ({
        value: `${String.fromCharCode(65 + row)}${col + 1}`,
        type: null,
        label: null,
      }))
    );
    setGrid(newGrid);
    remainingStartPositions.current = robotCount;
    remainingEndPositions.current = robotCount;
    startCounter.current = 1;
    endCounter.current = 1;
    setCurrentStep(null);
    console.log("Grid created:", newGrid);
  };

  const handleDrop = (e, cellValue) => {
    e.preventDefault();
    const type = e.dataTransfer.getData("text/plain");
    console.log("Dropped type:", type);

    if (type === "start") {
      if (remainingStartPositions.current > 0) {
        const updatedGrid = grid.map((row) =>
          row.map((cell) =>
            cell.value === cellValue
              ? { ...cell, type, label: `A${startCounter.current}` }
              : cell
          )
        );
        setGrid(updatedGrid);
        remainingStartPositions.current--;
        startCounter.current++;
        setCurrentStep("start");
        console.log("Updated grid:", updatedGrid);
        console.log(
          "Start positions remaining:",
          remainingStartPositions.current
        );
      } else {
        alert("You can't place more Start points.");
      }
    } else if (type === "end") {
      if (remainingEndPositions.current > 0) {
        const updatedGrid = grid.map((row) =>
          row.map((cell) =>
            cell.value === cellValue
              ? { ...cell, type, label: `B${endCounter.current}` }
              : cell
          )
        );
        setGrid(updatedGrid);
        remainingEndPositions.current--;
        endCounter.current++;
        setCurrentStep(null);
        console.log("Updated grid:", updatedGrid);
        console.log("End positions remaining:", remainingEndPositions.current);
      } else {
        alert("You can't place more End points.");
      }
    } else if (type === "obstacle") {
      const updatedGrid = grid.map((row) =>
        row.map((cell) => (cell.value === cellValue ? { ...cell, type } : cell))
      );
      setGrid(updatedGrid);
      console.log("Updated grid:", updatedGrid);
    }
  };

  const handleDragStart = (e, cellValue, cellType) => {
    if (cellType === "start") {
      remainingStartPositions.current++;
      startCounter.current--;
      console.log(
        "Drag start - Start position incremented:",
        remainingStartPositions.current
      );
    }
    if (cellType === "end") {
      remainingEndPositions.current++;
      endCounter.current--;
      console.log(
        "Drag start - End position incremented:",
        remainingEndPositions.current
      );
    }
    const updatedGrid = grid.map((row) =>
      row.map((cell) =>
        cell.value === cellValue ? { ...cell, type: null, label: null } : cell
      )
    );
    setGrid(updatedGrid);
  };

  const handleSubmit = async () => {
    const jsonGrid = grid.map((row) =>
      row.map((cell) => {
        if (cell.type === "obstacle") return "X";
        if (cell.type === "start") return cell.label;
        if (cell.type === "end") return cell.label;
        return ".";
      })
    );

    const startPositions = grid
      .flat()
      .filter((cell) => cell.type === "start")
      .map((cell) => cell.value);
    const endPositions = grid
      .flat()
      .filter((cell) => cell.type === "end")
      .map((cell) => cell.value);

    console.log("Start positions:", startPositions);
    console.log("End positions:", endPositions);

    if (
      startPositions.length !== robotCount ||
      endPositions.length !== robotCount
    ) {
      alert("Please place all start and end positions for each robot.");
      return;
    }

    const gridJSON = {
      grid: jsonGrid,
    };
    console.log("Grid JSON for submission:", gridJSON);

    try {
      const response = await fetch("http://127.0.0.1:5000/move_bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(gridJSON),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Response from server:", data);
      setAnimationData(data);
    } catch (error) {
      console.error("Error submitting the grid:", error);
      alert("Impossible Scenarios - Please try again later.");
    }
  };

  if (animationData) {
    return <Animation animationData={animationData} />;
  }

  return (
    <div className="flex flex-col md:flex-row items-center p-8 space-y-8 md:space-y-0 md:space-x-8 bg-gray-950 text-white">
      <div className="flex flex-col w-full items-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-500 via-orange-400 to-orange-300 inline-block text-transparent bg-clip-text mb-6 text-center">
          Grid Setup
        </h1>

        <div className="flex space-x-4 items-center mb-6">
          <div className="flex flex-col">
            <label className="block text-sm font-medium text-orange-300">
              Grid Width
            </label>
            <Input
              type="number"
              min={3}
              value={gridWidth}
              onChange={(e) =>
                setGridWidth(Math.max(3, parseInt(e.target.value)))
              }
              className="mt-1 bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-orange-300">
              Grid Height
            </label>
            <Input
              type="number"
              min={3}
              value={gridHeight}
              onChange={(e) =>
                setGridHeight(Math.max(3, parseInt(e.target.value)))
              }
              className="mt-1 bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-orange-300">
              Number of Robots
            </label>
            <Input
              type="number"
              min={1}
              value={robotCount}
              onChange={(e) => {
                const count = Math.max(1, parseInt(e.target.value));
                setRobotCount(count);
                remainingStartPositions.current = count;
                remainingEndPositions.current = count;
              }}
              className="mt-1 bg-gray-700 text-white border-gray-600"
            />
          </div>

          <Button
            onClick={createGrid}
            className="bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-lg shadow-lg mt-6"
          >
            Create Grid
          </Button>
        </div>

        {grid.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-orange-500 text-center">
              Design Grid
            </h2>
            <div className="flex space-x-4 mb-4">
              <DraggableItem type="obstacle" />
              <DraggableItem type="start" />
              <DraggableItem type="end" />
            </div>
            <div
              className="grid gap-1 mb-6"
              style={{
                gridTemplateColumns: `repeat(${gridWidth}, minmax(0, 1fr))`,
                width: `${gridWidth * 60}px`,
                height: `${gridHeight * 60}px`,
              }}
            >
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <GridSquare
                    key={`${rowIndex}-${colIndex}`}
                    value={cell.label || cell.value}
                    type={cell.type}
                    onDrop={handleDrop}
                    onDragStart={handleDragStart}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {grid.length > 0 && (
          <Button
            onClick={handleSubmit}
            className="mt-4 bg-orange-500 hover:bg-orange-400 text-white py-2 px-4 rounded-lg shadow-lg"
          >
            Submit
          </Button>
        )}
      </div>

      <div className="flex flex-col bg-gray-800 p-4 rounded-lg shadow-lg w-full md:w-1/4">
        <h2 className="text-xl font-semibold text-orange-500 mb-4">
          Grid Info
        </h2>
        <div className="flex items-center space-x-2">
          <DraggableItem type="obstacle" />
          <span className="text-white">Obstacle (O)</span>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <DraggableItem type="start" />
          <span className="text-white">Start (S)</span>
        </div>
        <div className="flex items-center space-x-2 mt-4">
          <DraggableItem type="end" />
          <span className="text-white">End (E)</span>
        </div>
      </div>
    </div>
  );
}
