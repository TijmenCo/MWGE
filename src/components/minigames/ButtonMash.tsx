import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface ButtonMashProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const ButtonMash: React.FC<ButtonMashProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [clicks, setClicks] = useState(0);

  const handleClick = () => {
    const newClicks = clicks + 5;
    setClicks(newClicks);
    socket.emit('minigame_action', {
      lobbyId,
      username: currentUser,
      action: 'buttonmash',
      data: { clicks: newClicks }
    });
    onScore(newClicks);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Clicks: {clicks}</div>
      <button
        onClick={handleClick}
        className="w-48 h-48 bg-red-500 hover:bg-red-600 rounded-full text-white text-4xl font-bold transform active:scale-95 transition-transform"
      >
        MASH!
      </button>
    </div>
  );
};

export default ButtonMash;