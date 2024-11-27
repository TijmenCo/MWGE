import React, { useEffect, useState } from 'react';
import { MinigameConfig } from '../../types/games';

interface MinigameSplashProps {
  game: MinigameConfig;
  onComplete: () => void;
}

const MinigameSplash: React.FC<MinigameSplashProps> = ({ game, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-white mb-4">{game.name}</h2>
        <p className="text-2xl text-gray-300 mb-8">{game.instruction}</p>
        <div className="text-6xl font-bold text-white animate-pulse">{timeLeft}</div>
      </div>
    </div>
  );
};

export default MinigameSplash;