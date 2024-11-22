import { io } from 'socket.io-client';

const getServerUrl = () => {
  const hostname = window.location.hostname;
  const port = '3001';
  
  // If we're using localhost, keep using it
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `http://localhost:${port}`;
  }
  
  // Otherwise use the full hostname
  return `http://${hostname}:${port}`;
};

export const socket = io(getServerUrl(), {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});