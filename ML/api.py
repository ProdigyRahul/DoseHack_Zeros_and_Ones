from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import List, Tuple, Dict, Set
import heapq

app = Flask(__name__)
CORS(app)

class Node:
    def __init__(self, position: Tuple[int, int], g=0, h=0, parent=None):
        self.position = position
        self.g = g
        self.h = h
        self.f = g + h
        self.parent = parent

    def __lt__(self, other):
        return self.f < other.f

def heuristic(a: Tuple[int, int], b: Tuple[int, int]) -> int:
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def get_neighbors(grid: List[List[str]], node: Node, occupied_positions: Set[Tuple[int, int]]) -> List[Node]:
    neighbors = []
    for dx, dy in [(0, 1), (1, 0), (0, -1), (-1, 0)]:
        new_pos = (node.position[0] + dx, node.position[1] + dy)
        if (0 <= new_pos[0] < len(grid) and 0 <= new_pos[1] < len(grid[0]) and
                grid[new_pos[0]][new_pos[1]] != 'X' and
                new_pos not in occupied_positions):
            neighbors.append(Node(new_pos))
    return neighbors

def a_star(grid: List[List[str]], start: Tuple[int, int], goal: Tuple[int, int], occupied_positions: Set[Tuple[int, int]], max_iterations: int = 1000) -> List[Tuple[int, int]]:
    start_node = Node(start, h=heuristic(start, goal))
    open_list = [start_node]
    closed_set = set()
    iterations = 0

    while open_list and iterations < max_iterations:
        current_node = heapq.heappop(open_list)
        if current_node.position == goal:
            path = []
            while current_node:
                path.append(current_node.position)
                current_node = current_node.parent
            return path[::-1]

        closed_set.add(current_node.position)

        for neighbor in get_neighbors(grid, current_node, occupied_positions):
            if neighbor.position in closed_set:
                continue

            neighbor.g = current_node.g + 1
            neighbor.h = heuristic(neighbor.position, goal)
            neighbor.f = neighbor.g + neighbor.h
            neighbor.parent = current_node

            if all(open_node.position != neighbor.position for open_node in open_list):
                heapq.heappush(open_list, neighbor)

        iterations += 1

    return []  # Return empty path if no solution found within max_iterations

def detect_deadlock(grid: List[List[str]]) -> bool:
    starts = {}
    goals = {}
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j].startswith('A'):
                starts[grid[i][j]] = (i, j)
            elif grid[i][j].startswith('B'):
                goals[grid[i][j].replace('B', 'A')] = (i, j)

    # Check if any bot's path to its goal is blocked by another bot's goal
    for bot, start in starts.items():
        goal = goals[bot]
        other_goals = set(goals.values()) - {goal}
        other_starts = set(starts.values()) - {start}
        blocked_positions = other_goals.union(other_starts)
        path = a_star(grid, start, goal, blocked_positions)
        if not path:
            return True  # Deadlock detected

    return False

def find_paths(grid: List[List[str]]) -> Dict[str, List[Tuple[int, int]]]:
    starts = {}
    goals = {}
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j].startswith('A'):
                starts[grid[i][j]] = (i, j)
            elif grid[i][j].startswith('B'):
                goals[grid[i][j].replace('B', 'A')] = (i, j)

    paths = {}
    occupied_positions = set()
    for bot, start in starts.items():
        goal = goals[bot]
        path = a_star(grid, start, goal, occupied_positions)
        if not path:
            return None  # Return None if no path found for any bot
        paths[bot] = path
        occupied_positions.add(goal)

    return paths

@app.route('/move_bots', methods=['POST'])
def move_bots():
    data = request.json
    grid = data.get('grid')

    if not grid:
        return jsonify({'error': 'Grid data is required'}), 400

    # Check for deadlock
    if detect_deadlock(grid):
        return jsonify({'error': 'Deadlock detected: Some bots cannot reach their goals due to the configuration'}), 422

    paths = find_paths(grid)
    if paths is None:
        return jsonify({'error': 'No valid paths found for all bots'}), 422

    # Generate time log and movement stats
    time_log = generate_time_log(paths)
    movement_stats = calculate_movement_stats(paths)
    obstacles = get_obstacles(grid)

    final_result = {
        'time_log': time_log,
        'movement_stats': movement_stats,
        'grid_dimensions': {
            'width': len(grid[0]),
            'height': len(grid)
        },
        'obstacles': obstacles
    }

    return jsonify(final_result), 200

def get_obstacles(grid: List[List[str]]) -> List[Tuple[int, int]]:
    obstacles = []
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j] == 'X':
                obstacles.append((i, j))
    return obstacles

def generate_time_log(paths: Dict[str, List[Tuple[int, int]]]) -> List[Dict[str, any]]:
    max_length = max(len(path) for path in paths.values())
    time_log = []

    for t in range(max_length):
        positions = {bot: path[min(t, len(path)-1)] for bot, path in paths.items()}
        time_log.append({
            "timestamp": str(t),
            "positions": positions
        })

    return time_log

def calculate_movement_stats(paths: Dict[str, List[Tuple[int, int]]]) -> Dict[str, any]:
    total_movements = {bot: len(path) - 1 for bot, path in paths.items()}
    avg_movements = sum(total_movements.values()) / len(total_movements)
    max_movements = max(total_movements.values())
    
    return {
        "total_movements": total_movements,
        "average_movements": avg_movements,
        "max_movements": max_movements
    }

if __name__ == '__main__':
    app.run(debug=True)