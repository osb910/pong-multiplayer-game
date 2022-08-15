// Canvas Related
const {body} = document;
const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');
const gameOverEl = document.createElement('div');

const socket = io('/pong');
let isReferee = false;

let paddleIndex = 0;

let width = 500;
let height = 610;

// Paddle
let paddleHeight = 10;
let paddleWidth = 50;
let paddleDiff = 25;
let paddleX = [width / 2 - paddleWidth / 2, width / 2 - paddleWidth / 2];
let trajectoryX = [0, 0];
let playerMoved = false;

// Ball
let ballX = 250;
let ballY = 350;
let ballRadius = 5;
let ballDirection = 1;

// Speed
let speedY = 2;
let speedX = 0;
// let computerSpeed = 4;

// Score for Both Players
let score = [0, 0];
let isGameOver = true;
let isNewGame = true;
const winningScore = 8;

// Create Canvas Element
const createCanvas = () => {
  canvas.id = 'canvas';
  canvas.width = width;
  canvas.height = height;
  document.body.append(canvas);
  renderCanvas();
};

// Wait for Opponents
const renderIntro = () => {
  // Canvas Background
  context.fillStyle = 'black';
  context.fillRect(0, 0, width, height);

  // Intro Text
  context.fillStyle = 'white';
  context.font = '32px Courier New';
  context.fillText('Waiting for opponent...', 20, canvas.height / 2 - 30);
};

// Render Everything on Canvas
const renderCanvas = () => {
  // Canvas Background
  context.fillStyle = '#000';
  context.fillRect(0, 0, width, height);

  // Paddle Color
  context.fillStyle = '#fff';

  // Bottom Paddle
  context.fillRect(paddleX[0], height - 20, paddleWidth, paddleHeight);

  // Top Paddle
  context.fillRect(paddleX[1], 10, paddleWidth, paddleHeight);

  // Dashed Center Line
  context.beginPath();
  context.setLineDash([6]);
  context.moveTo(0, height / 2);
  context.lineTo(width, height / 2);
  context.strokeStyle = '#888';
  context.stroke();

  // Ball
  context.beginPath();
  context.arc(ballX, ballY, ballRadius, 2 * Math.PI, false);
  context.fillStyle = '#fff';
  context.fill();

  // Score
  context.font = '32px Courier New';
  context.fillText(score[0], 20, canvas.height / 2 + 50);
  context.fillText(score[1], 20, canvas.height / 2 - 30);
};

const emitBall = () => {
  socket.emit('ballMove', {
    ballX,
    ballY,
    score,
  });
};

// Reset Ball to Center
const ballReset = () => {
  ballX = width / 2;
  ballY = height / 2;
  speedY = 3;

  emitBall();
};

const showGameOverEl = winner => {
  // Hide Canvas
  canvas.hidden = true;
  // Container
  gameOverEl.textContent = '';
  gameOverEl.classList.add('game-over-container');
  // Title
  const title = document.createElement('h1');
  title.textContent = `${winner} Wins!`;
  // Button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.setAttribute('onclick', 'startGame()');
  playAgainBtn.textContent = 'Play Again';
  // Append
  gameOverEl.append(title, playAgainBtn);
  body.appendChild(gameOverEl);
};

// Check if one player has winning score. If so, end game
const endGame = () => {
  if (score.some(s => s === winningScore)) {
    ballReset();
    setTimeout(() => (isGameOver = true), 30);
    let winner = score[0] === winningScore ? 'Player 1' : 'Computer';
    showGameOverEl(winner);
  }
};

// Adjust Ball Movement
const moveBall = () => {
  // Vertical Speed
  ballY += speedY * ballDirection;
  // Horizontal Speed
  if (playerMoved) {
    ballX += speedX;
  }

  emitBall();
};

// Determine What Ball Bounces Off, Score Points, Reset Ball
const ballBoundaries = () => {
  // Bounce off Left Wall
  if (ballX < 0 && speedX < 0) {
    speedX = -speedX;
  }
  // Bounce off Right Wall
  if (ballX > width && speedX > 0) {
    speedX = -speedX;
  }
  // Bounce off player paddle (bottom)
  if (ballY > height - paddleDiff) {
    if (ballX >= paddleX[0] && ballX <= paddleX[0] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[0] = ballX - (paddleX[0] + paddleDiff);
      speedX = trajectoryX[0] * 0.3;
    } else {
      // Reset Ball, add to Computer Score
      ballReset();
      score[1]++;
      // endGame();
    }
  }
  // Bounce off computer paddle (top)
  if (ballY < paddleDiff) {
    if (ballX >= paddleX[1] && ballX <= paddleX[1] + paddleWidth) {
      // Add Speed on Hit
      if (playerMoved) {
        speedY += 1;
        // Max Speed
        if (speedY > 5) {
          speedY = 5;
        }
      }
      ballDirection = -ballDirection;
      trajectoryX[1] = ballX - (paddleX[1] + paddleDiff);
      speedX = trajectoryX[1] * 0.3;
    } else {
      // Reset Ball, Increase Computer Difficulty, add to Player Score
      // if (computerSpeed < 9) {
      //   computerSpeed += 0.5;
      // }
      ballReset();
      score[0]++;
      // endGame();
    }
  }
};

// Computer Movement
// const computerAI = () => {
//   if (playerMoved) {
//     if (paddleX[1] + paddleDiff < ballX) {
//       paddleX[1] += computerSpeed;
//     } else {
//       paddleX[1] -= computerSpeed;
//     }
//     if (paddleX[1] < 0) {
//       paddleX[1] = 0;
//     } else if (paddleX[1] > width - paddleWidth) {
//       paddleX[1] = width - paddleWidth;
//     }
//   }
// };

// Called Every Frame
const animate = () => {
  // computerAI();
  if (isReferee) {
    moveBall();
    ballBoundaries();
  }
  renderCanvas();
  if (isGameOver) return;
  window.requestAnimationFrame(animate);
};

// Load Game, Reset Everything
const loadGame = () => {
  if (isGameOver && !isNewGame) {
    body.removeChild(gameOverEl);
    canvas.hidden = false;
  }
  isGameOver = false;
  isNewGame = false;
  score = [0, 0];
  ballReset();
  createCanvas();
  renderIntro();
  socket.emit('ready');
};

const startGame = () => {
  paddleIndex = isReferee ? 0 : 1;
  window.requestAnimationFrame(animate);
  canvas.addEventListener('mousemove', evt => {
    playerMoved = true;
    paddleX[paddleIndex] = evt.offsetX;
    if (paddleX[paddleIndex] < 0) {
      paddleX[paddleIndex] = 0;
    }
    if (paddleX[paddleIndex] > width - paddleWidth) {
      paddleX[paddleIndex] = width - paddleWidth;
    }

    socket.emit('paddleMove', {
      xPosition: paddleX[paddleIndex],
    });

    // Hide Cursor
    canvas.style.cursor = 'none';
  });
};

// On Load
loadGame();

socket.on('connect', () => {
  console.log('Connected as...', socket.id);
});

socket.on('startGame', refereeId => {
  console.log('Referee is', refereeId);
  isReferee = socket.id === refereeId;
  startGame();
});

socket.on('paddleMove', paddleData => {
  const opponentPaddleIndex = 1 - paddleIndex;
  paddleX[opponentPaddleIndex] = paddleData.xPosition;
});

socket.on('ballMove', ballData => {
  ({ballX, ballY, score} = ballData);
});
