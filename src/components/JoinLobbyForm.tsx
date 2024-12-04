import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import useStore from '../store';
import { getSpotifyUserProfile } from '../utils/spotify';

interface JoinLobbyFormProps {
  lobbyId: string;
  onJoinSuccess: () => void;
}

const JoinLobbyForm: React.FC<JoinLobbyFormProps> = ({ lobbyId, onJoinSuccess }) => {
  const [username, setUsername] = useState('');
  const [spotifyProfileUrl, setSpotifyProfileUrl] = useState('');
  const [spotifyDisplayName, setSpotifyDisplayName] = useState<string | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setStoreSpotifyDisplayName = useStore((state) => state.setSpotifyDisplayName);

  useEffect(() => {
    const fetchSpotifyProfile = async () => {
      if (!spotifyProfileUrl) {
        setSpotifyDisplayName(null);
        return;
      }

      setIsLoadingProfile(true);
      setProfileError(null);

      try {
        const userId = spotifyProfileUrl.match(/user\/([a-zA-Z0-9]+)/)?.[1];
        if (!userId) {
          throw new Error('Invalid Spotify profile URL');
        }

        const profile = await getSpotifyUserProfile(userId);
        setSpotifyDisplayName(profile.displayName);
      } catch (error) {
        setProfileError('Failed to fetch Spotify profile. Please check the URL.');
        setSpotifyDisplayName(null);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchSpotifyProfile();
  }, [spotifyProfileUrl]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setCurrentUser(username);
    setStoreSpotifyDisplayName(spotifyDisplayName || username);

    socket.emit('join_lobby', {
      lobbyId,
      username,
      spotifyProfileUrl: spotifyProfileUrl.trim(),
      spotifyDisplayName
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
              Spotify Profile URL
            </label>
            <input
              type="text"
              value={spotifyProfileUrl}
              onChange={(e) => setSpotifyProfileUrl(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="https://open.spotify.com/user/your-profile-id"
            />
            {isLoadingProfile && (
              <p className="mt-1 text-sm text-gray-400">
                Fetching Spotify profile...
              </p>
            )}
            {profileError && (
              <p className="mt-1 text-sm text-red-400">
                {profileError}
              </p>
            )}
            {spotifyDisplayName && (
              <p className="mt-1 text-sm text-green-400">
                Found Spotify profile: {spotifyDisplayName}
              </p>
            )}
            <p className="mt-1 text-sm text-gray-400">
              Enter your Spotify profile URL to enable the "Who Added" game mode
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