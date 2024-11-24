import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Users, Play, Music, Gamepad, Youtube } from 'lucide-react';
import { socket } from '../socket';
import useStore from '../store';
import Game from '../components/Game';
import SongGame from '../components/SongGame';
import ColorPicker from '../components/ColorPicker';
import DrawingCanvas from '../components/DrawingCanvas';
import JoinLobbyForm from '../components/JoinLobbyForm';
import { fetchPlaylistVideos } from '../utils/youtube';
import { fetchSpotifyPlaylist, getCurrentSpotifyToken } from '../utils/spotify';

interface User {
  username: string;
  isHost: boolean;
  score: number;
  color: string;
}

interface LobbyState {
  users: User[];
  gameState: 'waiting' | 'countdown' | 'playing';
  scores: Record<string, number>;
  gameMode: 'minigames' | 'songguess' | null;
  musicProvider?: 'youtube' | 'spotify';
  currentRound?: number;
  totalRounds?: number;
  roundTime?: number;
  spotifyToken?: string;
  gameVariant?: 'classic' | 'whoAdded';
}

const Lobby = () => {
  const { id: lobbyId } = useParams();
  const [lobbyState, setLobbyState] = useState<LobbyState>({
    users: [],
    gameState: 'waiting',
    scores: {},
    gameMode: null,
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const { currentUser } = useStore();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [musicProvider, setMusicProvider] = useState<'youtube' | 'spotify'>('youtube');
  const [gameVariant, setGameVariant] = useState<'classic' | 'whoAdded'>('classic');
  const [roundConfig, setRoundConfig] = useState({
    totalRounds: 5,
    roundTime: 20
  });
  const [spotifyToken, setSpotifyToken] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);

  React.useEffect(() => {
    if (lobbyId) {
      socket.emit('request_lobby_state', { lobbyId });
    }

    socket.on('lobby_update', (state: LobbyState) => {
      setLobbyState(state);
      if (state.spotifyToken) {
        setSpotifyToken(state.spotifyToken);
      }
      // If the user is in the lobby, mark them as joined
      if (state.users.some(user => user.username === currentUser)) {
        setHasJoined(true);
      }
    });

    socket.on('game_countdown', () => {
      setCountdown(3);
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    });

    return () => {
      socket.off('lobby_update');
      socket.off('game_countdown');
    };
  }, [lobbyId, currentUser]);

  // If the user hasn't joined and there's no current user, show the join form
  if (!hasJoined && !currentUser) {
    return <JoinLobbyForm lobbyId={lobbyId!} onJoinSuccess={() => setHasJoined(true)} />;
  }

  const copyLobbyId = () => {
    navigator.clipboard.writeText(lobbyId || '');
  };

  const selectGameMode = async (mode: 'minigames' | 'songguess') => {
    if (mode === 'songguess' && playlistUrl) {
      setIsLoadingPlaylist(true);
      setPlaylistError(null);
      try {
        let playlist;
        if (musicProvider === 'youtube') {
          playlist = await fetchPlaylistVideos(playlistUrl);
        } else {
          playlist = await fetchSpotifyPlaylist(playlistUrl);
        }
        socket.emit('select_game_mode', {
          lobbyId,
          mode,
          playlist,
          musicProvider,
          gameVariant,
          config: {
            totalRounds: roundConfig.totalRounds,
            roundTime: roundConfig.roundTime
          }
        });
      } catch (error) {
        setPlaylistError('Failed to load playlist. Please check the URL and try again.');
        return;
      } finally {
        setIsLoadingPlaylist(false);
      }
    } else {
      socket.emit('select_game_mode', { lobbyId, mode, musicProvider, gameVariant });
    }
  };

  const startGame = () => {
    socket.emit('start_game', { lobbyId });
  };

  const isHost = lobbyState.users.find(u => u.username === currentUser)?.isHost ?? false;
  const canStartGame = lobbyState.users.length >= 1 && isHost && lobbyState.gameState === 'waiting';

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold text-white">Lobby</h2>
            <button
              onClick={copyLobbyId}
              className="flex items-center space-x-2 px-3 py-1 bg-white/5 rounded-md hover:bg-white/10 transition-all duration-200"
            >
              <span className="text-gray-300 text-sm">{lobbyId}</span>
              <Copy className="w-4 h-4 text-gray-300" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-300" />
              <span className="text-gray-300">{lobbyState.users.length}</span>
            </div>
            {isHost && (
              <>
                <button
                  onClick={() => selectGameMode('minigames')}
                  disabled={isLoadingPlaylist}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${lobbyState.gameMode === 'minigames'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Gamepad className="w-5 h-5" />
                  <span>Mini Games</span>
                </button>
                <button
                  onClick={() => selectGameMode('songguess')}
                  disabled={isLoadingPlaylist}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-200 ${lobbyState.gameMode === 'songguess'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Music className="w-5 h-5" />
                  <span>Song Guess</span>
                </button>
                {canStartGame && (
                  <button
                    onClick={startGame}
                    disabled={isLoadingPlaylist}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-5 h-5" />
                    <span>Start Game</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isHost && lobbyState.gameMode === 'songguess' && lobbyState.gameState === 'waiting' && (
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Game Variant
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGameVariant('classic')}
                    className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${gameVariant === 'classic'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => setGameVariant('whoAdded')}
                    className={`flex-1 px-4 py-2 rounded-md transition-all duration-200 ${gameVariant === 'whoAdded'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                  >
                    Who Added It?
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Number of Rounds
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={roundConfig.totalRounds}
                  onChange={(e) => setRoundConfig(prev => ({
                    ...prev,
                    totalRounds: Math.max(1, Math.min(20, parseInt(e.target.value) || 1))
                  }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Round Duration (seconds)
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={roundConfig.roundTime}
                  onChange={(e) => setRoundConfig(prev => ({
                    ...prev,
                    roundTime: Math.max(10, Math.min(60, parseInt(e.target.value) || 10))
                  }))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMusicProvider('youtube')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200 ${musicProvider === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <Youtube className="w-5 h-5" />
                <span>YouTube</span>
              </button>
              <button
                onClick={() => setMusicProvider('spotify')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200 ${musicProvider === 'spotify'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <Music className="w-5 h-5" />
                <span>Spotify</span>
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                {musicProvider === 'youtube' ? 'YouTube Playlist URL' : 'Spotify Playlist URL'}
              </label>
              <input
                type="text"
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                placeholder={`Enter ${musicProvider === 'youtube' ? 'YouTube' : 'Spotify'} playlist URL`}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {playlistError && (
                <p className="mt-2 text-red-400 text-sm">{playlistError}</p>
              )}
              {isLoadingPlaylist && (
                <p className="mt-2 text-gray-400 text-sm">Loading playlist...</p>
              )}
            </div>
          </div>
        )}

        {countdown && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="text-7xl font-bold text-white animate-pulse">
              {countdown}
            </div>
          </div>
        )}

        {lobbyState.gameState === 'playing' ? (
          lobbyState.gameMode === 'songguess' ? (
            lobbyState.musicProvider === 'spotify' && !spotifyToken ? (
              <div>Loading Spotify token...</div>
            ) : (
              <SongGame
                lobbyId={lobbyId!}
                currentUser={currentUser}
                scores={lobbyState.scores}
                isHost={isHost}
                currentRound={lobbyState.currentRound}
                totalRounds={lobbyState.totalRounds}
                roundTime={lobbyState.roundTime}
                musicProvider={lobbyState.musicProvider || 'youtube'}
                spotifyToken={spotifyToken}
                gameVariant={lobbyState.gameVariant}
              />
            )
          ) : (
            <Game lobbyId={lobbyId!} currentUser={currentUser} scores={lobbyState.scores} />
          )
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3 space-y-6">
              <DrawingCanvas lobbyId={lobbyId!} />
              <ColorPicker />
            </div>

            <div className="bg-black/20 rounded-lg p-4 border border-white/10">
              <h3 className="text-white font-semibold mb-4">Players</h3>
              <div className="space-y-2">
                {lobbyState.users.map((user, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-md ${user.username === currentUser
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-white/5 text-gray-300'
                      } flex justify-between items-center`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <span>{user.username}</span>
                    </div>
                    {user.isHost && (
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;