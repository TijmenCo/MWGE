import React, { useState, useEffect } from 'react';
import { socket } from '../socket';
import { Trophy, ShoppingBag } from 'lucide-react';
import { MinigameConfig } from '../types/games';
import { PlayerInventory } from '../types/shop';
import MinigameSplash from './minigames/MinigameSplash';
import WhackAMole from './minigames/WhackAMole';
import ButtonMash from './minigames/ButtonMash';
import ColorClick from './minigames/ColorClick';
import QuickMath from './minigames/QuickMath';
import TypeSpeed from './minigames/TypeSpeed';
import MemoryMatch from './minigames/MemoryMatch';
import ShopModal from './shop/ShopModal';
import PowerUpInventory from './PowerUpInventory';
import ReactionTime from './minigames/ReactionTime';
import PatternMemory from './minigames/PaternMemory';
import WordScramble from './minigames/WordScramble';
import VotingQuestion from './minigames/VotingQuestion';

interface GameProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
  isHost: boolean;
}

interface User {
  username: string;
  isHost: boolean;
  color: string;
}

const Game: React.FC<GameProps> = ({ lobbyId, currentUser, scores, isHost }) => {
  const [currentGame, setCurrentGame] = useState<MinigameConfig | null>(null);
  const [showSplash, setShowSplash] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameScores, setGameScores] = useState<Record<string, number>>(scores);
  const [showShop, setShowShop] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [inventory, setInventory] = useState<PlayerInventory>({
    powerUps: {},
    points: scores[currentUser] || 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [votingQuestion, setVotingQuestion] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {
    socket.on('minigame_splash_start', (game: MinigameConfig & { votingQuestion?: { id: string; text: string } }) => {
      setCurrentGame(game);
      if (game.votingQuestion) {
        setVotingQuestion(game.votingQuestion);
      }
      setShowSplash(true);
      setShowShop(false);
      setGameOver(false);
    });

    socket.on('minigame_start', (game: MinigameConfig & { votingQuestion?: { id: string; text: string } }) => {
      setCurrentGame(game);
      if (game.votingQuestion) {
        setVotingQuestion(game.votingQuestion);
      }
      setTimeLeft(game.duration);
      setShowShop(false);
    });

    socket.on('minigame_end', () => {
      setShowShop(true);
      setCurrentGame(null);
      setVotingQuestion(null);
    });

    socket.on('game_over', ({ finalScores }) => {
      setGameScores(finalScores);
      setGameOver(true);
      setShowShop(false);
      setCurrentGame(null);
      setVotingQuestion(null);
    });

    socket.on('minigame_tick', ({ timeLeft }) => {
      setTimeLeft(timeLeft);
    });

    socket.on('scores_update', (newScores) => {
      setGameScores(newScores);
      setInventory((prev) => ({
        ...prev,
        points: newScores[currentUser] || 0,
      }));
    });

    socket.on('power_up_purchased', ({ username, inventory: newInventory }) => {
      if (username === currentUser) {
        setInventory((prev) => ({
          ...prev,
          powerUps: newInventory,
        }));
      }
    });

    socket.on('lobby_update', (state) => {
      if (state.users) {
        setUsers(state.users);
      }
    });

    socket.emit('request_lobby_state', { lobbyId });

    return () => {
      socket.off('minigame_splash_start');
      socket.off('minigame_start');
      socket.off('minigame_end');
      socket.off('game_over');
      socket.off('minigame_tick');
      socket.off('scores_update');
      socket.off('power_up_purchased');
      socket.off('lobby_update');
    };
  }, [currentUser, lobbyId]);

  const handleScore = (score: number) => {
    socket.emit('minigame_action', {
      lobbyId,
      username: currentUser,
      action: currentGame?.type,
      data: { score },
    });
  };

  const renderGame = () => {
    if (!currentGame) return null;

    const props = {
      lobbyId,
      currentUser,
      onScore: handleScore,
      timeLeft,
      users,
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
      case 'reactiontime':
        return <ReactionTime {...props} />;
      case 'patternmemory':
        return <PatternMemory {...props} />;
      case 'wordscramble':
        return <WordScramble {...props} />;
      case 'votingquestion':
        return votingQuestion ? <VotingQuestion {...props} question={votingQuestion} /> : null;
      default:
        return null;
    }
  };

  const sortedScores = Object.entries(gameScores).sort(([, a], [, b]) => b - a);

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
                  index === 0
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : username === currentUser
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/5 text-gray-300'
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
          {!currentGame && !showShop && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-white text-xl">
                {isHost ? 'Start the next minigame when ready!' : 'Waiting for host to start next minigame...'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black/20 rounded-lg p-4 border border-white/10">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Scoreboard
            </h3>
            {!gameOver && (
              <button
                onClick={() => setShowShop(true)}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="text-sm">Shop</span>
              </button>
            )}
          </div>
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

        <PowerUpInventory
          inventory={inventory}
          lobbyId={lobbyId}
          currentUser={currentUser}
          users={users}
        />
      </div>

      {showShop && !gameOver && (
        <ShopModal
          isOpen={true}
          onClose={() => setShowShop(false)}
          lobbyId={lobbyId}
          currentUser={currentUser}
          inventory={inventory}
          isHost={isHost}
        />
      )}
    </div>
  );
};

export default Game;
