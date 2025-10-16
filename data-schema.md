# Ricochet Arena - Data Schema Documentation

**Last Updated:** 2025-10-15

This document defines all database tables, API request/response formats, and WebSocket event payloads.

---

## Database Schema (PostgreSQL)

### Users Table

Stores player accounts and aggregate statistics.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  total_games INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  highest_score INTEGER DEFAULT 0,
  total_obstacles_destroyed INTEGER DEFAULT 0
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

**Field Notes:**
- `id`: UUID for security (not sequential integers)
- `username`: 3-20 chars, alphanumeric + underscore, case-insensitive unique
- `email`: Standard email validation, used for future password reset
- `password_hash`: bcrypt hash with 10 salt rounds, never returned in API
- `total_games`: Incremented after each game completion
- `highest_score`: Max score achieved in a single game (even if lost)

**Example Record:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "username": "SpeedyPaddle",
  "email": "player@example.com",
  "password_hash": "$2b$10$...",
  "created_at": "2025-10-15T10:30:00Z",
  "last_login": "2025-10-15T14:20:00Z",
  "total_games": 42,
  "total_wins": 28,
  "total_losses": 14,
  "highest_score": 50,
  "total_obstacles_destroyed": 156
}
```

---

### Games Table

Records completed matches with final scores and metadata.

```sql
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player1_score INTEGER NOT NULL CHECK (player1_score >= 0),
  player2_score INTEGER NOT NULL CHECK (player2_score >= 0),
  winner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  obstacles_destroyed INTEGER DEFAULT 0,
  started_at TIMESTAMP NOT NULL,
  finished_at TIMESTAMP NOT NULL,
  CONSTRAINT winner_is_player CHECK (winner_id IN (player1_id, player2_id)),
  CONSTRAINT valid_winner CHECK (
    (winner_id = player1_id AND player1_score = 50) OR
    (winner_id = player2_id AND player2_score = 50)
  )
);

CREATE INDEX idx_games_player1 ON games(player1_id);
CREATE INDEX idx_games_player2 ON games(player2_id);
CREATE INDEX idx_games_finished_at ON games(finished_at DESC);
```

**Field Notes:**
- `player1_id`: User who created/joined first
- `player2_id`: User who joined second
- `winner_id`: Must be one of the players, score must be 50
- `duration_seconds`: Total match time in seconds
- `obstacles_destroyed`: Combined count from both players

**Example Record:**
```json
{
  "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "player1_id": "550e8400-e29b-41d4-a716-446655440000",
  "player2_id": "660e8400-e29b-41d4-a716-446655440001",
  "player1_score": 50,
  "player2_score": 42,
  "winner_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration_seconds": 263,
  "obstacles_destroyed": 18,
  "started_at": "2025-10-15T14:20:00Z",
  "finished_at": "2025-10-15T14:24:23Z"
}
```

---

### Game Events Table (Phase 2 - Optional)

For replay functionality and detailed analytics.

```sql
CREATE TABLE game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  player_id UUID REFERENCES users(id) ON DELETE SET NULL,
  timestamp TIMESTAMP NOT NULL,
  data JSONB
);

CREATE INDEX idx_game_events_game ON game_events(game_id);
CREATE INDEX idx_game_events_timestamp ON game_events(timestamp);
```

**Event Types:**
- `score_goal`: Ball passed opponent paddle
- `score_obstacle`: Player destroyed obstacle
- `paddle_hit`: Ball hit paddle
- `obstacle_bounce`: Ball bounced off obstacle

**Example Events:**
```json
[
  {
    "id": "...",
    "game_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "event_type": "score_goal",
    "player_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-10-15T14:20:15Z",
    "data": {
      "new_score": 1,
      "ball_velocity": { "x": 0.12, "y": 0.05 }
    }
  },
  {
    "id": "...",
    "game_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "event_type": "score_obstacle",
    "player_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-10-15T14:20:32Z",
    "data": {
      "obstacle_shape": "hexagon",
      "obstacle_position": { "x": 2.5, "y": -1.3 }
    }
  }
]
```

---

## REST API Contracts

### Authentication Endpoints

#### POST /api/auth/register

**Request:**
```json
{
  "username": "SpeedyPaddle",
  "email": "player@example.com",
  "password": "securePassword123"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SpeedyPaddle",
    "email": "player@example.com",
    "created_at": "2025-10-15T10:30:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "error": "Username already taken"
}
```

---

#### POST /api/auth/login

**Request:**
```json
{
  "username": "SpeedyPaddle",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SpeedyPaddle",
    "email": "player@example.com",
    "total_games": 42,
    "total_wins": 28,
    "total_losses": 14
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "error": "Invalid username or password"
}
```

---

#### GET /api/auth/me

**Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SpeedyPaddle",
    "email": "player@example.com",
    "total_games": 42,
    "total_wins": 28,
    "total_losses": 14,
    "highest_score": 50,
    "total_obstacles_destroyed": 156,
    "last_login": "2025-10-15T14:20:00Z"
  }
}
```

---

### User Endpoints

#### GET /api/users/:id

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SpeedyPaddle",
    "total_games": 42,
    "total_wins": 28,
    "total_losses": 14,
    "highest_score": 50,
    "win_rate": 0.67,
    "created_at": "2025-10-15T10:30:00Z"
  }
}
```

**Note:** Email is NOT included in public user profiles

---

#### GET /api/users/:id/history

Query params: `?limit=10&offset=0`

**Response (200 OK):**
```json
{
  "success": true,
  "games": [
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "opponent": {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "username": "PaddleMaster"
      },
      "your_score": 50,
      "opponent_score": 42,
      "result": "victory",
      "duration_seconds": 263,
      "obstacles_destroyed": 18,
      "finished_at": "2025-10-15T14:24:23Z"
    },
    {
      "id": "8d9e6679-7425-40de-944b-e07fc1f90ae8",
      "opponent": {
        "id": "770e8400-e29b-41d4-a716-446655440002",
        "username": "QuickReflexes"
      },
      "your_score": 43,
      "opponent_score": 50,
      "result": "defeat",
      "duration_seconds": 198,
      "obstacles_destroyed": 12,
      "finished_at": "2025-10-15T13:15:42Z"
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

---

### Game Endpoints

#### POST /api/games

Called by server after game completes (not directly by client).

**Request:**
```json
{
  "player1_id": "550e8400-e29b-41d4-a716-446655440000",
  "player2_id": "660e8400-e29b-41d4-a716-446655440001",
  "player1_score": 50,
  "player2_score": 42,
  "winner_id": "550e8400-e29b-41d4-a716-446655440000",
  "duration_seconds": 263,
  "obstacles_destroyed": 18,
  "started_at": "2025-10-15T14:20:00Z",
  "finished_at": "2025-10-15T14:24:23Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "game_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

#### GET /api/games/:id

**Response (200 OK):**
```json
{
  "success": true,
  "game": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "player1": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "SpeedyPaddle"
    },
    "player2": {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "username": "PaddleMaster"
    },
    "player1_score": 50,
    "player2_score": 42,
    "winner": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "username": "SpeedyPaddle"
    },
    "duration_seconds": 263,
    "obstacles_destroyed": 18,
    "started_at": "2025-10-15T14:20:00Z",
    "finished_at": "2025-10-15T14:24:23Z"
  }
}
```

---

## WebSocket Events (Socket.IO)

All events require authentication via JWT token passed during connection.

### Client → Server Events

#### `find_match`

Enter matchmaking queue.

**Payload:**
```json
{
  "mode": "quick_match"
}
```

**Server Response:** `match_found` or `queue_status`

---

#### `cancel_match`

Leave matchmaking queue.

**Payload:** None

---

#### `create_private_room`

Generate private room code.

**Payload:** None

**Server Response:**
```json
{
  "event": "room_created",
  "room_code": "ABC123"
}
```

---

#### `join_private_room`

Join room with code.

**Payload:**
```json
{
  "room_code": "ABC123"
}
```

**Server Response:** `match_found` or `error`

---

#### `player_ready`

Signal ready to start game.

**Payload:** None

**Server Response:** `game_start` (when both ready)

---

#### `paddle_move`

Update paddle position (sent every frame).

**Payload:**
```json
{
  "y": 2.5,
  "timestamp": 1697376000123
}
```

**Note:** Server validates y is within bounds (-5 to 5)

---

#### `leave_game`

Disconnect or forfeit.

**Payload:** None

**Server Response:** Game ends, opponent notified

---

### Server → Client Events

#### `room_created`

Room successfully created.

**Payload:**
```json
{
  "room_id": "X3kP9m",
  "room_url": "https://ricochet.app/game/X3kP9m",
  "your_side": "left",
  "nickname": "SpeedyPaddle"
}
```

**Note:** Player who creates room is always player 1 (left side)

---

#### `player_joined`

Second player joined the room.

**Payload:**
```json
{
  "player1": {
    "nickname": "SpeedyPaddle",
    "side": "left"
  },
  "player2": {
    "nickname": "PaddleMaster",
    "side": "right"
  }
}
```

**Note:** Sent to both players when room becomes full

---

#### `game_start`

Countdown complete, game begins.

**Payload:**
```json
{
  "countdown": 0,
  "start_time": "2025-10-15T14:20:00Z"
}
```

---

#### `game_state`

Ball and obstacle positions (sent 60 times/second).

**Payload:**
```json
{
  "timestamp": 1697376000123,
  "ball": {
    "x": 2.5,
    "y": -1.2,
    "vx": 0.08,
    "vy": 0.05
  },
  "obstacles": [
    {
      "id": "obs_1",
      "x": 1.5,
      "y": 2.0,
      "shape": "hexagon",
      "radius": 0.4
    },
    {
      "id": "obs_2",
      "x": -3.0,
      "y": -1.5,
      "shape": "pentagon",
      "radius": 0.5
    }
  ],
  "paddle1_y": 1.2,
  "paddle2_y": -0.8
}
```

---

#### `score_update`

Point scored.

**Payload:**
```json
{
  "type": "goal",
  "scorer": "player1",
  "player1_score": 15,
  "player2_score": 12
}
```

Or:

```json
{
  "type": "obstacle",
  "scorer": "player2",
  "obstacle_id": "obs_1",
  "player1_score": 15,
  "player2_score": 13
}
```

---

#### `game_over`

Match finished.

**Payload:**
```json
{
  "winner": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "username": "SpeedyPaddle"
  },
  "final_scores": {
    "player1": 50,
    "player2": 42
  },
  "duration_seconds": 263,
  "obstacles_destroyed": 18,
  "game_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
}
```

---

#### `opponent_disconnected`

Other player left.

**Payload:**
```json
{
  "reason": "disconnect",
  "forfeit": true
}
```

---

#### `error`

Error message.

**Payload:**
```json
{
  "message": "Room code not found",
  "code": "ROOM_NOT_FOUND"
}
```

**Error Codes:**
- `ROOM_NOT_FOUND`: Invalid room code
- `ROOM_FULL`: Room already has 2 players
- `INVALID_PADDLE_POSITION`: Paddle y out of bounds
- `NOT_IN_GAME`: Tried to move paddle without active game
- `UNAUTHORIZED`: Invalid/expired token

---

## Data Validation Rules

### Username
- Length: 3-20 characters
- Characters: a-z, A-Z, 0-9, underscore
- Case-insensitive uniqueness
- Cannot start with underscore
- No consecutive underscores

**Regex:** `^[a-zA-Z0-9][a-zA-Z0-9_]{1,18}[a-zA-Z0-9]$`

### Email
- Standard email validation
- Max 255 characters
- Case-insensitive uniqueness

**Regex:** `^[^\s@]+@[^\s@]+\.[^\s@]+$`

### Password
- Min 8 characters
- No max (bcrypt handles long passwords)
- No character requirements (Phase 1)
- Hashed with bcrypt, 10 salt rounds

### Room Code
- Exactly 6 characters
- Uppercase letters only
- Generated randomly
- Expires after 10 minutes unused

**Example:** `ABC123`

---

## Fake/Test Data Markers

All test data must use these markers:

- Usernames: `TEST_PlayerName`, `FAKE_User`
- Emails: `fake@test.com`, `test@example.invalid`
- Game records: Set `obstacles_destroyed = -1` for test games

**Never use real-looking data for testing** (no "John", "Alice", etc.)

---

## Entity Isolation

**Critical:** All queries must filter by user_id to prevent cross-contamination.

**Wrong:**
```javascript
const games = await prisma.game.findMany();
```

**Correct:**
```javascript
const games = await prisma.game.findMany({
  where: {
    OR: [
      { player1_id: userId },
      { player2_id: userId }
    ]
  }
});
```

**Audit every database query** for user_id filtering before deployment.

---

## Notes for Developers

1. **Timestamps:** Always use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
2. **UUIDs:** Use UUID v4 for all IDs
3. **Pagination:** Default limit=10, max limit=100
4. **Rate Limiting:** 100 requests per 15 minutes per IP
5. **JWT Expiry:** Tokens expire after 24 hours
6. **WebSocket Reconnect:** Client should reconnect with same token
7. **Server Authority:** Server validates all game physics, ignore client predictions

---

## Schema Version History

- **1.0 (2025-10-15):** Initial schema for Phase 1 MVP
