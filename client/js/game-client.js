// Get room ID from URL
const pathParts = window.location.pathname.split('/');
const roomId = pathParts[pathParts.length - 1];

// Initialize Socket.IO
const socket = io();

// Game state
let playerSide = null;
let player1Name = '';
let player2Name = '';
let isGameActive = false;

// Three.js variables
let scene, camera, renderer;
let ball, paddle1, paddle2;
let obstacles = [];
const obstacleMap = new Map();

// Game constants (must match server)
const FIELD_WIDTH = 16;
const FIELD_HEIGHT = 10;
const PADDLE_HEIGHT = 2.5;
const PADDLE_WIDTH = 0.3;
const BALL_RADIUS = 0.2;

// Keyboard input
const keys = {};

// DOM Elements
const waitingScreen = document.getElementById('waitingScreen');
const countdownScreen = document.getElementById('countdownScreen');
const gameScreen = document.getElementById('gameScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const disconnectScreen = document.getElementById('disconnectScreen');

const roomUrlInput = document.getElementById('roomUrl');
const copyBtn = document.getElementById('copyBtn');
const copyStatus = document.getElementById('copyStatus');
const countdownNumber = document.getElementById('countdownNumber');

const player1NameDisplay = document.getElementById('player1Name');
const player1NameHud = document.getElementById('player1NameHud');
const player2NameHud = document.getElementById('player2NameHud');
const score1Display = document.getElementById('score1');
const score2Display = document.getElementById('score2');

const playAgainBtn = document.getElementById('playAgainBtn');
const mainMenuBtn = document.getElementById('mainMenuBtn');
const disconnectMenuBtn = document.getElementById('disconnectMenuBtn');

// Initialize
function init() {
    // Set room URL
    roomUrlInput.value = window.location.href;

    // Copy button
    copyBtn.addEventListener('click', copyRoomUrl);

    // Menu buttons
    playAgainBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    mainMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });
    disconnectMenuBtn.addEventListener('click', () => {
        window.location.href = '/';
    });

    // Keyboard input
    window.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
    window.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

    // Setup Three.js
    setupThreeJS();

    // Handle resize
    window.addEventListener('resize', onWindowResize);

    // Join room
    const nickname = localStorage.getItem('nickname') || '';
    socket.emit('join_room', { room_id: roomId, nickname });
}

function copyRoomUrl() {
    roomUrlInput.select();
    navigator.clipboard.writeText(roomUrlInput.value).then(() => {
        copyStatus.textContent = '✅ Link copied!';
        copyBtn.textContent = '✅ Copied!';

        setTimeout(() => {
            copyStatus.textContent = '';
            copyBtn.textContent = '📋 Copy Link';
        }, 2000);
    });
}

function setupThreeJS() {
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001a00);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 12);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('gameCanvas'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Field
    const fieldGeometry = new THREE.PlaneGeometry(FIELD_WIDTH, FIELD_HEIGHT);
    const fieldMaterial = new THREE.MeshBasicMaterial({
        color: 0x003300,
        side: THREE.DoubleSide
    });
    const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
    field.position.z = -0.1;
    scene.add(field);

    // Center line
    const lineGeometry = new THREE.PlaneGeometry(0.1, FIELD_HEIGHT);
    const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        opacity: 0.3,
        transparent: true
    });
    const centerLine = new THREE.Mesh(lineGeometry, lineMaterial);
    scene.add(centerLine);

    // Ball
    const ballGeometry = new THREE.CircleGeometry(BALL_RADIUS, 32);
    const ballMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide
    });
    ball = new THREE.Mesh(ballGeometry, ballMaterial);
    scene.add(ball);

    // Paddles
    paddle1 = createCurvedPaddle(-FIELD_WIDTH / 2 + PADDLE_WIDTH);
    paddle2 = createCurvedPaddle(FIELD_WIDTH / 2 - PADDLE_WIDTH);
    scene.add(paddle1);
    scene.add(paddle2);
}

function createCurvedPaddle(x) {
    const paddleGroup = new THREE.Group();
    const segments = 24;
    const segmentHeight = PADDLE_HEIGHT / segments;
    const PADDLE_CURVE = 0.5;

    for (let i = 0; i < segments; i++) {
        const segmentGeometry = new THREE.PlaneGeometry(PADDLE_WIDTH, segmentHeight);
        const segmentMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            side: THREE.DoubleSide
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);

        const yPos = (i - segments / 2 + 0.5) * segmentHeight;
        segment.position.y = yPos;

        // Curve calculation
        const normalizedY = yPos / (PADDLE_HEIGHT / 2);
        const curveOffset = PADDLE_CURVE * (normalizedY * normalizedY);
        segment.position.z = curveOffset;

        paddleGroup.add(segment);
    }

    paddleGroup.position.x = x;
    return paddleGroup;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function showScreen(screen) {
    [waitingScreen, countdownScreen, gameScreen, gameOverScreen, disconnectScreen].forEach(s => {
        s.classList.remove('active');
    });
    screen.classList.add('active');
}

function updatePaddleInput() {
    if (!isGameActive || !playerSide) return;

    let movement = 0;
    const paddleSpeed = 0.12;

    if (playerSide === 'left') {
        if (keys['w']) movement = paddleSpeed;
        if (keys['s']) movement = -paddleSpeed;
    } else if (playerSide === 'right') {
        if (keys['arrowup']) movement = paddleSpeed;
        if (keys['arrowdown']) movement = -paddleSpeed;
    }

    if (movement !== 0) {
        const paddle = playerSide === 'left' ? paddle1 : paddle2;
        const newY = paddle.position.y + movement;

        // Clamp to bounds
        const maxY = FIELD_HEIGHT / 2 - PADDLE_HEIGHT / 2;
        const clampedY = Math.max(-maxY, Math.min(maxY, newY));

        paddle.position.y = clampedY;

        // Send to server
        socket.emit('paddle_move', { y: clampedY, timestamp: Date.now() });
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (isGameActive) {
        updatePaddleInput();
    }

    renderer.render(scene, camera);
}

// Socket event handlers
socket.on('connect', () => {
    console.log('✅ Connected to server');
});

socket.on('room_joined', (data) => {
    console.log('Room joined:', data);
    playerSide = data.your_side;
    player1Name = data.nickname;
    player1NameDisplay.textContent = player1Name;
    player1NameHud.textContent = player1Name;
});

socket.on('player_joined', (data) => {
    console.log('Both players joined:', data);
    player1Name = data.player1.nickname;
    player2Name = data.player2.nickname;

    player1NameDisplay.textContent = player1Name;
    player1NameHud.textContent = player1Name;
    player2NameHud.textContent = player2Name;

    // If playerSide wasn't set yet (we're player 2), we must be right
    if (!playerSide) {
        playerSide = 'right';
    }

    console.log('My side:', playerSide, 'Player 1:', player1Name, 'Player 2:', player2Name);

    // Both players present, mark ready
    setTimeout(() => {
        socket.emit('player_ready');
    }, 500);
});

socket.on('countdown', (data) => {
    showScreen(countdownScreen);
    countdownNumber.textContent = data.count;
});

socket.on('game_start', (data) => {
    console.log('Game started:', data);
    isGameActive = true;
    showScreen(gameScreen);
});

socket.on('game_state', (data) => {
    // Update ball
    ball.position.set(data.ball.x, data.ball.y, 0);

    // Update paddles
    paddle1.position.y = data.paddle1_y;
    paddle2.position.y = data.paddle2_y;

    // Update scores
    score1Display.textContent = data.scores.left;
    score2Display.textContent = data.scores.right;

    // Update obstacles
    updateObstacles(data.obstacles);
});

function updateObstacles(obstaclesData) {
    // Remove obstacles that no longer exist
    for (const [id, obstacleMesh] of obstacleMap.entries()) {
        if (!obstaclesData.find(o => o.id === id)) {
            scene.remove(obstacleMesh);
            obstacleMap.delete(id);
        }
    }

    // Update or create obstacles
    for (const obsData of obstaclesData) {
        let obstacleMesh = obstacleMap.get(obsData.id);

        if (!obstacleMesh) {
            // Create new obstacle
            const geometry = new THREE.CircleGeometry(obsData.radius, obsData.shape);
            const material = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                side: THREE.DoubleSide
            });
            obstacleMesh = new THREE.Mesh(geometry, material);
            scene.add(obstacleMesh);
            obstacleMap.set(obsData.id, obstacleMesh);
        }

        // Update position and rotation
        obstacleMesh.position.set(obsData.x, obsData.y, 0.1);
        obstacleMesh.rotation.z = obsData.rotation;
    }
}

socket.on('score_update', (data) => {
    console.log('Score update:', data);
    // Scores are already updated in game_state
});

socket.on('game_over', (data) => {
    console.log('Game over:', data);
    isGameActive = false;

    // Show game over screen
    const youWon = (playerSide === data.winner.side);
    document.getElementById('gameoverTitle').textContent = youWon ? '🏆 Victory!' : '😔 Defeat';

    document.getElementById('finalPlayer1').textContent = player1Name;
    document.getElementById('finalPlayer2').textContent = player2Name;
    document.getElementById('finalScore1').textContent = data.final_scores.left;
    document.getElementById('finalScore2').textContent = data.final_scores.right;

    const minutes = Math.floor(data.duration_seconds / 60);
    const seconds = data.duration_seconds % 60;
    document.getElementById('gameDuration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('obstaclesDestroyed').textContent = data.obstacles_destroyed;

    showScreen(gameOverScreen);
});

socket.on('opponent_disconnected', (data) => {
    console.log('Opponent disconnected:', data);
    isGameActive = false;
    showScreen(disconnectScreen);
});

socket.on('error', (error) => {
    console.error('Socket error:', error);
    alert(`Error: ${error.message}`);

    if (error.code === 'ROOM_NOT_FOUND' || error.code === 'ROOM_FULL') {
        window.location.href = '/';
    }
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from server');
    document.querySelector('.status-dot').classList.add('disconnected');
    document.querySelector('.status-text').textContent = 'Disconnected';
});

// Start
init();
animate();
