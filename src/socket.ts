import { io } from 'socket.io-client';

const socket = io({
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

export { socket };