import { io, Socket } from 'socket.io-client';
import { useStore } from './store';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private baseReconnectDelay: number = 1000;
  private maxReconnectDelay: number = 30000;
  private isConnected: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.socket = io({
      // Prefer WebSocket but fallback to polling if needed
      transports: ['websocket', 'polling'],
      
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.baseReconnectDelay,
      reconnectionDelayMax: this.maxReconnectDelay,
      
      // Increase timeout thresholds
      timeout: 20000,
      
      // Ping settings
      pingTimeout: 30000,
      pingInterval: 10000,
      
      // Auto connect and force new connection
      autoConnect: true,
      forceNew: true
    });

    this.setupEventListeners();
    this.setupPing();
    this.setupVisibilityHandler();
  }

  public static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  private setupEventListeners(): void {
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.rejoinLobby();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.handleDisconnect(reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.handleConnectionError();
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.handleError();
    });

    // Handle ping responses
    this.socket.on('pong', () => {
      this.lastPongTime = Date.now();
    });
  }

  private lastPongTime: number = Date.now();

  private setupPing(): void {
    // Send regular pings to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.isConnected) {
        this.socket.emit('ping');
        
        // Check if we've received a pong recently
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > 35000) { // No pong for 35 seconds
          console.warn('No pong received, reconnecting...');
          this.reconnect();
        }
      }
    }, 10000);
  }

  private setupVisibilityHandler(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          if (!this.isConnected) {
            console.log('Page visible, reconnecting...');
            this.reconnect();
          }
        }
      });
    }
  }

  private handleDisconnect(reason: string): void {
    if (reason === 'io server disconnect') {
      // Server disconnected us, try to reconnect immediately
      this.reconnect();
    } else if (reason === 'transport close' || reason === 'ping timeout') {
      // Connection lost, attempt reconnect with backoff
      this.reconnectWithBackoff();
    }
  }

  private handleConnectionError(): void {
    this.reconnectWithBackoff();
  }

  private handleError(): void {
    if (!this.isConnected) {
      this.reconnectWithBackoff();
    }
  }

  private reconnectWithBackoff(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.reconnect();
    }, delay);
  }

  private reconnect(): void {
    if (!this.isConnected) {
      this.socket.connect();
    }
  }

  private rejoinLobby(): void {
    const currentLobbyId = localStorage.getItem('currentLobbyId');
    const currentUser = localStorage.getItem('currentUser');
    const spotifyProfile = localStorage.getItem('spotifyProfile');

    if (currentLobbyId && currentUser) {
      console.log('Attempting to rejoin lobby:', currentLobbyId);
      this.socket.emit('join_lobby', {
        lobbyId: currentLobbyId,
        username: currentUser,
        spotifyProfileUrl: spotifyProfile || ''
      }, (success: boolean) => {
        if (success) {
          console.log('Successfully rejoined lobby');
        } else {
          console.log('Failed to rejoin lobby');
          // Clear stored lobby data if rejoin fails
          localStorage.removeItem('currentLobbyId');
        }
      });
    }
  }

  public getSocket(): Socket {
    return this.socket;
  }

  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  public cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.socket.disconnect();
  }
}

// Export the socket instance
export const socket = SocketManager.getInstance().getSocket();

// Export connection state checker
export const isSocketConnected = () => SocketManager.getInstance().isSocketConnected();