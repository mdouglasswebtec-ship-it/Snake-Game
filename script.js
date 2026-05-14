const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const bestScoreEl = document.getElementById("best-score");
const statusEl = document.getElementById("status");

const GRID_COUNT = 20;
const TILE_SIZE = canvas.width / GRID_COUNT;
const START_SPEED = 125;
const MIN_SPEED = 70;
const SPEED_STEP = 2;
const BEST_SCORE_KEY = "snake-neon-best-score";

const vectors = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

let snake = [];
let direction = vectors.right;
let pendingDirection = vectors.right;
let food = { x: 0, y: 0 };
let speed = START_SPEED;
let score = 0;
let bestScore = Number(localStorage.getItem(BEST_SCORE_KEY)) || 0;
let running = false;
let paused = false;
let gameOver = false;
let lastTick = 0;

bestScoreEl.textContent = String(bestScore);
setupTouchControls();
resetGame();
requestAnimationFrame(gameLoop);

function setupTouchControls() {
  const buttons = document.querySelectorAll("[data-dir]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      setDirection(button.dataset.dir);
    });
  });
}

function resetGame() {
  snake = [
    { x: 8, y: 10 },
    { x: 7, y: 10 },
    { x: 6, y: 10 }
  ];
  direction = vectors.right;
  pendingDirection = vectors.right;
  speed = START_SPEED;
  score = 0;
  gameOver = false;
  paused = false;
  running = false;
  scoreEl.textContent = "0";
  statusEl.textContent = "Press Enter to start";
  spawnFood();
  render();
}

function startGame() {
  if (!running && !gameOver) {
    running = true;
    statusEl.textContent = "Collect food and avoid walls";
  }
}

function spawnFood() {
  do {
    food = {
      x: Math.floor(Math.random() * GRID_COUNT),
      y: Math.floor(Math.random() * GRID_COUNT)
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
}

function setDirection(key) {
  if (!running && !gameOver) {
    startGame();
  }

  const next = vectors[key];
  if (!next) {
    return;
  }

  // Prevent immediate 180-degree turns that would self-collide unfairly.
  if (next.x + direction.x === 0 && next.y + direction.y === 0) {
    return;
  }

  pendingDirection = next;
}

function togglePause() {
  if (!running || gameOver) {
    return;
  }

  paused = !paused;
  statusEl.textContent = paused ? "Paused" : "Collect food and avoid walls";
}

function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);

  if (!running || paused || gameOver) {
    return;
  }

  if (timestamp - lastTick < speed) {
    return;
  }

  lastTick = timestamp;
  tick();
  render();
}

function tick() {
  direction = pendingDirection;
  const nextHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  const hitWall =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= GRID_COUNT ||
    nextHead.y >= GRID_COUNT;

  const hitSelf = snake.some((segment) => {
    return segment.x === nextHead.x && segment.y === nextHead.y;
  });

  if (hitWall || hitSelf) {
    endGame();
    return;
  }

  snake.unshift(nextHead);

  const ateFood = nextHead.x === food.x && nextHead.y === food.y;
  if (ateFood) {
    score += 10;
    scoreEl.textContent = String(score);
    speed = Math.max(MIN_SPEED, speed - SPEED_STEP);
    spawnFood();

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
      bestScoreEl.textContent = String(bestScore);
    }
  } else {
    snake.pop();
  }
}

function endGame() {
  gameOver = true;
  running = false;
  statusEl.textContent = `Game over - score ${score}. Press Enter to restart`;
}

function drawCell(x, y, color, glow = false) {
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;

  if (glow) {
    ctx.shadowBlur = 12;
    ctx.shadowColor = "rgba(29, 155, 119, 0.65)";
  } else {
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  ctx.shadowBlur = 0;
}

function drawGrid() {
  ctx.strokeStyle = "rgba(22, 35, 43, 0.08)";
  ctx.lineWidth = 1;

  for (let i = 1; i < GRID_COUNT; i += 1) {
    const offset = i * TILE_SIZE + 0.5;

    ctx.beginPath();
    ctx.moveTo(offset, 0);
    ctx.lineTo(offset, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, offset);
    ctx.lineTo(canvas.width, offset);
    ctx.stroke();
  }
}

function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#fffdfa");
  gradient.addColorStop(1, "#e6fff6");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  drawGrid();
  drawCell(food.x, food.y, "#e05263");

  snake.forEach((segment, index) => {
    if (index === 0) {
      drawCell(segment.x, segment.y, "#0c6f53", true);
      return;
    }
    drawCell(segment.x, segment.y, "#1d9b77");
  });
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();

  if (key === "enter") {
    if (gameOver) {
      resetGame();
    }
    startGame();
    return;
  }

  if (key === " ") {
    event.preventDefault();
    togglePause();
    return;
  }

  if (key === "arrowup" || key === "w") {
    event.preventDefault();
    setDirection("up");
  } else if (key === "arrowdown" || key === "s") {
    event.preventDefault();
    setDirection("down");
  } else if (key === "arrowleft" || key === "a") {
    event.preventDefault();
    setDirection("left");
  } else if (key === "arrowright" || key === "d") {
    event.preventDefault();
    setDirection("right");
  }
});
