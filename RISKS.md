# Ricochet Arena - Risk Assessment

**Last Updated:** 2025-10-15

## Critical Risks (Must Address Before Launch)

### 1. Real-Time Synchronization Complexity ⚠️ HIGH SEVERITY

**Risk:** Ball and paddle positions desynchronize between clients, causing unfair gameplay or visual glitches

**Why This Matters:**
- Core gameplay depends on precise collision detection
- Even 100ms desync makes the game unplayable
- Players will quit immediately if physics feel "wrong"

**Likelihood:** HIGH - Real-time multiplayer is technically challenging

**Mitigation Strategy:**
1. **Build sync prototype FIRST** (Week 1, Day 1-3)
   - Create minimal 2-player paddle sync before any other features
   - Test with artificial latency (100ms, 200ms, 500ms)
   - Validate ball position consistency between clients
2. **Use server-authoritative model**
   - Server runs game loop at 60 FPS
   - Server broadcasts ball position (not client prediction)
   - Clients interpolate between server updates
3. **Test early and often**
   - Test with players on different networks
   - Monitor latency in real-time during development
   - Record gameplay videos to spot desync issues

**De-risking Priority:** #1 - Build this before authentication, database, or UI

---

### 2. Database Data Not Available ⚠️ MEDIUM SEVERITY

**Risk:** PostgreSQL connection fails, or Railway database is unreachable during gameplay

**Why This Matters:**
- Users can't log in if database is down
- Game results lost if write fails
- Poor user experience if stats are inconsistent

**Likelihood:** MEDIUM - Cloud databases have downtime, network issues happen

**Mitigation Strategy:**
1. **Fail gracefully with clear errors**
   - Show "Database unavailable" message instead of generic error
   - Don't allow login attempts if DB is down
2. **Cache user data in server memory**
   - Keep authenticated users in memory during session
   - Don't query database on every game event
3. **Queue failed game writes for retry**
   - If game result write fails, queue it for retry
   - Log failures to monitoring system
4. **Use connection pooling**
   - Prisma handles this, but configure max connections appropriately
5. **Test database failure scenarios**
   - Manually disconnect database during game
   - Verify error messages are clear

**De-risking Priority:** #4 - Test during deployment phase

---

### 3. Data Format Mismatch ⚠️ MEDIUM SEVERITY

**Risk:** Frontend expects different data shape than backend provides (e.g., timestamps, nested objects)

**Why This Matters:**
- Causes runtime errors that break UI
- User sees blank screens or crashes
- Wastes time debugging in production

**Likelihood:** MEDIUM - Common in rapid development without strict contracts

**Mitigation Strategy:**
1. **Document API contracts in architecture.md**
   - Define exact JSON shape for every endpoint
   - Update document when format changes
2. **Use consistent timestamp format**
   - Server sends ISO 8601 strings
   - Frontend parses with `new Date()`
3. **Validate API responses in frontend**
   - Check for expected fields before using data
   - Show error if response is malformed
4. **Create data-schema.md file**
   - Document all database models
   - Show example API responses
   - Reference before implementing features

**De-risking Priority:** #3 - Create data-schema.md in Week 1

---

### 4. User Flow Different Than Designed ⚠️ LOW SEVERITY

**Risk:** Players find URL-sharing flow confusing or cumbersome

**Why This Matters:**
- Users might expect auto-matchmaking instead of manual sharing
- Copy/paste URL might be friction on mobile
- Room expiration might frustrate users

**Likelihood:** MEDIUM - URL sharing is familiar pattern (Zoom, Google Docs)

**Mitigation Strategy:**
1. **Start with simplest possible flow**
   - Phase 1: Create Room → Copy URL → Share → Play
   - No registration, no queues, no complexity
2. **Make URL copying obvious**
   - Big "Copy Link" button
   - Visual confirmation when copied
   - Show full URL so users can manually copy if needed
3. **Add auto-matchmaking only if requested**
   - Phase 2 feature based on user feedback
   - Monitor if users create rooms but no one joins
4. **Clear room status indicators**
   - "Waiting for player 2..." message
   - Show when player 2 joins
   - Auto-start countdown when both present

**De-risking Priority:** #5 - Test with real users after Phase 1
**Update:** Risk reduced by simplifying to URL-based rooms

---

### 5. Technical Components Don't Work Well Together ⚠️ MEDIUM SEVERITY

**Risk:** Socket.IO conflicts with Express, Prisma queries are slow, Vercel/Railway integration issues

**Why This Matters:**
- Wastes time debugging integration issues
- Might need to rewrite if fundamental incompatibility
- Delays launch significantly

**Likelihood:** LOW-MEDIUM - Chosen stack is proven, but integration always has surprises

**Mitigation Strategy:**
1. **Set up full stack skeleton first**
   - Deploy "Hello World" with Socket.IO + Express + Prisma + Railway
   - Validate deployment works before adding features
2. **Test database performance early**
   - Write game records in quick succession
   - Ensure < 50ms query time for user lookups
3. **Verify Vercel/Railway split works**
   - Test frontend on Vercel calling Railway WebSocket
   - Check CORS configuration
4. **Use proven libraries**
   - Socket.IO: Battle-tested for multiplayer games
   - Prisma: Well-documented with Express
   - JWT: Standard for Node.js auth

**De-risking Priority:** #2 - Deploy skeleton in Week 1

---

## Lower Priority Risks

### 6. Empty Rooms / No Opponent Available ⚠️ LOW SEVERITY

**Risk:** Player creates room but friend never joins, sits waiting indefinitely

**Mitigation:**
- Show clear status: "Share this link with a friend to start"
- Room expires after 1 hour of inactivity
- Phase 2: Add bot opponent option
- Phase 2: Add public matchmaking queue

**De-risking:** Monitor room creation vs game completion rate
**Update:** URL-based rooms eliminate matchmaking queue complexity

---

### 7. Security Vulnerabilities ⚠️ MEDIUM SEVERITY

**Risk:** SQL injection, XSS, session hijacking, score manipulation

**Mitigation:**
- Prisma prevents SQL injection by design
- Sanitize all user inputs (usernames, room codes)
- Use httpOnly cookies for JWT storage
- Server validates all game events before scoring
- Rate limit registration and API calls

**De-risking:** Security audit before public launch

---

### 8. Poor Mobile Experience ⚠️ LOW SEVERITY (Phase 1)

**Risk:** Game is unplayable on mobile devices

**Mitigation:**
- Desktop-only for Phase 1 (document clearly on login)
- Add mobile support in Phase 3 after core game stable
- Test on iPhone and Android before mobile launch

**De-risking:** Defer to Phase 3, focus on desktop first

---

### 9. Server Scaling Issues ⚠️ LOW SEVERITY (early on)

**Risk:** Server crashes with 100+ concurrent players

**Mitigation:**
- Start with 1 Railway instance (enough for 50-100 players)
- Monitor memory/CPU usage from Day 1
- Plan horizontal scaling after 500+ users
- Use Railway's auto-scaling when needed

**De-risking:** Launch with small user base, scale when needed

---

### 10. Cheat/Exploit Risk ⚠️ LOW SEVERITY (low stakes game)

**Risk:** Players manipulate client code to cheat scores

**Mitigation:**
- Server authority: All collision detection server-side
- Server validates score changes
- Disconnect players with impossible inputs (paddle position out of bounds)
- Log suspicious behavior for review

**De-risking:** Server-side validation from Day 1

---

## Risk Priority for Development Order

**Week 1 Focus (De-risk Critical Path):**
1. ✅ Real-time sync prototype (Risk #1)
2. ✅ Deploy full stack skeleton to Railway/Vercel (Risk #5)
3. ✅ Create data-schema.md (Risk #3)

**Week 2 Focus:**
4. ✅ Test database failure handling (Risk #2)
5. ✅ User flow testing with friends (Risk #4)

**Week 3 Focus:**
6. ✅ Security review (Risk #7)
7. ✅ Monitor queue times (Risk #6)

---

## Red Flags to Watch For

🚩 **If you see any of these, STOP and reassess:**

1. **Desync happening frequently in testing**
   - Don't add features, fix sync first

2. **Database queries taking > 500ms**
   - Investigate indexes, optimize before continuing

3. **Deployment failing repeatedly**
   - Validate Railway/Vercel config before building more

4. **Users confused by flow in testing**
   - Simplify UX before adding features

5. **Server memory growing unbounded**
   - Find memory leak before scaling up

---

## Testing Checklist (Before Each Phase)

**Phase 1 Pre-Launch:**
- [ ] 2 players in separate locations play full game
- [ ] Test with 250ms artificial latency
- [ ] Database disconnect during game (verify error handling)
- [ ] Register 10 test accounts rapidly (verify no conflicts)
- [ ] Load test: 10 simultaneous games
- [ ] Try to inject SQL in username field
- [ ] Try to send impossible paddle position from client
- [ ] Test on Chrome, Firefox, Safari

**Phase 2 Pre-Launch:**
- [ ] Bot opponent plays full game without errors
- [ ] Leaderboard updates correctly after 100 games
- [ ] Chat messages are sanitized (try XSS attack)

**Phase 3 Pre-Launch:**
- [ ] Mobile touch controls work on iPhone and Android
- [ ] Reconnection works after airplane mode toggle
- [ ] Server handles 100+ concurrent games

---

## Assumptions That Could Be Wrong

1. **Assumption:** 60 FPS game loop is sufficient for smooth gameplay
   - **Risk:** Might need 120 FPS for competitive feel
   - **Validation:** Test with gamers, gather feedback

2. **Assumption:** Players want competitive ranked play
   - **Risk:** Might prefer casual fun with friends
   - **Validation:** Track private room usage vs quick match

3. **Assumption:** First to 50 points is right length
   - **Risk:** Games might feel too long (10-15 min?)
   - **Validation:** Track average game duration, adjust if needed

4. **Assumption:** PostgreSQL is fast enough for real-time queries
   - **Risk:** Might need Redis for session management
   - **Validation:** Load test with 100 concurrent users

5. **Assumption:** Railway can handle both static files and WebSocket traffic
   - **Risk:** Might need CDN for static assets at scale
   - **Validation:** Monitor response times and bandwidth usage

---

## Success Metrics for Risk Management

- **Sync Quality:** < 1% of games report desync issues
- **Database Reliability:** 99.5% uptime, < 100ms query time
- **User Flow:** > 80% completion rate from registration to first game
- **Performance:** < 100ms average latency for game updates
- **Security:** Zero successful exploits in first month

---

## Final Notes

**Philosophy:**
- Fail fast, fail loud, fail specific
- Build risky parts first
- Test with real conditions (latency, mobile, bad inputs)
- Don't add features until core gameplay is solid

**Most Dangerous Pattern:**
Silent failures that let players continue with wrong data - always prefer visible errors over incorrect state.
