import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SpotifyPlayer from 'react-spotify-web-playback';
import { Play, Users, Settings, X } from 'lucide-react';
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
  const [spotifyProfileUrl, setSpotifyProfileUrl] = useState('');
  const [playlist, setPlaylist] = useState<Track[] | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isSpotifyAuthenticated());
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [randomTrackUri, setRandomTrackUri] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const navigate = useNavigate();
  const setCurrentUser = useStore((state) => state.setCurrentUser);
  const setStoreSpotifyProfile = useStore((state) => state.setSpotifyProfile);

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

  const resetSpotifyAuth = () => {
    Cookies.remove('spotifyAuthToken');
    setAccessToken(null);
    setIsAuthenticated(false);
    setShowSettings(false);
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
    setStoreSpotifyProfile(spotifyProfileUrl.trim());
    
    socket.emit('create_lobby', { 
      username, 
      accessToken,
      spotifyProfileUrl: spotifyProfileUrl.trim()
    }, (lobbyId: string) => {
      navigate(`/lobby/${lobbyId}`);
    });
  };

  const joinLobby = (lobbyId: string) => {
    if (!username.trim()) return;
    
    setCurrentUser(username);
    setStoreSpotifyProfile(spotifyProfileUrl.trim());
    
    socket.emit('join_lobby', { 
      lobbyId, 
      username,
      spotifyProfileUrl: spotifyProfileUrl.trim()
    }, (success: boolean) => {
      if (success) {
        navigate(`/lobby/${lobbyId}`);
      }
    });
  };

  return (
    <div className="max-w-md mx-auto mt-10 sm:mt-20 p-4 sm:p-6 relative">
         {/* Settings Button */}
    <button
      onClick={() => setShowSettings(!showSettings)}
      className="fixed top-4 right-4 p-3 text-white/80 hover:text-white transition-colors z-50"
    >
      <Settings className="w-6 h-6 sm:w-5 sm:h-5" />
    </button>

    {/* Settings Modal */}
    {showSettings && (
      <div className="fixed top-16 right-4 w-[calc(100%-2rem)] sm:w-64 bg-black/80 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/20 z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-white font-semibold">Settings</h3>
          <button
            onClick={() => setShowSettings(false)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-white/80 mb-2">Spotify Authentication</h4>
            <button
              onClick={resetSpotifyAuth}
              className="w-full px-3 py-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 transition-colors"
            >
              Reset Spotify Cookies
            </button>
          </div>
        </div>
      </div>
    )}

      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 sm:p-8 shadow-xl border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome to Doozy!</h1>
          <p className="text-sm sm:text-base text-gray-300">Create or join a lobby to play with friends</p>
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
            Spotify Profile URL - Optional but Recommended
          </label>
          <input
            type="text"
            value={spotifyProfileUrl}
            onChange={(e) => setSpotifyProfileUrl(e.target.value)}
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="https://open.spotify.com/user/your-profile-id"
          />
          <p className="mt-1 text-sm text-gray-400">
            If you want to easily/automatically play songs, enter your Spotify profile URL.
          </p>
        </div>

          <button
            onClick={createLobby}
            className="w-full flex items-center justify-center px-3 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-all duration-200 space-x-2 text-sm sm:text-base"
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
            className="w-full flex items-center justify-center px-3 sm:px-4 py-2 bg-white/5 border border-white/10 text-white rounded-md hover:bg-white/10 transition-all duration-200 space-x-2 text-sm sm:text-base"
          >
            <Users className="w-5 h-5" />
            <span>Join Existing Lobby</span>
          </button>

          {!isAuthenticated ? (
            <button
              onClick={loginToSpotify}
              className="w-full flex items-center justify-center px-3 sm:px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all duration-200 text-sm sm:text-base"
            >
              <span>Login to Spotify</span>
            </button>
          ) : (
            <button
              onClick={fetchPlaylist}
              className="w-full flex items-center justify-center px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200 text-sm sm:text-base"
            >
              <span>Debug</span>
            </button>
          )}
           <span className="text-red-300 text-sm">NOTE: you NEED a Premium account and NEED to be whitelisted by the owner</span>
        </div>

        {playlist && (
          <div className="mt-6 sm:mt-8 bg-gray-800 rounded-lg p-3 sm:p-4">
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
          <div className="mt-6 sm:mt-8">
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