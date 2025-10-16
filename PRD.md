# Ricochet Arena - Product Requirements Document

**Version:** 1.0
**Last Updated:** 2025-10-15
**Product Owner:** User
**Target Launch:** Phase 1 MVP

## Vision Statement

Ricochet Arena is an accessible, competitive online multiplayer Pong game where players worldwide compete in real-time matches with curved paddles and destructible obstacles. Players track their progress, climb leaderboards, and experience intense matches to 50 points - all playable instantly in a browser.

## Success Metrics

- **Engagement:** Average session time > 10 minutes
- **Retention:** 40% of users return within 7 days
- **Performance:** < 100ms average latency for game updates
- **Adoption:** 100+ registered users in first month
- **Quality:** < 5% error rate in matchmaking/gameplay

## Development Stages

---

## Phase 1: MVP - Core Multiplayer (Weeks 1-3)

**Goal:** Launch playable online multiplayer with accounts and matchmaking

### User Stories

#### Authentication & Onboarding
- **As a new user**, I want to create an account with username/password so I can save my game history
- **As a returning user**, I want to log in quickly so I can start playing immediately
- **As a casual player**, I want to play as a guest without creating an account so I can try the game first
- **As a security-conscious user**, I want my password to be securely stored so my account stays safe

#### Room Creation & Joining
- **As a player**, I want to click "Create Game" and get a shareable URL so I can invite a friend
- **As a player**, I want to copy the room URL to my clipboard so I can easily share it
- **As a player waiting**, I want to see "Waiting for player 2..." so I know the room is active
- **As a friend**, I want to visit a room URL and join instantly so I can play with minimal friction
- **As both players**, I want a countdown before the game starts so we can both prepare

#### Core Gameplay
- **As a player**, I want to control my paddle smoothly with keyboard so I can play effectively
- **As a player**, I want to see the ball and paddles move in real-time so the game feels responsive
- **As a player**, I want to score points when the ball passes my opponent so I can win
- **As a player**, I want to score points when I hit obstacles so I have additional strategy
- **As a player**, I want the game to end at 50 points so matches have clear winners
- **As a player**, I want to see my opponent's username and score so I know who I'm playing

#### Post-Game & History
- **As a winning player**, I want to see a victory screen so I feel accomplished
- **As a losing player**, I want to see the final score so I know how close I was
- **As a player**, I want to view my past games with dates and scores so I can track progress
- **As a player**, I want to see my win/loss record so I can measure improvement

### Technical Requirements (Phase 1)

1. **Backend Server**
   - Node.js + Express REST API
   - Socket.IO WebSocket server
   - PostgreSQL database with Prisma ORM
   - JWT authentication (optional for guest mode)

2. **Database Tables**
   - Users (username, email, password_hash, stats) - optional for Phase 1
   - Games (players, scores, winner, timestamp)
   - Rooms (room_id, created_at, expires_at) - in-memory only

3. **Frontend**
   - Main menu with "Create Game" button
   - Room waiting screen with shareable URL
   - "Copy Link" button with clipboard API
   - Game canvas (modified pong.html)
   - Post-game summary screen

4. **Room System**
   - Generate random 6-character room IDs
   - URL format: `/game/:roomId`
   - Rooms expire after 1 hour unused
   - First player to join is player 1 (left side)
   - Second player to join is player 2 (right side)

5. **Game Synchronization**
   - Server-authoritative ball physics
   - Client sends paddle positions (60 FPS)
   - Server broadcasts game state (60 FPS)
   - Win condition: First to 50 points

6. **Deployment**
   - Railway: All-in-one (static files + WebSocket server + PostgreSQL)

### Out of Scope (Phase 1)
- User accounts (defer to Phase 2, use guest mode)
- Leaderboards
- Chat system
- Bot opponents
- Mobile responsive design
- Replay system

---

## Phase 2: Polish & Engagement (Weeks 4-6)

**Goal:** Add features that increase retention and competitiveness

### User Stories

#### Leaderboards & Competition
- **As a competitive player**, I want to see top players ranked by wins so I can see where I stand
- **As a player**, I want to see global statistics so I understand the community
- **As a player**, I want to view another player's profile so I can see their record

#### Communication
- **As a player**, I want to send quick emotes during matches so I can react to plays
- **As a friendly player**, I want to send "Good game!" after matches so I can be sportsmanlike
- **As a player**, I want an optional text chat so I can communicate with opponents

#### AI Opponent
- **As a solo player**, I want to play against a bot if no humans are available so I can practice
- **As a new player**, I want to play bots to learn before playing real opponents
- **As a player**, I want adjustable bot difficulty so I can choose my challenge

#### Enhanced UI
- **As a player**, I want smooth animations and transitions so the game feels polished
- **As a player**, I want to customize my paddle color so I can personalize my experience
- **As a player**, I want sound effects for hits and scores so the game is more engaging

### Technical Requirements (Phase 2)

1. **Leaderboard System**
   - Daily/weekly/all-time rankings
   - Efficient queries with pagination
   - Cached leaderboard updates

2. **Bot AI**
   - Simple AI: Follows ball Y position with delay
   - Medium AI: Predicts ball trajectory
   - Hard AI: Near-perfect predictions with small error

3. **Communication**
   - Socket.IO events for emotes
   - Optional text chat with profanity filter
   - Message rate limiting

4. **UI Enhancements**
   - CSS animations for transitions
   - Particle effects for big moments
   - Sound library (Web Audio API)

---

## Phase 3: Scale & Accessibility (Weeks 7-8)

**Goal:** Reach wider audience and handle growth

### User Stories

#### Mobile Experience
- **As a mobile user**, I want to play on my phone so I can play anywhere
- **As a tablet user**, I want touch controls so I can play without a keyboard
- **As a mobile player**, I want vertical orientation support so I can play one-handed

#### Performance & Reliability
- **As a player**, I want the game to reconnect automatically if my internet drops so I don't lose progress
- **As a player in a long match**, I want the server to never crash so my game isn't interrupted
- **As a player with slow internet**, I want lag compensation so the game still feels fair

#### Accessibility
- **As a colorblind player**, I want high-contrast mode so I can see all elements clearly
- **As a keyboard-only user**, I want full keyboard navigation so I can use the entire app
- **As a screen reader user**, I want proper ARIA labels so I can navigate menus

### Technical Requirements (Phase 3)

1. **Mobile Support**
   - Touch controls for paddle movement
   - Responsive CSS for all screen sizes
   - Performance optimization for mobile devices

2. **Reliability**
   - Auto-reconnect with state recovery
   - Server health monitoring
   - Horizontal scaling (multiple game servers)

3. **Analytics**
   - Game completion rate
   - Average match duration
   - User retention metrics
   - Error logging and monitoring

---

## Minimum Scope Recommendations

To ship faster, start with **Phase 1 Ultra-Lite**:

1. ✅ Guest mode only (no accounts)
2. ✅ URL-based rooms (no matchmaking)
3. ✅ Basic real-time gameplay
4. ✅ Win condition (first to 50)
5. ✅ Simple post-game screen with "Play Again" → generates new room

**Estimated effort:** 3-5 days for solo developer

This gets a playable multiplayer game online FAST, then add accounts/stats in Phase 2 based on user feedback.

---

## Risk Mitigation Priority

Based on RISKS.md, prioritize de-risking:

1. **Week 1:** Real-time synchronization prototype
   - Build minimal 2-player sync before adding features
   - Validate latency and physics consistency

2. **Week 2:** Matchmaking with timeout handling
   - Test queue with no available players
   - Implement 30-second timeout with notification

3. **Week 3:** Database & deployment
   - Set up Railway/Vercel early
   - Test production environment before feature work

---

## Feature Details

### Win Condition: First to 50 Points

**Current:** Games run indefinitely until player leaves
**New:** Game automatically ends when player reaches 50 points

**Scoring System:**
- Ball passes opponent paddle: +1 point to other player
- Player destroys obstacle (must have last touched ball): +1 point

**Win Screen Shows:**
- "Player X Wins!"
- Final score (e.g., 50-42)
- Match duration
- Obstacles destroyed count
- Options: View Stats | Play Again | Main Menu

### Game History Storage

**What to Track:**
- Player usernames (both)
- Final scores
- Winner
- Match start/end timestamps
- Total match duration
- Obstacles destroyed
- (Optional Phase 2) Game events for replay

**Display Format:**
```
Match History (Most Recent First)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Oct 15, 2025 - 3:42 PM
You (50) vs. SpeedyPaddle (42)
Duration: 4m 23s | Obstacles: 18
Result: VICTORY 🏆
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Guest Username System (Phase 1)

**Requirements:**
- Auto-generated or player-chosen per session
- Format: "Player_XXXX" (random 4 digits) if not provided
- Optional: Player can type a nickname before joining room
- No persistence - regenerated each session
- No uniqueness enforcement

**Display Locations:**
- In-game HUD (top of screen)
- Post-game summary

**Phase 2: Persistent Accounts**
- Add registration with unique usernames
- Link game history to accounts
- Leaderboards

---

## Open Questions & Decisions Needed

1. **Guest Mode vs Accounts:** Start with guest-only or add accounts in Phase 1?
   - **Decision:** Guest-only for Phase 1 - simpler, faster to launch
   - Accounts added in Phase 2 if users request stats/history

2. **Reconnection Handling:** If player disconnects mid-game, what happens?
   - **Recommendation:** 30-second grace period, then forfeit
   - Grace period lets player refresh or reconnect

3. **Rematch Feature:** Allow instant rematch with same opponent?
   - **Recommendation:** "Play Again" generates new room URL
   - Players must share new link (keeps rooms clean)

4. **Room ID Format:** Random 6-character code?
   - **Decision:** Use nanoid or similar (e.g., "X3kP9m")
   - URL-safe, collision-resistant

5. **Room Expiration:** How long should empty rooms persist?
   - **Recommendation:** 1 hour for empty rooms, delete immediately after game ends
   - Prevents memory leaks on server

---

## Success Criteria for Phase 1 Launch

- [ ] Player can create room and get shareable URL
- [ ] Second player can join via URL instantly
- [ ] Game runs smoothly with < 100ms latency
- [ ] Game ends when player reaches 50 points
- [ ] Post-game shows winner and final scores
- [ ] "Play Again" generates new room
- [ ] No critical bugs in 10 test games
- [ ] Successfully deployed to Railway
- [ ] Works on Chrome, Firefox, Safari

---

## Post-Launch Iteration Plan

**Week 1-2 After Launch:**
- Monitor error logs and server performance
- Gather user feedback on matchmaking wait times
- Track match completion rate (do players finish games?)

**Week 3-4 After Launch:**
- Add most-requested feature from user feedback
- Implement leaderboard if competition is high
- Add bot opponents if matchmaking is slow

---

## Notes

- All fake data must be clearly labeled (e.g., "TEST_PLAYER", "#FAKE_GAME")
- No cross-contamination between user data (strict user_id checks)
- Server validates all game events - client cannot cheat scores
- Focus on fun first, polish second
