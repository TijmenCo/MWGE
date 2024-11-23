import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { Trophy } from 'lucide-react';

interface GameProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
}

const Game: React.FC<GameProps> = ({ lobbyId, currentUser, scores }) => {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [gameScores, setGameScores] = useState<Record<string, number>>(scores);
  const [isAnimating, setIsAnimating] = useState<Record<number, boolean>>({});

  useEffect(() => {
    socket.on('mole_spawn', ({ position }) => {
      setActiveMole(position);
    });

    socket.on('mole_hide', ({ position }) => {
      setActiveMole(prev => prev === position ? null : prev);
    });

    socket.on('mole_whacked', ({ position, scores }) => {
      setIsAnimating(prev => ({ ...prev, [position]: true }));
      setTimeout(() => {
        setIsAnimating(prev => ({ ...prev, [position]: false }));
      }, 300);
      setGameScores(scores);
      setActiveMole(null);
    });

    return () => {
      socket.off('mole_spawn');
      socket.off('mole_hide');
      socket.off('mole_whacked');
    };
  }, []);

  const handleWhack = (position: number) => {
    if (activeMole === position) {
      socket.emit('whack_mole', { lobbyId, position, username: currentUser });
    }
  };

  const sortedScores = Object.entries(gameScores)
    .sort(([, a], [, b]) => b - a);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-3">
        <div className="aspect-square bg-gradient-to-br from-green-800 to-green-900 rounded-lg p-4 relative">
          <div className="grid grid-cols-3 gap-4 h-full">
            {Array.from({ length: 9 }).map((_, index) => (
              <div
                key={index}
                className="relative flex items-center justify-center"
                onClick={() => handleWhack(index)}
                onTouchStart={() => handleWhack(index)}
              >
                <div className="absolute bottom-0 w-4/5 h-1/3 bg-gradient-to-b from-brown-600 to-brown-800 rounded-full transform skew-x-6" />
                {activeMole === index && (
                  <div
                    className={`absolute bottom-1/4 w-16 h-16 bg-brown-400 rounded-full 
                      ${isAnimating[index] ? 'animate-whack' : 'animate-bounce'}
                      cursor-pointer touch-manipulation`}
                  >
                    <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black rounded-full" />
                    <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-full" />
                    <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-pink-300 rounded-full" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-black/20 rounded-lg p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Scoreboard
        </h3>
        <div className="space-y-2">
          {sortedScores.map(([username, score], index) => (
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