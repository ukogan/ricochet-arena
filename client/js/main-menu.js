// Initialize Socket.IO connection
const socket = io();

// Get DOM elements
const createGameBtn = document.getElementById('createGameBtn');
const nicknameInput = document.getElementById('nickname');

// Create game button click handler
createGameBtn.addEventListener('click', () => {
  const nickname = nicknameInput.value.trim() || '';

  // Disable button while creating
  createGameBtn.disabled = true;
  createGameBtn.innerHTML = '<span class="spinner"></span> Creating Room...';

  // Emit create_room event
  socket.emit('create_room', { nickname });
});

// Listen for room_created event
socket.on('room_created', (data) => {
  console.log('Room created:', data);

  // Redirect to game room
  window.location.href = `/game/${data.room_id}`;
});

// Listen for errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
  alert(`Error: ${error.message}`);

  // Re-enable button
  createGameBtn.disabled = false;
  createGameBtn.textContent = 'Create Game';
});

// Connection status
socket.on('connect', () => {
  console.log('✅ Connected to server');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});
