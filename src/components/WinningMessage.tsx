import React, { useEffect } from 'react';
import { fireWinConfetti } from '../utils/confetti';

interface WinningMessageProps {
  amount: number;
}

const WinningMessage: React.FC<WinningMessageProps> = ({ amount }) => {
  useEffect(() => {
    fireWinConfetti(amount);
  }, []);

  return (
    <div className="fixed inset-x-0 top-1/4 mx-auto px-4 z-50 flex justify-center items-center">
      <div className="bg-green-600/90 backdrop-blur-sm text-white px-8 py-4 rounded-lg shadow-lg animate-bounce max-w-sm w-full">
        <h2 className="text-xl md:text-2xl font-bold text-center mb-2">🎉 You Won! 🎉</h2>
        <p className="text-lg md:text-xl text-center">+{amount} points</p>
      </div>
    </div>
  );
};

export default WinningMessage;