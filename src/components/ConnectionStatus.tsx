import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionStatusProps {
  isConnected: boolean;
  username: string;
  isCurrentUser: boolean;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  username,
  isCurrentUser
}) => {
  return (
    <div
      className={`absolute right-2 top-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
        isConnected
          ? 'bg-green-500/20 text-green-300'
          : 'bg-red-500/20 text-red-300 animate-pulse'
      }`}
    >
      {isConnected ? (
        <Wifi className="w-3 h-3" />
      ) : (
        <WifiOff className="w-3 h-3" />
      )}
      {!isConnected && (
        <span>
          {isCurrentUser ? 'Reconnecting...' : 'Disconnected'}
        </span>
      )}
    </div>
  );
};

export default ConnectionStatus;