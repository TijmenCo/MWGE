import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Copy, Users, Play, Music, Gamepad, Youtube, RotateCcw, Plus, Minus } from 'lucide-react';
import { socket } from '../socket';
import useStore from '../store';
import Game from '../components/Game';
import SongGame from '../components/SongGame';
import ColorPicker from '../components/ColorPicker';
import DrawingCanvas from '../components/DrawingCanvas';
import JoinLobbyForm from '../components/JoinLobbyForm';
import { fetchPlaylistVideos } from '../utils/youtube';
import { fetchSpotifyPlaylist, fetchUserTopTracks } from '../utils/spotify';
import DuckOverlay from '../components/DuckOverlay';

interface User {
  username: string;
  isHost: boolean;
  score: number;
  color: string;
  spotifyProfileUrl: string;
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
  maxGuesses?: number;
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
  const [selectedSequence, setSelectedSequence] = useState<'standard' | 'gamblingParadise' | 'brainTeaser' | 'actionPacked' | 'casinoNight'>('standard');
  const { currentUser } = useStore();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const [resetState, setResetState] = useState(false);
  const [playListLoaded, setPlaylistLoaded] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [isLoadingPlaylist, setIsLoadingPlaylist] = useState(false);
  const [musicProvider, setMusicProvider] = useState<'youtube' | 'spotify'>('spotify');
  const [gameVariant, setGameVariant] = useState<'classic' | 'whoAdded'>('classic');
  const [roundConfig, setRoundConfig] = useState({
    totalRounds: 5,
    roundTime: 20,
    maxGuesses: 3 
  });
  const [minigameRoundConfig, setMinigameRoundConfig] = useState({
    totalRounds: 5
  });
  const [spotifyToken, setSpotifyToken] = useState<string>('');
  const [hasJoined, setHasJoined] = useState(false);
  const [sourceType, setSourceType] = useState<'playlist' | 'profiles'>('playlist');

  React.useEffect(() => {
    setGameOver(false);
    setResetState(false);
    
    if (lobbyId) {
      socket.emit('request_lobby_state', { lobbyId });
    }

    console.log()

    const handleLobbyUpdate = (state: LobbyState) => {
      setLobbyState(prevState => ({
        ...prevState,
        ...state,
        gameMode: state.gameState === 'waiting' ? state.gameMode : prevState.gameMode
      }));
      if (state.spotifyToken) {
        setSpotifyToken(state.spotifyToken);
      }
      // If the user is in the lobby, mark them as joined
      if (state.users.some(user => user.username === currentUser)) {
        setHasJoined(true);
      }

      console.log("Updated gameState:", state.gameState);

      
      // Reset states when returning to lobby
      if (state.gameState === 'waiting') {
        setPlaylistUrl('');
        setGameOver(false);
        setIsLoadingPlaylist(false);
        setPlaylistError(null);
        setCountdown(null);
      }
    };

    socket.on('lobby_update', handleLobbyUpdate);

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
      socket.off('lobby_update', handleLobbyUpdate);
      socket.off('game_countdown');
    };
  }, [lobbyId, currentUser, gameOver, resetState]);

  // If the user hasn't joined and there's no current user, show the join form
  if (!hasJoined && !currentUser) {
    return <JoinLobbyForm lobbyId={lobbyId!} onJoinSuccess={() => setHasJoined(true)} />;
  }

  const loadSongs = async (mode: 'minigames' | 'songguess') => {
    if (mode === 'songguess' && (playlistUrl || sourceType === 'profiles')) {
      setIsLoadingPlaylist(true);
      setPlaylistError(null);
      try {
        let playlist;
        if (sourceType === 'profiles') {
          // Get all users' profile URLs and fetch their top tracks
          console.log(lobbyState.users)
          const userProfiles = lobbyState.users.map(user => ({
            username: user.username,
            profileUrl: user.spotifyProfileUrl
          })).filter(user => user.profileUrl);

          console.log(userProfiles);

          console.log("got in profiles")

          const allTracks = await Promise.all(
            userProfiles.map(async user => {
              const tracks = await fetchUserTopTracks(user.profileUrl);
              return tracks.map(track => ({
                ...track,
                addedBy: {
                  ...track.addedBy,
                  displayName: user.username
                }
              }));
            })
          );

          setPlaylistLoaded(true);

          console.log(allTracks);

          playlist = allTracks.flat();
        } else if (musicProvider === 'youtube') {
          playlist = await fetchPlaylistVideos(playlistUrl);
          setPlaylistLoaded(true);
        } else {
          playlist = await fetchSpotifyPlaylist(playlistUrl);
          setPlaylistLoaded(true);
        }

        socket.emit('select_game_mode', {
          lobbyId,
          mode,
          playlist,
          musicProvider,
          gameVariant,
          config: {
            totalRounds: roundConfig.totalRounds,
            roundTime: roundConfig.roundTime,
            maxGuesses: roundConfig.maxGuesses
          }
        });
      } catch (error) {
        setPlaylistError('Failed to load songs. Please check the URLs and try again.');
        setPlaylistLoaded(false);
        return;
      } finally {
        setIsLoadingPlaylist(false);
      }
    } else {
      socket.emit('select_game_mode', { lobbyId, mode, musicProvider, gameVariant });
    }
  };


  const copyLobbyId = () => {
    const fullLobbyUrl = `${window.location.origin}/lobby/${lobbyId || ''}`;
    navigator.clipboard.writeText(fullLobbyUrl)
      .then(() => {
        // Notify the user that the URL was copied
        const notification = document.createElement('div');
        notification.textContent = 'Lobby URL copied to clipboard!';
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.padding = '10px';
        notification.style.backgroundColor = '#4CAF50';
        notification.style.color = 'white';
        notification.style.borderRadius = '5px';
        notification.style.zIndex = '1000';
        document.body.appendChild(notification);
  
        // Automatically remove the notification after 2 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
        }, 2000);
      })
      .catch(() => {
        // Handle any potential errors in writing to the clipboard
        alert('Failed to copy lobby URL.');
      });
  };
  

  const returnToLobby = () => {
    socket.emit('return_to_lobby', { lobbyId });
    // Reset local states
    setGameOver(false);
    setPlaylistUrl('');
    setIsLoadingPlaylist(false);
    setPlaylistError(null);
    setCountdown(null);
    setPlaylistLoaded(false);
    // Reset game-specific states
    setLobbyState(prev => ({
      ...prev,
      gameState: 'waiting',
      gameMode: null,
      minigameState: null,
      scores: {},
      currentRound: 1,
      totalRounds: 5,
      roundTime: 20,
      maxGuesses: 3,
    }));
  };


  const selectGameMode = async (mode: 'minigames' | 'songguess') => {
    setLobbyState(prevState => ({
      ...prevState,
      gameMode: mode
    }));
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
            roundTime: roundConfig.roundTime,
            maxGuesses: roundConfig.maxGuesses
          }
        });
      } catch (error) {
        setPlaylistError('Failed to load playlist. Please check the URL and try again.');
        return;
      } finally {
        setIsLoadingPlaylist(false);
      }
    } else {
      console.log(`gameSequence`, {selectedSequence})

      socket.emit('select_game_mode', { 
        lobbyId, 
        mode, 
        musicProvider, 
        gameVariant,
        config: mode === 'minigames' ? { 
          totalRounds: minigameRoundConfig.totalRounds,
          sequenceType: selectedSequence 
        } : undefined
      });
    }
  };

  const startGame = () => {
    setGameOver(false);
    console.log("LOBBYSTATE");
    console.log(lobbyState);
    socket.emit('start_game', { lobbyId }, minigameRoundConfig.totalRounds);
    setResetState(true)
  };

  const isHost = lobbyState.users.find(u => u.username === currentUser)?.isHost ?? false;
  const canStartGame = lobbyState.users.length >= 1 && isHost && lobbyState.gameState === 'waiting';

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 md:p-6 relative min-h-screen">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-4 md:p-6 shadow-xl border border-white/20 relative min-h-[calc(100vh-2rem)]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-2 sm:gap-4">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Lobby</h2>
            <button
              onClick={copyLobbyId}
              className="flex items-center space-x-2 px-2 py-1 bg-white/5 rounded-md hover:bg-white/10 transition-all duration-200"
            >
              <span className="text-gray-300 text-xs sm:text-sm">{lobbyId}</span>
              <Copy className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" />
              <span className="text-gray-300 text-sm">{lobbyState.users.length}</span>
            </div>
            {isHost && (
              <>
                <button
                  onClick={returnToLobby}
                  disabled={isLoadingPlaylist}
                  className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 bg-white/5 text-gray-300 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Return</span>
                </button>
                <button
                  onClick={() => selectGameMode('minigames')}
                  disabled={isLoadingPlaylist}
                  className={`flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                    lobbyState.gameMode === 'minigames'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Gamepad className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Mini Games</span>
                </button>
                <button
                  onClick={() => selectGameMode('songguess')}
                  disabled={isLoadingPlaylist || !spotifyToken}
                  className={`flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                    lobbyState.gameMode === 'songguess'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <Music className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Song Guess</span>
                </button>
                {!spotifyToken && lobbyState.gameState === 'waiting' &&  (
                  <h2>Log-In with Spotify to play Song guess</h2>
                )}
                {canStartGame && (
                  <button
                    onClick={startGame}
                    disabled={isLoadingPlaylist || !lobbyState.gameMode || (lobbyState.gameMode === "songguess" && !playListLoaded)}
                    className="flex items-center space-x-1 px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Start</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {isHost && lobbyState.gameMode === 'songguess' && lobbyState.gameState === 'waiting' && (
          <div className="mb-4 sm:mb-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Game Variant
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setGameVariant('classic')}
                    className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                      gameVariant === 'classic'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    Classic
                  </button>
                  <button
                    onClick={() => {
                      setGameVariant('whoAdded');
                      setSourceType('profiles');
                    }}
                    className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                      gameVariant === 'whoAdded'
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
                  Source Type
                </label>
                <div className="flex gap-2">
                {isHost && lobbyState.gameMode === 'songguess' && gameVariant === 'classic' && (
                  <button
                    onClick={() => setSourceType('playlist')}
                    className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                      sourceType === 'playlist'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    From Playlist
                  </button>
                )}
                  <button
                    onClick={() => setSourceType('profiles')}
                    className={`flex-1 px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                      sourceType === 'profiles'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    }`}
                  >
                    From User Profiles
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Number of Rounds
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      totalRounds: Math.max(1, prev.totalRounds - 1)
                    }))}
                    className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-300" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={roundConfig.totalRounds}
                    onChange={(e) => setRoundConfig(prev => ({
                      ...prev,
                      totalRounds: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
                    }))}
                    className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                  />
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      totalRounds: Math.min(100, prev.totalRounds + 1)
                    }))}
                    className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Round Duration (seconds)
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      roundTime: Math.max(1, prev.roundTime - 1)
                    }))}
                    className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-300" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={roundConfig.roundTime}
                    onChange={(e) => setRoundConfig(prev => ({
                      ...prev,
                      roundTime: Math.max(1, Math.min(120, parseInt(e.target.value) || 10))
                    }))}
                    className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                  />
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      roundTime: Math.min(120, prev.roundTime + 1)
                    }))}
                    className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Max Guesses per Round
                </label>
                <div className="flex items-center">
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      maxGuesses: Math.max(1, prev.maxGuesses - 1)
                    }))}
                    className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-gray-300" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="99999"
                    value={roundConfig.maxGuesses}
                    onChange={(e) => setRoundConfig(prev => ({
                      ...prev,
                      maxGuesses: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                    }))}
                    className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                  />
                  <button
                    onClick={() => setRoundConfig(prev => ({
                      ...prev,
                      maxGuesses: Math.min(10, prev.maxGuesses + 1)
                    }))}
                    className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-gray-300" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mb-4">
              {/* <button
                onClick={() => setMusicProvider('youtube')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-md transition-all duration-200 ${musicProvider === 'youtube'
                    ? 'bg-red-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <Youtube className="w-5 h-5" />
                <span>YouTube</span>
              </button> */}
              <button
                onClick={() => setMusicProvider('spotify')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 text-xs sm:text-sm rounded-md transition-all duration-200 ${musicProvider === 'spotify'
                    ? 'bg-green-600 text-white'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                  }`}
              >
                <Music className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Spotify</span>
              </button>
            </div>
            {(sourceType === 'playlist') && (
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
            )}

            {sourceType == 'profiles' && (
                <span className="text-red-300 text-sm">NOTE: make sure that everybody who wants to play with profile has public playlists + entered their spotify url!</span>
            )}

            <button
              onClick={() => loadSongs('songguess')}
              className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-all duration-200"
            >
              Load Songs
            </button>
            {playlistError && (
              <p className="mt-2 text-red-400 text-sm">{playlistError}</p>
            )}
            {isLoadingPlaylist && (
              <p className="mt-2 text-gray-400 text-sm">Loading playlist...</p>
            )}
          </div>
        )}

{isHost && lobbyState.gameMode === 'minigames' && lobbyState.gameState === 'waiting' && (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        Game Sequence Type
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button
           onClick={() => {
            setSelectedSequence('standard');
            selectGameMode('minigames')
          }}
          className={`p-4 rounded-lg transition-colors ${
            selectedSequence === 'standard'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <h3 className="font-semibold mb-1">Standard Mix</h3>
          <p className="text-sm opacity-80">A balanced mix of questions, action games, and gambling</p>
        </button>
        <button
          onClick={() => {
            setSelectedSequence('gamblingParadise')
            selectGameMode('minigames')
          }}
          className={`p-4 rounded-lg transition-colors ${
            selectedSequence === 'gamblingParadise'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <h3 className="font-semibold mb-1">Gambling Paradise</h3>
          <p className="text-sm opacity-80">For those feeling lucky! Alternates between action and gambling games</p>
        </button>
        <button
          onClick={() => {
            setSelectedSequence('brainTeaser')
            selectGameMode('minigames')
          }}
          className={`p-4 rounded-lg transition-colors ${
            selectedSequence === 'brainTeaser'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <h3 className="font-semibold mb-1">Brain Teaser</h3>
          <p className="text-sm opacity-80">Test your knowledge with quiz and voting questions</p>
        </button>
        <button
          onClick={() => {
            setSelectedSequence('actionPacked')
            selectGameMode('minigames')
          }}
          className={`p-4 rounded-lg transition-colors ${
            selectedSequence === 'actionPacked'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <h3 className="font-semibold mb-1">Action Packed</h3>
          <p className="text-sm opacity-80">Fast-paced action games to test your reflexes</p>
        </button>
        <button
          onClick={() => {
            setSelectedSequence('casinoNight')
            selectGameMode('minigames')
          }}
          className={`p-4 rounded-lg transition-colors ${
            selectedSequence === 'casinoNight'
              ? 'bg-purple-600 text-white'
              : 'bg-white/5 text-gray-300 hover:bg-white/10'
          }`}
        >
          <h3 className="font-semibold mb-1">Casino Night</h3>
          <p className="text-sm opacity-80">All gambling, all the time!</p>
        </button>
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-200 mb-2">
        Number of Minigame Rounds
      </label>
      <div className="flex items-center">
        <button
          onClick={() => setMinigameRoundConfig(prev => ({
            ...prev,
            totalRounds: Math.max(1, prev.totalRounds - 1)
          }))}
          className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors"
        >
          <Minus className="w-4 h-4 text-gray-300" />
        </button>
        <input
          type="number"
          min="1"
          max="100"
          value={minigameRoundConfig.totalRounds}
          onChange={(e) => setMinigameRoundConfig(prev => ({
            ...prev,
            totalRounds: Math.max(1, Math.min(100, parseInt(e.target.value) || 1))
          }))}
          className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
        />
        <button
          onClick={() => setMinigameRoundConfig(prev => ({
            ...prev,
            totalRounds: Math.min(100, prev.totalRounds + 1)
          }))}
          className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors"
        >
          <Plus className="w-4 h-4 text-gray-300" />
        </button>
      </div>
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

        {lobbyState.gameState === 'playing' && !gameOver ? (
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
                maxGuesses={lobbyState.maxGuesses}
                musicProvider={lobbyState.musicProvider || 'youtube'}
                spotifyToken={spotifyToken}
                gameVariant={lobbyState.gameVariant}
              />
            )
          ) : (
            <Game 
              lobbyId={lobbyId!} 
              currentUser={currentUser} 
              scores={lobbyState.scores}
              isHost={isHost} 
              totalRounds={lobbyState.gameMode === 'minigames' ? minigameRoundConfig.totalRounds : undefined}
            />
          )
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="lg:col-span-3 space-y-4 sm:space-y-6">
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
                      <span className="text-sm">{user.username}</span>
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
         {lobbyState.gameState === 'waiting' && (
        <DuckOverlay users={lobbyState.users} />
         )}
      </div>
    </div>
  );
};

export default Lobby;

