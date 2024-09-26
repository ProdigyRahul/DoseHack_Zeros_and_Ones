
from flask import Flask, jsonify, request
from flask_cors import CORS
import heapq
from typing import List, Tuple, Dict, Set

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

@app.errorhandler(IndexError)
def handle_index_error(error):
    return jsonify({'error': 'An operation could not be completed because an index is out of range. Please check your input data.'}), 422

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

def find_paths(grid: List[List[str]]) -> Tuple[Dict[str, List[Tuple[int, int]]], str]:
    starts = {}
    goals = {}
    for i in range(len(grid)):
        for j in range(len(grid[0])):
            if grid[i][j].startswith('A'):
                starts[grid[i][j]] = (i, j)
            elif grid[i][j].startswith('B'):
                goals[grid[i][j]] = (i, j)

    paths = {}
    occupied_positions = set()
    for bot, start in starts.items():
        goal = goals[bot.replace('A', 'B')]
        path = a_star(grid, start, goal, occupied_positions)
        if not path:
            return None, bot  # Return None and the bot for which no path was found
        paths[bot] = path
        occupied_positions.add(goal)

    return paths, None  # Return paths and None if all paths were found successfully

def detect_deadlock(stuck_count: Dict[str, int], threshold: int = 5) -> bool:
    return any(stuck >= threshold for stuck in stuck_count.values())

def avoid_collisions(paths: Dict[str, List[Tuple[int, int]]], grid: List[List[str]], max_iterations: int = 1000) -> Tuple[Dict[str, List[Tuple[int, int]]], bool]:
    max_length = max(len(path) for path in paths.values())
    collision_free_paths = {bot: list(path) for bot, path in paths.items()}
    occupied_positions = {}
    last_positions = {bot: path[0] for bot, path in collision_free_paths.items()}
    stuck_count = {bot: 0 for bot in collision_free_paths.keys()}

    deadlock_detected = False

    for t in range(max_iterations):
        if all(t >= len(path) for path in collision_free_paths.values()):
            break

        current_positions = {}
        for bot, path in collision_free_paths.items():
            if t < len(path):
                intended_pos = path[t]
                current_pos = last_positions[bot]

                if (intended_pos in current_positions.values() or
                    (intended_pos in occupied_positions and occupied_positions[intended_pos] in current_positions)):
                    current_positions[bot] = current_pos
                    collision_free_paths[bot].insert(t, current_pos)
                    stuck_count[bot] += 1
                else:
                    current_positions[bot] = intended_pos
                    stuck_count[bot] = 0

                last_positions[bot] = current_positions[bot]

        if detect_deadlock(stuck_count):
            deadlock_detected = True
            break

        occupied_positions = current_positions

        if t == max_iterations - 1:
            deadlock_detected = True

    return collision_free_paths, deadlock_detected

def calculate_movement_stats(paths: Dict[str, List[Tuple[int, int]]]) -> Dict[str, any]:
    total_movements = {bot: len(path) - 1 for bot, path in paths.items()}
    avg_movements = sum(total_movements.values()) / len(total_movements)
    max_movements = max(total_movements.values())
    
    return {
        "total_movements": total_movements,
        "average_movements": avg_movements,
        "max_movements": max_movements
    }

def generate_time_log(paths: Dict[str, List[Tuple[int, int]]], grid: List[List[str]]) -> List[Dict[str, any]]:
    max_length = max(len(path) for path in paths.values())
    time_log = []
    bot_positions = {bot: path[0] for bot, path in paths.items()}
    grid_height, grid_width = len(grid), len(grid[0])

    for t in range(max_length):
        current_grid = [row[:] for row in grid]
        placed_bots = set()
        
        for bot, path in paths.items():
            if t < len(path):
                new_pos = path[t]
                if new_pos != bot_positions[bot]:
                    bot_positions[bot] = new_pos
            
            x, y = bot_positions[bot]
            if bot not in placed_bots and (current_grid[x][y] == '.' or current_grid[x][y].startswith('B')):
                current_grid[x][y] = bot
                placed_bots.add(bot)
        
        # Replace 'B' goals with '.' if they're not occupied by bots
        for i in range(grid_height):
            for j in range(grid_width):
                if current_grid[i][j].startswith('B') and current_grid[i][j] not in placed_bots:
                    current_grid[i][j] = '.'
        
        time_log.append({
            "timestamp": f"{t}",
            "grid": current_grid
        })

    return time_log

@app.route('/move_bots', methods=['POST'])
def move_bots():
    data = request.json
    grid = data.get('grid')

    if not grid:
        return jsonify({'error': 'Grid data is required'}), 400

    paths, invalid_bot = find_paths(grid)
    if paths is None:
        return jsonify({'error': f'Impossible scenario detected: No valid path found for bot {invalid_bot}'}), 422

    safe_paths, deadlock_detected = avoid_collisions(paths, grid)
    if deadlock_detected:
        return jsonify({'error': 'Deadlock detected: Bots are unable to reach their destinations without collisions'}), 422

    result = generate_time_log(safe_paths, grid)
    movement_stats = calculate_movement_stats(safe_paths)
    
    final_result = {
        'time_log': result,
        'movement_stats': movement_stats,
        'grid_dimensions': {
            'width': len(grid[0]),
            'height': len(grid)
        }
    }

    return jsonify(final_result), 200

if __name__ == '__main__':
    app.run(debug=True)