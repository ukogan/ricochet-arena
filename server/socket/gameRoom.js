class GameRoom {
  constructor(roomId, botEnabled = false) {
    this.roomId = roomId;
    this.players = new Map(); // socketId -> { nickname, side, paddleY, score, ready }
    this.status = 'waiting'; // waiting, ready, countdown, playing, finished
    this.createdAt = Date.now();
    this.botEnabled = botEnabled;
    this.botDifficulty = 'medium'; // easy, medium, hard

    // Game constants
    this.FIELD_WIDTH = 16;
    this.FIELD_HEIGHT = 10;
    this.PADDLE_HEIGHT = 2.5;
    this.PADDLE_WIDTH = 0.3;
    this.BALL_RADIUS = 0.2;
    this.OBSTACLE_COUNT = 3;
    this.FPS = 60;
    this.WIN_SCORE = 50;

    // Game state
    this.ball = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    };

    this.obstacles = [];
    this.gameLoopInterval = null;
    this.startTime = null;
    this.obstaclesDestroyed = 0;
    this.lastPlayerToHit = null; // 'left' or 'right'
  }

  addPlayer(socketId, nickname, side) {
    this.players.set(socketId, {
      socketId,
      nickname,
      side,
      paddleY: 0,
      score: 0,
      ready: false
    });
  }

  startGame() {
    this.startTime = Date.now();
    this.resetBall();
    this.createObstacles();
  }

  resetBall() {
    this.ball.x = 0;
    this.ball.y = 0;

    // Random angle and direction
    const angle = (Math.random() - 0.5) * Math.PI / 3;
    const speed = 0.08;
    this.ball.vx = Math.cos(angle) * speed * (Math.random() < 0.5 ? 1 : -1);
    this.ball.vy = Math.sin(angle) * speed;
  }

  createObstacles() {
    this.obstacles = [];
    const shapes = [3, 4, 5, 6, 8]; // triangle, square, pentagon, hexagon, octagon

    for (let i = 0; i < this.OBSTACLE_COUNT; i++) {
      const size = 0.3 + Math.random() * 0.3;
      this.obstacles.push({
        id: `obs_${i}`,
        x: (Math.random() - 0.5) * (this.FIELD_WIDTH - 4),
        y: (Math.random() - 0.5) * (this.FIELD_HEIGHT - 2),
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        radius: size,
        velocityY: (Math.random() - 0.5) * 0.04,
        rotation: 0
      });
    }
  }

  startGameLoop(io) {
    this.gameLoopInterval = setInterval(() => {
      this.updateGame();
      this.broadcastGameState(io);
    }, 1000 / this.FPS);
  }

  stopGameLoop() {
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
  }

  updateGame() {
    // Update bot paddle if enabled
    if (this.botEnabled) {
      this.updateBotPaddle();
    }

    // Update ball position
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Check top/bottom walls
    if (Math.abs(this.ball.y) > this.FIELD_HEIGHT / 2 - this.BALL_RADIUS) {
      this.ball.vy *= -1;
      this.ball.y = Math.sign(this.ball.y) * (this.FIELD_HEIGHT / 2 - this.BALL_RADIUS);
    }

    // Check paddle collisions
    this.checkPaddleCollisions();

    // Check obstacle collisions
    this.checkObstacleCollisions();

    // Update obstacles
    this.updateObstacles();

    // Check scoring (ball past paddle)
    this.checkScoring();
  }

  checkPaddleCollisions() {
    const players = Array.from(this.players.values());

    for (const player of players) {
      const paddleX = player.side === 'left'
        ? -this.FIELD_WIDTH / 2 + this.PADDLE_WIDTH
        : this.FIELD_WIDTH / 2 - this.PADDLE_WIDTH;

      const dx = this.ball.x - paddleX;
      const dy = this.ball.y - player.paddleY;

      // Check collision
      if (Math.abs(dx) < this.PADDLE_WIDTH + this.BALL_RADIUS &&
          Math.abs(dy) < this.PADDLE_HEIGHT / 2 + this.BALL_RADIUS) {

        // Calculate curve effect based on where ball hit paddle
        const relativeY = dy / (this.PADDLE_HEIGHT / 2);
        const curveEffect = relativeY * 0.3;

        this.ball.vx *= -1.05; // Reverse and speed up
        this.ball.vy += curveEffect;

        // Move ball out of paddle
        this.ball.x = paddleX + Math.sign(dx) * (this.PADDLE_WIDTH + this.BALL_RADIUS);

        // Track who last hit the ball
        this.lastPlayerToHit = player.side;
      }
    }
  }

  checkObstacleCollisions() {
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      const dx = this.ball.x - obs.x;
      const dy = this.ball.y - obs.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < this.BALL_RADIUS + obs.radius) {
        // Bounce off obstacle
        const angle = Math.atan2(dy, dx);
        const currentSpeed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);

        this.ball.vx = Math.cos(angle) * currentSpeed;
        this.ball.vy = Math.sin(angle) * currentSpeed;

        // Move ball out
        const overlap = this.BALL_RADIUS + obs.radius - dist;
        this.ball.x += Math.cos(angle) * overlap;
        this.ball.y += Math.sin(angle) * overlap;

        // Award point to last player who hit ball
        if (this.lastPlayerToHit) {
          const player = Array.from(this.players.values()).find(p => p.side === this.lastPlayerToHit);
          if (player) {
            player.score++;
            this.obstaclesDestroyed++;

            // Remove obstacle and create new one
            this.obstacles.splice(i, 1);
            this.createSingleObstacle();

            return { type: 'obstacle', scorer: this.lastPlayerToHit, obstacleId: obs.id };
          }
        }
      }
    }
    return null;
  }

  createSingleObstacle() {
    const shapes = [3, 4, 5, 6, 8];
    const size = 0.3 + Math.random() * 0.3;

    this.obstacles.push({
      id: `obs_${Date.now()}`,
      x: (Math.random() - 0.5) * (this.FIELD_WIDTH - 4),
      y: (Math.random() - 0.5) * (this.FIELD_HEIGHT - 2),
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      radius: size,
      velocityY: (Math.random() - 0.5) * 0.04,
      rotation: 0
    });
  }

  updateObstacles() {
    for (const obs of this.obstacles) {
      obs.y += obs.velocityY;
      obs.rotation += 0.02;

      // Bounce off top/bottom
      if (Math.abs(obs.y) > this.FIELD_HEIGHT / 2 - obs.radius) {
        obs.velocityY *= -1;
        obs.y = Math.sign(obs.y) * (this.FIELD_HEIGHT / 2 - obs.radius);
      }
    }
  }

  checkScoring() {
    const players = Array.from(this.players.values());
    let scoreEvent = null;

    // Ball past left paddle
    if (this.ball.x < -this.FIELD_WIDTH / 2) {
      const rightPlayer = players.find(p => p.side === 'right');
      if (rightPlayer) {
        rightPlayer.score++;
        scoreEvent = { type: 'goal', scorer: 'right' };
      }
      this.resetBall();
    }

    // Ball past right paddle
    if (this.ball.x > this.FIELD_WIDTH / 2) {
      const leftPlayer = players.find(p => p.side === 'left');
      if (leftPlayer) {
        leftPlayer.score++;
        scoreEvent = { type: 'goal', scorer: 'left' };
      }
      this.resetBall();
    }

    // Check win condition
    for (const player of players) {
      if (player.score >= this.WIN_SCORE) {
        this.status = 'finished';
        this.stopGameLoop();

        return {
          type: 'game_over',
          winner: player,
          duration: Math.floor((Date.now() - this.startTime) / 1000)
        };
      }
    }

    return scoreEvent;
  }

  updateBotPaddle() {
    const players = Array.from(this.players.values());
    const botPlayer = players.find(p => p.side === 'right'); // Bot is always right paddle

    if (!botPlayer) return;

    let targetY = this.ball.y; // Default target is ball Y position

    // Predict ball trajectory for medium/hard difficulty
    if (this.botDifficulty === 'medium' || this.botDifficulty === 'hard') {
      // Simple prediction: where will ball be when it reaches paddle X?
      const paddleX = this.FIELD_WIDTH / 2 - this.PADDLE_WIDTH;
      const timeToReach = Math.abs((paddleX - this.ball.x) / this.ball.vx);
      targetY = this.ball.y + this.ball.vy * timeToReach;

      // Clamp to field bounds
      targetY = Math.max(-this.FIELD_HEIGHT / 2, Math.min(this.FIELD_HEIGHT / 2, targetY));
    }

    // Add difficulty-based error and speed
    let botSpeed;
    let error = 0;

    switch (this.botDifficulty) {
      case 'easy':
        botSpeed = 0.08; // Slower than human
        error = (Math.random() - 0.5) * 1.5; // Large random error
        break;
      case 'medium':
        botSpeed = 0.12; // Same as human
        error = (Math.random() - 0.5) * 0.5; // Small random error
        break;
      case 'hard':
        botSpeed = 0.15; // Faster than human
        error = (Math.random() - 0.5) * 0.2; // Minimal error
        break;
    }

    targetY += error;

    // Move paddle toward target
    const diff = targetY - botPlayer.paddleY;
    if (Math.abs(diff) > 0.1) {
      const movement = Math.sign(diff) * botSpeed;
      botPlayer.paddleY += movement;

      // Clamp to bounds
      const maxY = this.FIELD_HEIGHT / 2 - this.PADDLE_HEIGHT / 2;
      botPlayer.paddleY = Math.max(-maxY, Math.min(maxY, botPlayer.paddleY));
    }
  }

  broadcastGameState(io) {
    if (this.status !== 'playing') return;

    const scoreEvent = this.checkScoring();

    // Get player data
    const players = Array.from(this.players.values());
    const player1 = players.find(p => p.side === 'left');
    const player2 = players.find(p => p.side === 'right');

    // Send game state
    io.to(this.roomId).emit('game_state', {
      timestamp: Date.now(),
      ball: {
        x: this.ball.x,
        y: this.ball.y,
        vx: this.ball.vx,
        vy: this.ball.vy
      },
      obstacles: this.obstacles.map(obs => ({
        id: obs.id,
        x: obs.x,
        y: obs.y,
        shape: obs.shape,
        radius: obs.radius,
        rotation: obs.rotation
      })),
      paddle1_y: player1 ? player1.paddleY : 0,
      paddle2_y: player2 ? player2.paddleY : 0,
      scores: {
        left: player1 ? player1.score : 0,
        right: player2 ? player2.score : 0
      }
    });

    // Send score update if there was a score event
    if (scoreEvent) {
      if (scoreEvent.type === 'game_over') {
        io.to(this.roomId).emit('game_over', {
          winner: {
            nickname: scoreEvent.winner.nickname,
            side: scoreEvent.winner.side
          },
          final_scores: {
            left: player1 ? player1.score : 0,
            right: player2 ? player2.score : 0
          },
          duration_seconds: scoreEvent.duration,
          obstacles_destroyed: this.obstaclesDestroyed
        });
      } else {
        io.to(this.roomId).emit('score_update', {
          type: scoreEvent.type,
          scorer: scoreEvent.scorer,
          scores: {
            left: player1 ? player1.score : 0,
            right: player2 ? player2.score : 0
          },
          obstacle_id: scoreEvent.obstacleId
        });
      }
    }
  }
}

module.exports = GameRoom;
