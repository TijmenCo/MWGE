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
import WordScramble from './minigames/WordScramble';
import VotingQuestion from './minigames/VotingQuestion';
import QuizGame from './minigames/QuizGame';
import SequenceRepeat from './minigames/SequenceRepeat';
import FallingCatch from './minigames/FallingCatch';
import TargetShoot from './minigames/TargetShoot';
import Roulette from './minigames/Roulette';
import HorseRacing from './minigames/HorseRacing';

interface GameProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
  isHost: boolean;
  totalRounds: number | undefined;
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
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [inventory, setInventory] = useState<PlayerInventory>({
    powerUps: {},
    points: scores[currentUser] || 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [votingQuestion, setVotingQuestion] = useState<{ id: string; text: string } | null>(null);

  useEffect(() => {

    const handlePowerUpUsed = ({ username, powerUpId, inventory: newInventory }: { 
      username: string; 
      powerUpId: string; 
      inventory: Record<string, number>;
    }) => {
      if (username === currentUser) {
        setInventory(prev => ({
          ...prev,
          powerUps: newInventory
        }));
      }
    };

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
      setCurrentRound(game.currentGameIndex + 1); // Assuming `currentRound` is part of the `game` object
      setTotalRounds(game.totalGames); // Set total games
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
      console.log("scores_update")
      console.log(inventory);
      console.log(newScores)
      console.log(newScores[currentUser])
      setGameScores(newScores);
      setInventory((prev) => ({
        ...prev,
        points: newScores[currentUser],
      }));

      console.log("Updated inventory in Scores_Updates:", inventory);
    });

    socket.on('power_up_purchased', ({ username, powerUpId, newPoints, inventory: newInventory }) => {
      console.log("Power-up purchased");
      console.log({ username, powerUpId, newPoints, inventory: newInventory }); // Log all received data
    
      if (username === currentUser) {
        setInventory((prev) => ({
          ...prev,
          powerUps: newInventory, // Update powerUps
          points: newPoints,      // Update points
        }));
      }
    
      console.log("Updated inventory:", inventory);
    });
    

    socket.on('lobby_update', (state) => {
      if (state.users) {
        setUsers(state.users);
      }
    });

    socket.on('power_up_used', handlePowerUpUsed);

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
      socket.off('power_up_used', handlePowerUpUsed);
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
  
    return (
      <>
        {/* Current round display */}
        <div className="text-center mb-4">
          <h3 className="text-white font-semibold">
            Round {currentRound} of {totalRounds || 'Unknown'}
          </h3>
        </div>
        {/* Render game based on type */}
        {(() => {
          switch (currentGame.type) {
            case 'whackamole':
              return <WhackAMole {...props} />;
            case 'quiz':
              return <QuizGame {...props} />;
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
            case 'wordscramble':
              return <WordScramble {...props} />;
            case 'votingquestion':
              return votingQuestion ? <VotingQuestion {...props} question={votingQuestion} /> : null;
            case 'sequencerepeat':
              return <SequenceRepeat {...props} />;
            case 'fallingcatch':
              return <FallingCatch {...props} />;
            case 'targetshoot':
              return <TargetShoot {...props} />;
            case 'horseracing':
                return <HorseRacing {...props} />;
            case 'roulette':
                return <Roulette {...props} />;
            default:
              return null;
          }
        })()}
      </>
    );
  };
  

  const sortedScores = Object.entries(gameScores).sort(([, a], [, b]) => b - a);

  if (gameOver) {
    return (
      <div className="bg-black/40 rounded-lg p-4 sm:p-8 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">Game Over!</h2>
        <div className="max-w-md mx-auto bg-black/20 rounded-lg p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-4 flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
            Final Scores
          </h3>
          <div className="space-y-2">
            {sortedScores.map(([username, score], index) => (
              <div
                key={username}
                className={`p-2 sm:p-3 rounded-md ${
                  index === 0
                    ? 'bg-yellow-500/20 text-yellow-300'
                    : username === currentUser
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/5 text-gray-300'
                } flex justify-between items-center`}
              >
                <span className="text-sm sm:text-base">{username} {index === 0 && '👑'}</span>
                <span className="font-mono text-base sm:text-lg">{score}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
      <div className="lg:col-span-3">
        <div className="aspect-square bg-black/20 rounded-lg p-2 sm:p-4 relative">
          {showSplash && currentGame && (
            <MinigameSplash
              game={currentGame}
              onComplete={() => setShowSplash(false)}
            />
          )}
          {!showSplash && renderGame()}
          {!currentGame && !showShop && !gameOver && (
            <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
              <p className="text-white text-base sm:text-xl">
                {isHost ? 'Start the next minigame when ready!' : 'Waiting for host to start next minigame...'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-black/20 rounded-lg p-3 sm:p-4 border border-white/10">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-white font-semibold text-sm sm:text-base flex items-center gap-1 sm:gap-2">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
              Scoreboard
            </h3>
            {!gameOver && (
              <button
                onClick={() => setShowShop(true)}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 bg-purple-600 rounded-md hover:bg-purple-700 transition-colors text-xs sm:text-sm"
              >
                <ShoppingBag className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Shop</span>
              </button>
            )}
          </div>
          <div className="space-y-1 sm:space-y-2">
            {sortedScores.map(([username, score]) => (
              <div
                key={username}
                className={`p-1 sm:p-2 rounded-md ${
                  username === currentUser
                    ? 'bg-purple-500/20 text-purple-300'
                    : 'bg-white/5 text-gray-300'
                } flex justify-between items-center`}
              >
                <span className="text-xs sm:text-sm">{username}</span>
                <span className="font-mono text-xs sm:text-sm">{score}</span>
              </div>
            ))}
          </div>
        </div>

        <PowerUpInventory
          inventory={inventory}
          lobbyId={lobbyId}
          currentUser={currentUser}
          users={users}
          inShop={!currentGame}
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
