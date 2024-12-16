import { useState, useEffect } from 'react';
import { socket, isSocketConnected } from '../socket';

export const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(isSocketConnected());
  const [disconnectedUsers, setDisconnectedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleUserDisconnect = (username: string) => {
      setDisconnectedUsers(prev => new Set([...prev, username]));
    };

    const handleUserReconnect = (username: string) => {
      setDisconnectedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(username);
        return newSet;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('user_disconnected', handleUserDisconnect);
    socket.on('user_reconnected', handleUserReconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('user_disconnected', handleUserDisconnect);
      socket.off('user_reconnected', handleUserReconnect);
    };
  }, []);

  return {
    isConnected,
    disconnectedUsers
  };
};