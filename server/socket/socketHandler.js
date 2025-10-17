const { nanoid } = require('nanoid');
const GameRoom = require('./gameRoom');

// In-memory storage for rooms
const rooms = new Map();

// Cleanup expired rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  const expiryMs = (process.env.ROOM_EXPIRY_HOURS || 1) * 60 * 60 * 1000;

  for (const [roomId, room] of rooms.entries()) {
    if (now - room.createdAt > expiryMs && room.status === 'waiting') {
      console.log(`🗑️  Cleaning up expired room: ${roomId}`);
      rooms.delete(roomId);
    }
  }
}, 5 * 60 * 1000);

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Create a new game room
    socket.on('create_room', ({ nickname, bot = false }) => {
      const roomId = nanoid(6);
      const room = new GameRoom(roomId, bot);

      // Just create empty room - players will join when they navigate to game page
      rooms.set(roomId, room);

      console.log(`🎮 Room created: ${roomId}${bot ? ' (vs Bot)' : ''}`);

      socket.emit('room_created', {
        room_id: roomId,
        room_url: `${process.env.BASE_URL || 'http://localhost:3001'}/game/${roomId}`,
        nickname: nickname || `Player_${Math.floor(Math.random() * 10000)}`,
        bot_enabled: bot
      });
    });

    // Join an existing room
    socket.on('join_room', ({ room_id, nickname }) => {
      const room = rooms.get(room_id);

      if (!room) {
        socket.emit('error', { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
        return;
      }

      if (room.players.size >= 2) {
        socket.emit('error', { message: 'Room is full', code: 'ROOM_FULL' });
        return;
      }

      // Determine which side to join (player 1 or player 2)
      const side = room.players.size === 0 ? 'left' : 'right';
      const playerNum = room.players.size === 0 ? 1 : 2;

      room.addPlayer(socket.id, nickname || `Player_${Math.floor(Math.random() * 10000)}`, side);

      // Join socket room
      socket.join(room_id);
      socket.roomId = room_id;

      console.log(`👥 Player ${playerNum} joined room: ${room_id}`);

      // If bot game, immediately add bot as second player
      if (room.botEnabled && room.players.size === 1) {
        room.addPlayer('bot', 'Bot', 'right');

        // Mark bot as ready immediately (bot doesn't emit player_ready)
        const botPlayer = room.players.get('bot');
        if (botPlayer) {
          botPlayer.ready = true;
        }

        const playersData = {
          player1: {
            nickname: Array.from(room.players.values())[0].nickname,
            side: 'left'
          },
          player2: {
            nickname: 'Bot',
            side: 'right'
          }
        };

        socket.emit('player_joined', playersData);
        room.status = 'ready';
      }
      // If both players present (multiplayer), notify and update status
      else if (room.players.size === 2) {
        const playersData = {
          player1: {
            nickname: Array.from(room.players.values())[0].nickname,
            side: 'left'
          },
          player2: {
            nickname: Array.from(room.players.values())[1].nickname,
            side: 'right'
          }
        };

        io.to(room_id).emit('player_joined', playersData);
        room.status = 'ready';
      } else {
        // Just first player joined, send them confirmation
        socket.emit('room_joined', {
          your_side: side,
          nickname: room.players.get(socket.id).nickname
        });
      }
    });

    // Player ready to start
    socket.on('player_ready', () => {
      const room = rooms.get(socket.roomId);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      player.ready = true;
      console.log(`✓ Player ready: ${player.nickname} in room ${socket.roomId}`);

      // Check if both players are ready
      const allReady = Array.from(room.players.values()).every(p => p.ready);

      if (allReady && room.players.size === 2) {
        // Start countdown
        room.status = 'countdown';
        let countdown = 3;

        const countdownInterval = setInterval(() => {
          io.to(socket.roomId).emit('countdown', { count: countdown });
          countdown--;

          if (countdown < 0) {
            clearInterval(countdownInterval);
            room.status = 'playing';
            room.startGame();

            io.to(socket.roomId).emit('game_start', {
              countdown: 0,
              start_time: new Date().toISOString()
            });

            console.log(`🎯 Game started in room: ${socket.roomId}`);

            // Start game loop
            room.startGameLoop(io);
          }
        }, 1000);
      }
    });

    // Paddle movement
    socket.on('paddle_move', ({ y, timestamp }) => {
      const room = rooms.get(socket.roomId);
      if (!room || room.status !== 'playing') return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Don't update bot paddle from client
      if (room.botEnabled && player.side === 'right') return;

      // Validate paddle position
      const maxY = room.FIELD_HEIGHT / 2 - room.PADDLE_HEIGHT / 2;
      const validY = Math.max(-maxY, Math.min(maxY, y));

      player.paddleY = validY;
    });

    // Leave game
    socket.on('leave_game', () => {
      handleDisconnect(socket);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
      handleDisconnect(socket);
    });
  });

  function handleDisconnect(socket) {
    if (!socket.roomId) return;

    const room = rooms.get(socket.roomId);
    if (!room) return;

    const player = room.players.get(socket.id);
    if (player) {
      console.log(`👋 ${player.nickname} left room ${socket.roomId}`);
    }

    // Remove player from room
    room.players.delete(socket.id);

    // Stop game if playing
    if (room.status === 'playing') {
      room.stopGameLoop();
      // Notify other player
      socket.to(socket.roomId).emit('opponent_disconnected', {
        reason: 'disconnect',
        forfeit: true
      });
      // Delete room if game was active
      rooms.delete(socket.roomId);
    } else if (room.status === 'waiting' && room.players.size === 0) {
      // Only delete waiting rooms if completely empty
      console.log(`🗑️  Deleting empty waiting room: ${socket.roomId}`);
      rooms.delete(socket.roomId);
    } else if (room.status === 'ready' || room.status === 'countdown') {
      // If second player disconnects during ready/countdown, notify first player
      socket.to(socket.roomId).emit('opponent_disconnected', {
        reason: 'disconnect',
        forfeit: false
      });
      room.status = 'waiting';
    }
  }
};
