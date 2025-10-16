# Ricochet Arena

**Competitive online multiplayer Pong with curved paddles and destructible obstacles**

🎮 Play instantly in your browser • 🔗 Share a link to challenge friends • 🏆 First to 50 points wins

---

## What is Ricochet Arena?

Ricochet Arena is a fast-paced, competitive Pong game featuring:

- **Curved Paddles:** Hit the ball at different points on your paddle to add spin and curve
- **Destructible Obstacles:** Moving geometric shapes that bounce the ball and award points when destroyed
- **Particle Effects:** Visual feedback on every hit
- **Real-Time Multiplayer:** Smooth 60 FPS gameplay synchronized across the internet
- **URL-Based Rooms:** No accounts or matchmaking queues - just create a room and share the link

---

## Quick Start

### For Players

1. Visit the game URL (deployed site)
2. Click "Create Game"
3. Copy the room URL and send it to a friend
4. Wait for them to join
5. Game starts automatically - first to 50 points wins!

**Controls:**
- Player 1 (Left): `W` / `S` keys
- Player 2 (Right): `↑` / `↓` arrow keys

---

## For Developers

### Project Structure

```
bouncing_ball/
├── README.md              ← You are here
├── architecture.md        ← System design and tech stack
├── PRD.md                 ← Product requirements and user stories
├── RISKS.md               ← Risk assessment and mitigation
├── data-schema.md         ← Database schema and API contracts
│
├── index.html             ← Bouncing ball game (separate project)
├── pong.html              ← Original local 2-player pong
│
├── client/                ← Frontend (to be created)
│   ├── index.html
│   ├── game.html
│   ├── css/
│   └── js/
│
├── server/                ← Backend (to be created)
│   ├── index.js
│   ├── socket/
│   ├── routes/
│   └── models/
│
└── prisma/                ← Database (Phase 2)
    └── schema.prisma
```

### Tech Stack

**Frontend:**
- HTML5 Canvas / Three.js (3D rendering)
- Vanilla JavaScript (game logic)
- Socket.IO Client (WebSocket communication)

**Backend:**
- Node.js + Express (HTTP server)
- Socket.IO Server (WebSocket server)
- PostgreSQL + Prisma (database - Phase 2)

**Deployment:**
- Railway: All-in-one (static files, WebSocket server, database)

---

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone repository
git clone <repo-url>
cd bouncing_ball

# Install dependencies (after package.json is created)
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations (Phase 2)
npx prisma migrate dev

# Start development server
npm run dev
```

### Development Commands

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests (Phase 2)
npm run lint         # Check code style
```

---

## Development Phases

### Phase 1: MVP (Current) - 3-5 Days

**Goal:** Launch playable online multiplayer

- ✅ Documentation complete
- ⏳ URL-based room system
- ⏳ Real-time multiplayer sync
- ⏳ Guest mode (no accounts)
- ⏳ Win condition (first to 50)
- ⏳ Deploy to Railway

**Launch Criteria:**
- 2 players can create/join rooms via URL
- Game runs with < 100ms latency
- Game ends at 50 points
- No critical bugs in 10 test games

### Phase 2: Accounts & Stats - 1-2 Weeks

- User registration and login
- Persistent game history
- Leaderboards
- Bot opponents
- Enhanced UI/animations

### Phase 3: Scale & Mobile - 1-2 Weeks

- Mobile responsive design
- Touch controls
- Performance optimization
- Analytics and monitoring

---

## Key Design Decisions

### Why URL-Based Rooms Instead of Matchmaking?

**Advantages:**
- ✅ Simpler to implement (no queue management)
- ✅ Play with specific friends easily
- ✅ No account required for Phase 1
- ✅ Familiar pattern (Zoom, Google Docs)

**Trade-offs:**
- ❌ Can't play with random opponents (Phase 2 feature)
- ❌ Both players need to coordinate joining

### Why Guest Mode First?

**Advantages:**
- ✅ Zero friction - play immediately
- ✅ Faster MVP launch
- ✅ Test core gameplay before building accounts

**Trade-offs:**
- ❌ No stats or history
- ❌ No persistent identity

Accounts added in Phase 2 based on user demand.

### Why Server-Authoritative Physics?

**Advantages:**
- ✅ Prevents cheating
- ✅ Consistent game state across clients
- ✅ Easier lag compensation

**Trade-offs:**
- ❌ Requires more server CPU
- ❌ Slightly higher latency than client-side prediction

This is the standard approach for competitive multiplayer games.

---

## Documentation Guide

### For Product Planning
- **[PRD.md](PRD.md):** User stories, features, and development stages
- **[RISKS.md](RISKS.md):** Risk assessment and de-risking strategies

### For Development
- **[architecture.md](architecture.md):** System design, tech stack, file structure
- **[data-schema.md](data-schema.md):** Database schema, API contracts, WebSocket events

### For Features
- `features/` folder: Detailed documentation for each major feature (to be created during implementation)

---

## Contributing

This is currently a solo project, but contributions are welcome in Phase 2.

### Development Workflow (Claude Code Guidelines)

1. **Never commit directly to main** - Always use feature branches
2. **Required checks before merge:**
   ```bash
   npm run lint
   npm test
   npm run build
   ```
3. **Branch naming:** `feature/add-room-system`, `fix/sync-desync`
4. **Commit messages:** Conventional commits (e.g., `feat(socket): add room creation`)
5. **PR requirements:** Summary, test plan, link to issues

See [CLAUDE.md](CLAUDE.md) for full Claude Code workflow.

---

## Testing

### Manual Testing Checklist

**Room Creation:**
- [ ] Click "Create Game" generates unique room ID
- [ ] Room URL is shown and copyable
- [ ] URL contains correct room ID

**Joining:**
- [ ] Second player can visit URL and join
- [ ] Both players see "Game starting..." countdown
- [ ] Game doesn't start with only 1 player

**Gameplay:**
- [ ] Paddle controls work smoothly for both players
- [ ] Ball bounces correctly off paddles
- [ ] Ball bounces correctly off obstacles
- [ ] Obstacles move and rotate
- [ ] Scoring works (goals + obstacles)
- [ ] Game ends at 50 points

**Post-Game:**
- [ ] Winner is announced correctly
- [ ] Final scores are accurate
- [ ] "Play Again" generates new room

**Edge Cases:**
- [ ] Third player visiting room URL sees "Room full"
- [ ] Player disconnecting mid-game triggers opponent notification
- [ ] Room expires after 1 hour unused

---

## Performance Targets

- **Latency:** < 100ms for game state updates
- **Frame Rate:** 60 FPS on both client and server
- **Room Capacity:** 100+ concurrent games on single Railway instance
- **Browser Support:** Chrome, Firefox, Safari (latest 2 versions)

---

## Deployment

### Railway (All-in-One)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and link project
railway login
railway link

# Deploy
railway up
```

### Environment Variables

**Railway:**
```
DATABASE_URL=postgresql://...  # Phase 2, Railway provides this
PORT=3001
NODE_ENV=production
JWT_SECRET=<random-secret>  # Phase 2
```

### Railway Configuration

Railway automatically:
- Detects Node.js project
- Installs dependencies (`npm install`)
- Runs start script (`npm start`)
- Serves static files from Express
- Provides PostgreSQL addon (Phase 2)

---

## Troubleshooting

### "Room not found" error
- Room may have expired (1 hour timeout)
- Check room ID in URL is correct
- Try creating a new room

### High latency / laggy gameplay
- Check network connection
- Try server closer to both players (future: multi-region)
- Verify server isn't overloaded

### Ball/paddle desync
- This is a critical bug - report immediately
- Refresh both players' browsers
- Check server logs for physics errors

---

## Project Timeline

- **Oct 15, 2025:** Project kickoff, documentation complete
- **Oct 16-17:** Backend setup, room system implementation
- **Oct 18-19:** Real-time sync and game logic
- **Oct 20:** Testing, bug fixes, deployment
- **Oct 21:** Phase 1 MVP launch 🚀

---

## Links

- **Documentation:** See files in this directory
- **Live Site:** (To be added after deployment)
- **Railway Project:** (To be added)
- **Vercel Project:** (To be added)

---

## License

(To be determined)

---

## Credits

**Original Pong Game:** Based on `pong.html` local multiplayer prototype
**Development:** (Your name/team)
**Tools:** Built with Claude Code

---

## Notes for Future Development

### Phase 2 Priorities (Based on User Feedback)

1. **If users complain about finding opponents:**
   - Add public matchmaking queue
   - Add bot opponents

2. **If users want stats:**
   - Add user accounts
   - Track game history
   - Build leaderboards

3. **If mobile users struggle:**
   - Prioritize mobile responsive design
   - Add touch controls

### Performance Monitoring

Track these metrics after launch:
- Room creation rate
- Game completion rate (created vs finished)
- Average game duration
- Player retention (return visits)
- Error rates

### Security Todos (Before Public Launch)

- [ ] Rate limit room creation (prevent spam)
- [ ] Validate all client inputs server-side
- [ ] Add CORS configuration
- [ ] Set up error logging and monitoring
- [ ] Implement reconnection grace period

---

**Ready to build? Start with:** `npm run setup` (after setup script is created)
