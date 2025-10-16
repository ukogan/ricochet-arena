const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const socketHandler = require('./socket/socketHandler');

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS || '*',
    methods: ['GET', 'POST']
  }
});

// Middleware - disable strict security for local development
const isDevelopment = process.env.NODE_ENV === 'development';

if (isDevelopment) {
  // Minimal security for local dev
  app.use(helmet({
    contentSecurityPolicy: false,
    hsts: false
  }));
} else {
  // Full security for production
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"]
      }
    }
  }));
}
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Serve game page with room ID
app.get('/game/:roomId', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/game.html'));
});

// Initialize Socket.IO handlers
socketHandler(io);

// Start server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 Ricochet Arena server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🌐 Local:   http://localhost:${PORT}`);

  // Get network IP addresses
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`🌐 Network: http://${iface.address}:${PORT}`);
      }
    });
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
