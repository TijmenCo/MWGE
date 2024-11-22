import React, { useState } from 'react';
import { socket } from '../socket';
import useStore from '../store';

interface JoinLobbyFormProps {
  lobbyId: string;
  onJoinSuccess: () => void;
}

const JoinLobbyForm: React.FC<JoinLobbyFormProps> = ({ lobbyId, onJoinSuccess }) => {
  const [username, setUsername] = useState('');
  const [spotifyDisplayName, setSpotifyDisplayName] = useState('');
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setStoreSpotifyDisplayName = useStore((state) => state.setSpotifyDisplayName);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setCurrentUser(username);
    setStoreSpotifyDisplayName(spotifyDisplayName.trim() || username);

    socket.emit('join_lobby', {
      lobbyId,
      username,
      spotifyDisplayName: spotifyDisplayName.trim() || username
    }, (success: boolean) => {
      if (success) {
        onJoinSuccess();
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Join Lobby</h1>
          <p className="text-gray-300">Enter your details to join the game</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Choose your username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">
              Spotify Display Name (optional)
            </label>
            <input
              type="text"
              value={spotifyDisplayName}
              onChange={(e) => setSpotifyDisplayName(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Your Spotify account name"
            />
            <p className="mt-1 text-sm text-gray-400">
              Enter your Spotify display name if it's different from your username
            </p>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
          >
            Join Lobby
          </button>
        </form>
      </div>
    </div>
  );
};

export default JoinLobbyForm;