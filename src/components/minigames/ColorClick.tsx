import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface ColorClickProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];

const ColorClick: React.FC<ColorClickProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [targetColor, setTargetColor] = useState('');
  const [score, setScore] = useState(0);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    generateNewRound();
  }, []);

  const generateNewRound = () => {
    const newTarget = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shuffled = [...COLORS].sort(() => Math.random() - 0.5);
    setTargetColor(newTarget);
    setOptions(shuffled);
  };

  const handleColorClick = (color: string) => {
    if (color === targetColor) {
      const newScore = score + 1;
      setScore(newScore);
      onScore(newScore);
      socket.emit('minigame_action', {
        lobbyId,
        username: currentUser,
        action: 'colorclick',
        data: { score: newScore }
      });
      generateNewRound();
    }
  };

  const getColorClass = (color: string) => {
    const baseClasses = "w-24 h-24 rounded-lg cursor-pointer transform hover:scale-105 transition-transform";
    const colorClasses: Record<string, string> = {
      red: "bg-red-500",
      blue: "bg-blue-500",
      green: "bg-green-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500"
    };
    return `${baseClasses} ${colorClasses[color]}`;
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-4">{timeLeft}s</div>
      <div className="text-2xl text-white mb-8">Click {targetColor}!</div>
      <div className="grid grid-cols-3 gap-4">
        {options.map((color, index) => (
          <button
            key={index}
            onClick={() => handleColorClick(color)}
            className={getColorClass(color)}
          />
        ))}
      </div>
      <div className="mt-8 text-xl text-white">Score: {score}</div>
    </div>
  );
};

export default ColorClick;