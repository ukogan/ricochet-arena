# Ricochet Arena - Local Testing Guide

## ✅ What's Been Built

**Backend:**
- ✅ Express server with Socket.IO
- ✅ Room creation and management
- ✅ Server-authoritative game physics (60 FPS)
- ✅ Paddle collision detection with curve effect
- ✅ Obstacle collision and scoring
- ✅ Win condition (first to 50 points)

**Frontend:**
- ✅ Main menu with nickname input
- ✅ Waiting room with copy link functionality
- ✅ Game canvas with Three.js rendering
- ✅ Real-time game state synchronization
- ✅ HUD with scores and player names
- ✅ Game over screen with stats
- ✅ Disconnect handling

## 🧪 Testing Locally (2 Browser Windows)

### Step 1: Start the Server
```bash
npm start
```
Server should show:
```
🎮 Ricochet Arena server running on port 3001
📡 WebSocket server ready
🌐 Visit http://localhost:3001 to play
```

### Step 2: Open Player 1 Window
1. Open Chrome/Firefox
2. Go to: `http://localhost:3001`
3. (Optional) Enter a nickname (e.g., "Alice")
4. Click **"Create Game"**
5. You should see:
   - "Room Created!" message
   - A room URL (e.g., `http://localhost:3001/game/X3kP9m`)
   - **"Copy Link"** button
   - Your player card on the left
   - "Waiting..." card on the right

### Step 3: Open Player 2 Window
1. Open a **new browser window** (or incognito window)
2. **Copy the room URL** from Player 1's screen
3. **Paste and visit** that URL
4. Both players should see:
   - "Get Ready!" countdown (3... 2... 1...)
   - Game starts automatically

### Step 4: Play the Game

**Player 1 (Left Paddle):**
- Press `W` to move up
- Press `S` to move down

**Player 2 (Right Paddle):**
- Press `↑` arrow to move up
- Press `↓` arrow to move down

**Gameplay:**
- White ball bounces around
- Red obstacles move and spin
- Hit ball with paddle (curved paddles add spin!)
- Destroy obstacles for +1 point
- Ball past opponent's paddle = +1 point for you
- **First to 50 points wins!**

### Step 5: Test Win Condition
- Play until someone reaches 50 points
- Should see "Victory!" or "Defeat" screen
- Final scores displayed
- Game duration and obstacles destroyed shown
- Click **"Play Again"** to return to main menu

## ✅ Testing Checklist

- [ ] Main menu loads at `http://localhost:3001`
- [ ] Create Game button generates a room
- [ ] Room URL is displayed and copyable
- [ ] Second player can join via the URL
- [ ] Both players see countdown (3-2-1)
- [ ] Game starts automatically
- [ ] Ball appears and moves
- [ ] Paddles respond to keyboard (W/S and arrows)
- [ ] Obstacles appear and move
- [ ] Ball bounces off paddles
- [ ] Ball bounces off obstacles
- [ ] Scores update when ball passes paddle
- [ ] Scores update when obstacle is destroyed
- [ ] Game ends at 50 points
- [ ] Game over screen shows winner correctly
- [ ] Stats (duration, obstacles) are accurate
- [ ] Play Again returns to main menu

## 🐛 Common Issues

### "Port 3001 already in use"
```bash
lsof -ti:3001 | xargs kill -9
npm start
```

### "Room not found" error
- Room may have expired (1 hour timeout)
- Create a new room

### Paddles not moving
- Check console for errors
- Make sure game has started (not still in waiting/countdown)
- Try clicking on the game canvas to focus it

### Ball/obstacles not visible
- Check browser console for Three.js errors
- Try refreshing both windows

### High latency / laggy
- This is running locally, should be < 10ms
- Check server console for errors
- Try closing other applications

## 📊 Expected Performance

**Local Testing:**
- Latency: < 10ms
- Frame rate: 60 FPS
- No desync issues

**Server Logs:**
You should see messages like:
```
✅ Client connected: abc123
🎮 Room created: X3kP9m by Alice
👥 Player 2 joined room: X3kP9m
✓ Player ready: Alice in room X3kP9m
✓ Player ready: Bob in room X3kP9m
🎯 Game started in room: X3kP9m
```

## 🎯 Next Steps After Local Testing

1. **If everything works:**
   - ✅ Ready to deploy to Railway!
   - See deployment instructions in README.md

2. **If you find bugs:**
   - Check browser console (F12)
   - Check server console
   - Document the issue
   - Fix before deploying

## 🚀 Deploy to Railway

Once local testing is successful:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up

# Get URL
railway domain
```

Your game will be live at: `https://your-app.railway.app`

## 📝 Notes

- Game runs at 60 FPS server-side
- All physics are server-authoritative (no cheating!)
- Rooms expire after 1 hour if unused
- No database needed for Phase 1 (all in-memory)
- Accounts and stats coming in Phase 2

---

**Ready to test?** Run `npm start` and open `http://localhost:3001`! 🎮
