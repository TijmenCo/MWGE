import React, { useEffect, useState } from 'react';
import YouTube from 'react-youtube';
import SpotifyPlayer from 'react-spotify-web-playback';
import { socket } from '../socket';
import { Trophy, Music, FastForward, User, Disc } from 'lucide-react';
import { Track } from '../types';

interface SongGameProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
  isHost: boolean;
  currentRound?: number;
  totalRounds?: number;
  roundTime?: number;
  musicProvider: 'youtube' | 'spotify';
  spotifyToken: string;
  gameVariant?: 'classic' | 'whoAdded';
}

interface GuessResult {
  username: string;
  guess: string;
  correct: boolean;
  points: number;
  hasGuessedAll: boolean;
}

const SongGame: React.FC<SongGameProps> = ({ 
  lobbyId, 
  currentUser, 
  scores, 
  isHost,
  currentRound = 1,
  totalRounds = 5,
  roundTime = 20,
  musicProvider,
  spotifyToken,
  gameVariant = 'classic'
}) => {
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(roundTime);
  const [showVideo, setShowVideo] = useState(false);
  const [gameScores, setGameScores] = useState<Record<string, number>>(scores);
  const [guesses, setGuesses] = useState<GuessResult[]>([]);
  const [guess, setGuess] = useState('');
  const [hasGuessedAll, setHasGuessedAll] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRoundDisplay, setCurrentRoundDisplay] = useState(currentRound);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    const setupSocketListeners = () => {
      console.log('Setting up socket listeners');
      
      socket.on('song_start', (data) => {
        const { videoId, spotifyId, songInfo } = data;
        console.log('Song start received:', { videoId, spotifyId, songInfo });
        
        if (songInfo) {
          const newSong: Track = {
            id: spotifyId || videoId,
            videoId,
            title: songInfo.title,
            artist: songInfo.artist,
            addedBy: songInfo.addedBy
          };
          console.log('Setting current song:', newSong);
          setCurrentSong(newSong);
          setTimeLeft(roundTime);
          setShowVideo(false);
          setHasGuessedAll(false);
          setGuesses([]);
          setIsPlaying(true);
          setGameOver(false);
        } else {
          console.error('Received incomplete song data:', data);
        }
      });

      socket.on('time_update', ({ timeLeft }) => {
        setTimeLeft(timeLeft);
      });

      socket.on('show_answer', () => {
        console.log('Showing answer');
        setShowVideo(true);
        setIsPlaying(true);
      });

      socket.on('lobby_update', (state) => {
        console.log('Received lobby update:', state);
        if (state.currentRound) {
          setCurrentRoundDisplay(state.currentRound);
        }
        if (state.gameState === 'waiting') {
          setGameOver(true);
        }
        // If there's a current song in the state, make sure we have it
        if (state.currentSong && !currentSong) {
          setCurrentSong(state.currentSong);
        }
      });

      socket.on('game_over', ({ finalScores }) => {
        console.log('Game over, final scores:', finalScores);
        setGameScores(finalScores);
        setGameOver(true);
        setShowVideo(false);
        setIsPlaying(false);
      });

      socket.on('guess_result', (result: GuessResult) => {
        console.log('Guess result received:', result);
        setGuesses(prev => [...prev, {
          ...result,
          guess: result.correct && result.username !== currentUser 
            ? '✓ [Correct Answer]' 
            : result.guess
        }]);
        if (result.username === currentUser) {
          setHasGuessedAll(result.hasGuessedAll);
        }
      });

      socket.on('scores_update', (newScores) => {
        console.log('Scores updated:', newScores);
        setGameScores(newScores);
      });
    };

    setupSocketListeners();

    return () => {
      socket.off('song_start');
      socket.off('time_update');
      socket.off('show_answer');
      socket.off('lobby_update');
      socket.off('guess_result');
      socket.off('scores_update');
      socket.off('game_over');
    };
  }, [currentUser, roundTime]);

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || hasGuessedAll || showVideo) return;

    console.log('Submitting guess:', guess);
    socket.emit('make_guess', {
      lobbyId,
      username: currentUser,
      guess: guess.trim()
    });
    setGuess('');
  };

  const nextSong = () => {
    console.log('Requesting next song');
    socket.emit('next_song', { lobbyId });
  };

  const sortedScores = Object.entries(gameScores)
    .sort(([, a], [, b]) => b - a);

  if (gameOver) {
    return (
      <div className="bg-black/40 rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Game Over!</h2>
        <div className="max-w-md mx-auto bg-black/20 rounded-lg p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Final Scores
          </h3>
          <div className="space-y-2">
            {sortedScores.map(([username, score], index) => (
              <div
                key={username}
                className={`p-3 rounded-md ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-300' :
                  username === currentUser ? 'bg-purple-500/20 text-purple-300' :
                  'bg-white/5 text-gray-300'
                } flex justify-between items-center`}
              >
                <span>{username} {index === 0 && '👑'}</span>
                <span className="font-mono text-lg">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderSongDetails = () => {
    if (!currentSong || !showVideo) return null;

    return (
      <div className="bg-black/40 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-2">
          <Disc className="w-5 h-5 text-purple-400" />
          <span className="text-lg font-semibold text-white">{currentSong.title}</span>
        </div>
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-400" />
          <span className="text-gray-300">{currentSong.artist}</span>
        </div>
        {currentSong.addedBy && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <User className="w-4 h-4 text-green-400" />
            <span>Added by: {currentSong.addedBy.displayName}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3 space-y-6">
        <div className="bg-black/40 rounded-lg p-4 relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 bg-black/60 px-3 py-1 rounded-full text-white text-sm">
            Round {currentRoundDisplay} / {totalRounds}
          </div>
          
          {currentSong && (
            <div className={`transition-opacity duration-500 ${showVideo ? 'opacity-100' : 'opacity-0'}`}>
              {musicProvider === 'spotify' ? (
                isHost && spotifyToken ? (
                  <div className={showVideo ? 'visible' : 'invisible'}>
                    <SpotifyPlayer
                      token={spotifyToken}
                      uris={[`spotify:track:${currentSong.id}`]}
                      play={isPlaying}
                      magnifySliderOnHover={true}
                      styles={{
                        bgColor: 'transparent',
                        color: '#fff',
                        trackNameColor: '#fff',
                        trackArtistColor: '#ccc',
                        sliderColor: '#1cb954'
                      }}
                    />
                  </div>
                ) : (
                  renderSongDetails()
                )
              ) : (
                <YouTube
                  videoId={currentSong.videoId}
                  opts={{
                    width: '100%',
                    height: '400',
                    playerVars: {
                      autoplay: 1,
                      controls: 0,
                      modestbranding: 1
                    },
                  }}
                  className="rounded-lg overflow-hidden"
                />
              )}
            </div>
          )}
          
          {!showVideo && currentSong && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Music className="w-16 h-16 text-white/50 mx-auto animate-bounce" />
                <div className="text-4xl font-bold text-white mt-4">{timeLeft}s</div>
                {gameVariant === 'whoAdded' && (
                  <div className="mt-4 text-xl text-white">
                    {currentSong.title} - {currentSong.artist}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleGuess} className="flex gap-2">
          <input
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            disabled={hasGuessedAll || showVideo}
            placeholder={
              gameVariant === 'classic'
                ? "Enter your guess (Song - Artist)"
                : "Who added this song?"
            }
            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={hasGuessedAll || showVideo}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guess
          </button>
        </form>

        <div className="space-y-2">
          {guesses.map((guess, index) => (
            <div
              key={index}
              className={`p-2 rounded-md ${
                guess.correct
                  ? 'bg-green-500/20 text-green-300'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              <span className="font-medium">{guess.username}:</span> {guess.guess}
              {guess.correct && <span className="ml-2">+{guess.points} points!</span>}
            </div>
          ))}
        </div>

        {isHost && showVideo && (
          <button
            onClick={nextSong}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-md hover:from-blue-600 hover:to-indigo-700"
          >
            <FastForward className="w-5 h-5" />
            <span>Next Song</span>
          </button>
        )}
      </div>

      <div className="bg-black/20 rounded-lg p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Scoreboard
        </h3>
        <div className="space-y-2">
          {sortedScores.map(([username, score]) => (
            <div
              key={username}
              className={`p-2 rounded-md ${
                username === currentUser
                  ? 'bg-purple-500/20 text-purple-300'
                  : 'bg-white/5 text-gray-300'
              } flex justify-between items-center`}
            >
              <span>{username}</span>
              <span className="font-mono">{score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SongGame;