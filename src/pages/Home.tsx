import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotifyPlayer from 'react-spotify-web-playback';
import { Play, Users } from 'lucide-react';
import { socket } from '../socket';
import useStore from '../store';
import Cookies from 'js-cookie'; 
import {
  getSpotifyLoginUrl,
  handleSpotifyCallback,
  fetchSpotifyPlaylist,
  getCurrentSpotifyToken,
  isSpotifyAuthenticated,
  setCookieSpotifyToken
} from '../utils/spotify';

const Home = () => {
  const [username, setUsername] = useState('');
  const [spotifyDisplayName, setSpotifyDisplayName] = useState('');
  const [playlist, setPlaylist] = useState<Track[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isSpotifyAuthenticated());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [randomTrackUri, setRandomTrackUri] = useState<string | null>(null);
  const navigate = useNavigate();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setStoreSpotifyDisplayName = useStore((state) => state.setSpotifyDisplayName);

  interface Track {
    id: string;
    title: string;
    artist: string;
  }

  useEffect(() => {
    const savedToken = Cookies.get('spotifyAuthToken');
  
    if (savedToken) {
      setAccessToken(savedToken);
      setCookieSpotifyToken(savedToken);
      setIsAuthenticated(true);
    } else {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code && !isAuthenticated) {
        handleSpotifyCallback(code)
          .then(async () => {
            setIsAuthenticated(true);
            const token = await getCurrentSpotifyToken();
            if (token) {
              setAccessToken(token);
              Cookies.set('spotifyAuthToken', token, { expires: 1 });
            }
          })
          .catch((error) => console.error('Spotify authentication error:', error));
      } 
    }
  }, [isAuthenticated]);

  const loginToSpotify = () => {
    window.location.href = getSpotifyLoginUrl();
  };

  const fetchPlaylist = async () => {
    try {
      const playlistUrl = prompt('Enter Spotify playlist URL:');
      if (!playlistUrl) {
        console.log('No playlist URL provided');
        return;
      }
      const playlistData: Track[] = await fetchSpotifyPlaylist(playlistUrl);
      setPlaylist(playlistData);
      
      const randomTrack = playlistData[Math.floor(Math.random() * playlistData.length)];
      setRandomTrackUri(`spotify:track:${randomTrack.id}`);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    }
  };

  const createLobby = () => {
    if (!username.trim()) return;

    setCurrentUser(username);
    setStoreSpotifyDisplayName(spotifyDisplayName.trim() || username);
    
    socket.emit('create_lobby', { 
      username, 
      accessToken,
      spotifyDisplayName: spotifyDisplayName.trim() || username 
    }, (lobbyId: string) => {
      navigate(`/lobby/${lobbyId}`);
    });
  };

  const joinLobby = (lobbyId: string) => {
    if (!username.trim()) return;
    
    setCurrentUser(username);
    setStoreSpotifyDisplayName(spotifyDisplayName.trim() || username);
    
    socket.emit('join_lobby', { 
      lobbyId, 
      username,
      spotifyDisplayName: spotifyDisplayName.trim() || username 
    }, (success: boolean) => {
      if (success) {
        navigate(`/lobby/${lobbyId}`);
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome to Doozy!</h1>
          <p className="text-gray-300">Create or join a lobby to play with friends</p>
        </div>

        <div className="space-y-4">
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
            onClick={createLobby}
            className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200 space-x-2"
          >
            <Play className="w-5 h-5" />
            <span>Create New Lobby</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-300">or</span>
            </div>
          </div>

          <button
            onClick={() => {
              const lobbyId = prompt('Enter lobby ID:');
              if (lobbyId) joinLobby(lobbyId);
            }}
            className="w-full flex items-center justify-center px-4 py-2 bg-white/5 border border-white/10 text-white rounded-md hover:bg-white/10 transition-all duration-200 space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>Join Existing Lobby</span>
          </button>

          {!isAuthenticated ? (
            <button
              onClick={loginToSpotify}
              className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200"
            >
              <span>Login to Spotify</span>
            </button>
          ) : (
            <button
              onClick={fetchPlaylist}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
            >
              <span>Fetch Playlist</span>
            </button>
          )}
        </div>

        {playlist && (
          <div className="mt-8 bg-gray-800 rounded-lg p-4">
            <h2 className="text-lg font-bold text-white mb-4">Playlist Tracks</h2>
            <ul className="space-y-2">
              {playlist.map((track) => (
                <li key={track.id} className="text-white">
                  {track.title} - {track.artist}
                </li>
              ))}
            </ul>
          </div>
        )}

        {accessToken && randomTrackUri && (
          <div className="mt-8">
            <SpotifyPlayer
              token={accessToken}
              uris={[randomTrackUri]}
              autoPlay={true}
              showSaveIcon
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;