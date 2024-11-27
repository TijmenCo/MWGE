import React, { useEffect } from 'react';
import { MinigameConfig } from '../../types/games';
import { socket } from '../../socket';

interface MinigameSplashProps {
  game: MinigameConfig;
  onComplete: () => void;
}

const MinigameSplash: React.FC<MinigameSplashProps> = ({ game, onComplete }) => {
  useEffect(() => {
    const handleSplashEnd = () => {
      onComplete();
    };

    socket.on('minigame_splash_end', handleSplashEnd);

    return () => {
      socket.off('minigame_splash_end', handleSplashEnd);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">{game.name}</h2>
        <p className="text-2xl text-gray-300 mb-8">{game.instruction}</p>
        <div className="text-6xl font-bold text-white animate-pulse">Get Ready!</div>
      </div>
    </div>
  );
};

export default MinigameSplash;