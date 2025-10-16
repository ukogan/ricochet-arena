# Ricochet Arena - Architecture Document

**Version:** 1.0
**Last Updated:** 2025-10-15
**Architecture Changes Counter:** 0

## Project Overview

Ricochet Arena is a competitive online multiplayer Pong game featuring curved paddles, destructible obstacles, and particle effects. Transform the local 2-player game into a full-featured online experience with user accounts, matchmaking, real-time gameplay, game history tracking, and competitive scoring to 50 points.

## Tech Stack

### Frontend
- **HTML5 Canvas / Three.js** - Game rendering (existing)
- **Vanilla JavaScript** - Game logic and client-side code
- **WebSocket Client** - Real-time bidirectional communication
- **LocalStorage** - Client-side session persistence

### Backend
- **Node.js + Express** - HTTP server and REST API
- **Socket.IO** - WebSocket server for real-time multiplayer
- **PostgreSQL** - Relational database for users and game history
- **Prisma ORM** - Database migrations and queries
- **bcrypt** - Password hashing
- **jsonwebtoken (JWT)** - Authentication tokens

### Deployment
- **Railway** - All-in-one deployment
  - WebSocket server (Socket.IO)
  - Static file serving (HTML/CSS/JS)
  - PostgreSQL database (Phase 2)
  - Single service, persistent Node.js process

### Development Tools
- **npm** - Package management
- **dotenv** - Environment variable management
- **nodemon** - Development server auto-restart

## System Architecture

```
┌─────────────────┐
│   Web Browser   │
│   (Frontend)    │
│                 │
│  - Game Canvas  │
│  - UI/Menus     │
│  - Local State  │
└────────┬────────┘
         │
         │ HTTP (static files) + WebSocket (game sync)
         │
┌────────┴────────┐
│  Railway Server │
│  (Single Deploy)│
│                 │
│  - Express      │
│  - Socket.IO    │
│  - Static Files │
│  - Game Rooms   │
│  - PostgreSQL   │ (Phase 2)
└─────────────────┘
```

## Database Schema

### Users Table
```sql
users {
  id: UUID PRIMARY KEY
  username: VARCHAR(50) UNIQUE NOT NULL
  email: VARCHAR(255) UNIQUE NOT NULL
  password_hash: VARCHAR(255) NOT NULL
  created_at: TIMESTAMP DEFAULT NOW()
  last_login: TIMESTAMP
  total_games: INTEGER DEFAULT 0
  total_wins: INTEGER DEFAULT 0
  total_losses: INTEGER DEFAULT 0
  highest_score: INTEGER DEFAULT 0
}
```

### Games Table
```sql
games {
  id: UUID PRIMARY KEY
  player1_id: UUID REFERENCES users(id)
  player2_id: UUID REFERENCES users(id)
  player1_score: INTEGER NOT NULL
  player2_score: INTEGER NOT NULL
  winner_id: UUID REFERENCES users(id)
  duration_seconds: INTEGER
  obstacles_destroyed: INTEGER DEFAULT 0
  started_at: TIMESTAMP NOT NULL
  finished_at: TIMESTAMP NOT NULL
}
```

### Game Events Table (optional, for replay)
```sql
game_events {
  id: UUID PRIMARY KEY
  game_id: UUID REFERENCES games(id)
  event_type: VARCHAR(50) -- 'score', 'obstacle_hit', 'paddle_hit'
  player_id: UUID REFERENCES users(id)
  timestamp: TIMESTAMP NOT NULL
  data: JSONB -- flexible event data
}
```

## Core Features to Implement

### 1. User Authentication & Accounts
- **Registration:** Username, email, password
- **Login:** JWT-based authentication
- **Session Management:** Token refresh, logout
- **Guest Mode:** Play without account (no stats saved)

### 2. Room System (URL-Based)
- **Create Room:** Generate unique room URL (e.g., ricochet.app/game/abc123)
- **Share URL:** Copy link to clipboard, send to friend
- **Join Room:** Second player visits URL to join
- **Waiting Lobby:** Show "Waiting for player 2..." until someone joins
- **Bot Opponent (Phase 2):** Optional AI opponent if no one joins

### 3. Real-Time Multiplayer
- **WebSocket Communication:** Socket.IO for low-latency sync
- **Game State Sync:** Server is authoritative for ball position
- **Client-Side Prediction:** Smooth paddle movement
- **Lag Compensation:** Interpolation and reconciliation
- **Disconnect Handling:** Pause/forfeit logic

### 4. Game Flow
- **Lobby Screen:** Login, find match, view stats
- **Pre-Game:** 3-2-1 countdown, player ready status
- **Active Game:** Real-time gameplay, first to 50 points
- **Post-Game:** Winner announcement, stats summary, rematch option
- **Game History:** View past games, opponent names, scores

### 5. Scoring & Win Conditions
- **First to 50 Points Wins** (changed from infinite scoring)
- **Score Sources:**
  - Ball passes opponent paddle: 1 point
  - Destroy obstacle: 1 point (if you last hit the ball)
- **Victory Screen:** Winner declared, stats updated
- **Match History Recorded:** All game results saved to database

### 6. UI/UX Enhancements
- **Main Menu:** Play, View Stats, Settings, Logout
- **In-Game HUD:** Player names, scores, connection status
- **Chat System (Phase 2):** Quick messages, emotes
- **Responsive Design:** Works on desktop (mobile Phase 3)
- **Visual Feedback:** Connection indicators, ready states

### 7. Statistics & History
- **Profile Page:** Username, total games, W/L ratio, highest score
- **Match History:** List of past games with dates, opponents, scores
- **Leaderboard (Phase 2):** Top players by wins or win rate

## Security Considerations

1. **Password Security:** bcrypt with salt rounds (10+)
2. **SQL Injection Prevention:** Parameterized queries via Prisma
3. **XSS Protection:** Sanitize all user inputs (usernames, chat)
4. **Rate Limiting:** Prevent spam registrations, API abuse
5. **Token Expiry:** JWT tokens expire after 24 hours
6. **Server Authority:** All game physics validated server-side
7. **Cheat Prevention:** Server controls ball position, validates scores

## Game Synchronization Model

**Server Authoritative Approach:**
- Server runs game physics loop (60 FPS)
- Server broadcasts ball position to both clients
- Clients send paddle positions to server
- Server validates all collisions and scoring
- Clients render based on server state

**Why:** Prevents cheating, ensures consistency, handles lag gracefully

## File Structure

```
bouncing_ball/
├── architecture.md          (this file)
├── PRD.md                   (product requirements)
├── RISKS.md                 (risk assessment)
├── README.md                (setup instructions)
├── data-schema.md           (database documentation)
├── package.json
├── .env.example
├── .gitignore
│
├── client/                  (frontend)
│   ├── index.html           (main menu)
│   ├── game.html            (game canvas)
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── auth.js          (login/register)
│       ├── lobby.js         (matchmaking)
│       ├── game-client.js   (game rendering)
│       └── socket-client.js (WebSocket connection)
│
├── server/                  (backend)
│   ├── index.js             (main server)
│   ├── config/
│   │   └── database.js      (DB connection)
│   ├── models/
│   │   ├── User.js
│   │   └── Game.js
│   ├── controllers/
│   │   ├── authController.js
│   │   └── gameController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── gameRoutes.js
│   ├── socket/
│   │   ├── socketHandler.js
│   │   ├── gameRoom.js      (game state management)
│   │   └── matchmaker.js    (pairing logic)
│   └── middleware/
│       ├── auth.js          (JWT verification)
│       └── validation.js    (input sanitization)
│
├── prisma/
│   ├── schema.prisma        (database schema)
│   └── migrations/
│
└── features/                (feature documentation)
    ├── authentication.md
    ├── matchmaking.md
    ├── real-time-sync.md
    ├── game-history.md
    └── statistics.md
```

## API Endpoints

### REST API (Express)
```
POST   /api/auth/register     - Create new user account
POST   /api/auth/login        - Login and receive JWT
POST   /api/auth/logout       - Invalidate token
GET    /api/auth/me           - Get current user profile

GET    /api/users/:id         - Get user profile
GET    /api/users/:id/stats   - Get user statistics
GET    /api/users/:id/history - Get game history

POST   /api/games             - Create new game record
GET    /api/games/:id         - Get game details
```

### WebSocket Events (Socket.IO)
```
Client → Server:
- 'create_room'             - Generate new room ID
- 'join_room'               - Join existing room by ID
- 'player_ready'            - Ready to start game
- 'paddle_move'             - Send paddle position
- 'leave_game'              - Disconnect/forfeit

Server → Client:
- 'room_created'            - Room ID generated, return URL
- 'player_joined'           - Second player joined room
- 'room_full'               - Room already has 2 players
- 'game_start'              - Countdown begins (both ready)
- 'game_state'              - Ball/obstacle positions (60 FPS)
- 'score_update'            - Point scored
- 'game_over'               - Match finished
- 'opponent_disconnected'   - Other player left
- 'error'                   - Error message
```

## Development Phases (See PRD.md for details)

**Phase 1: Foundation (MVP)**
- User auth (optional guest mode), database, URL-based rooms, real-time sync

**Phase 2: Polish & Features**
- Leaderboards, bot opponents, enhanced UI, optional accounts

**Phase 3: Scale & Mobile**
- Mobile responsive, performance optimization, analytics

## Non-Functional Requirements

- **Latency:** < 50ms server response time for game updates
- **Uptime:** 99.5% availability target
- **Concurrent Users:** Support 100+ simultaneous games
- **Database:** Handle 10,000+ user accounts
- **Security:** OWASP Top 10 compliance
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest 2 versions)

## Technology Justification

**Why Socket.IO over raw WebSockets?**
- Auto-reconnection, fallback transports, room management built-in

**Why PostgreSQL over MongoDB?**
- Relational data (users, games, stats), ACID compliance, easier for structured queries

**Why Prisma?**
- Type-safe queries, auto-migrations, great DX with JavaScript

**Why Railway instead of Vercel?**
- WebSocket connections require persistent Node.js process (not serverless)
- Railway can serve static files AND run Socket.IO in same deployment
- Simpler deployment: one platform instead of coordinating two

---

## Notes for Claude Code

- This architecture locks in: Node.js, Express, Socket.IO, PostgreSQL, Prisma, Vercel/Railway
- Any changes to tech stack require explicit discussion
- Each feature implementation should reference this document
- Update architecture counter if fundamental changes are made
