import { io } from 'socket.io-client';

// Configure socket with more resilient settings
const socket = io({
  // Prefer WebSocket but fallback to polling if needed
  transports: ['websocket', 'polling'],

  // Increase reconnection attempts
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelayMax: 5000,

  // Timeout settings
  timeout: 20000,

  // Engine.io-specific settings (use `transportOptions`)
  transportOptions: {
    websocket: {
      pingTimeout: 30000,
      pingInterval: 10000,
    },
  },

  // Auto connect on init
  autoConnect: true,

  // Force new connection
  forceNew: true,
});

// Track connection state
let isConnected = false;

// Handle connect event
socket.on('connect', () => {
  console.log('Socket connected');
  isConnected = true;

  // Rejoin lobby if we have the data
  const currentLobbyId = localStorage.getItem('currentLobbyId');
  const currentUser = localStorage.getItem('currentUser');

  if (currentLobbyId && currentUser) {
    socket.emit('rejoin_lobby', {
      lobbyId: currentLobbyId,
      username: currentUser,
    });
  }
});

// Handle disconnect event
socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
  isConnected = false;
});

// Handle reconnect event
socket.on('reconnect', (attemptNumber) => {
  console.log('Socket reconnected after', attemptNumber, 'attempts');
});

// Handle reconnect attempt event
socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Attempting reconnection:', attemptNumber);
});

// Handle reconnect error
socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

// Handle reconnect failed
socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
});

// Add visibility change handler
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (!isConnected) {
      socket.connect();
    }
  }
});

// Export connection state checker
export const isSocketConnected = () => isConnected;

export { socket };
