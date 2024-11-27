import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Trophy } from 'lucide-react';
import { MinigameConfig } from '../types/games';
import MinigameSplash from './minigames/MinigameSplash';
import WhackAMole from './minigames/WhackAMole';
import ButtonMash from './minigames/ButtonMash';
import ColorClick from './minigames/ColorClick';
import QuickMath from './minigames/QuickMath';
import TypeSpeed from './minigames/TypeSpeed';
import MemoryMatch from './minigames/MemoryMatch';

interface GameProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
  isHost?: boolean;
}

const Game: React.FC<GameProps> = ({ lobbyId, currentUser, scores, isHost }) => {
  const [currentGame, setCurrentGame] = useState<MinigameConfig | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameScores, setGameScores] = useState<Record<string, number>>(scores);

  useEffect(() => {
    socket.on('minigame_splash_start', (game: MinigameConfig) => {
      setCurrentGame(game);
      setShowSplash(true);
    });

    socket.on('minigame_start', (game: MinigameConfig) => {
      setCurrentGame(game);
      setTimeLeft(game.duration);
    });

    socket.on('minigame_tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('scores_update', (newScores) => {
      setGameScores(newScores);
    });

    return () => {
      socket.off('minigame_splash_start');
      socket.off('minigame_start');
      socket.off('minigame_tick');
      socket.off('scores_update');
    };
  }, []);

  const handleScore = (score: number) => {
    socket.emit('minigame_action', {
      lobbyId,
      username: currentUser,
      action: currentGame?.type,
      data: { score }
    });
  };

  const renderGame = () => {
    if (!currentGame) return null;

    const props = {
      lobbyId,
      currentUser,
      onScore: handleScore,
      timeLeft
    };

    switch (currentGame.type) {
      case 'whackamole':
        return <WhackAMole {...props} />;
      case 'buttonmash':
        return <ButtonMash {...props} />;
      case 'colorclick':
        return <ColorClick {...props} />;
      case 'quickmath':
        return <QuickMath {...props} />;
      case 'typespeed':
        return <TypeSpeed {...props} />;
      case 'memorymatch':
        return <MemoryMatch {...props} />;
      default:
        return null;
    }
  };

  const sortedScores = Object.entries(gameScores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3">
        <div className="aspect-square bg-black/20 rounded-lg p-4 relative">
          {showSplash && currentGame && (
            <MinigameSplash
              game={currentGame}
              onComplete={() => setShowSplash(false)}
            />
          )}
          {!showSplash && renderGame()}
        </div>
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

export default Game;