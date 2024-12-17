import React from 'react';
import ConnectionStatus from './ConnectionStatus';

interface User {
  username: string;
  isHost: boolean;
  color: string;
}

interface PlayerListProps {
  users: User[];
  currentUser: string;
  disconnectedUsers: Set<string>;
}

const PlayerList: React.FC<PlayerListProps> = ({
  users,
  currentUser,
  disconnectedUsers
}) => {
  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
      <h3 className="text-white font-semibold mb-4">Players</h3>
      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.username}
            className={`p-2 rounded-md ${
              user.username === currentUser
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-white/5 text-gray-300'
            } flex items-center justify-between relative`}
          >
            <div className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span className="text-sm">{user.username}</span>
              {user.isHost && (
                <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                  Host
                </span>
              )}
            </div>
            <ConnectionStatus
              isConnected={!disconnectedUsers.has(user.username)}
              username={user.username}
              isCurrentUser={user.username === currentUser}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlayerList;