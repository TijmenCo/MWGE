import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface ReactionTimeProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const ReactionTime: React.FC<ReactionTimeProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [state, setState] = useState<'waiting' | 'ready' | 'clicked'>('waiting');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (state === 'waiting') {
      const delay = Math.random() * 3000 + 1000; // Random delay between 1-4 seconds
      const timeout = setTimeout(() => {
        setState('ready');
        setStartTime(Date.now());
      }, delay);
      return () => clearTimeout(timeout);
    }
  }, [state]);

  const handleClick = () => {
    if (state === 'ready' && startTime) {
      const reactionTime = Date.now() - startTime;
      const points = Math.max(0, Math.floor(1000 - reactionTime));
      const newScore = points;
      setScore(score + points);
      onScore(newScore);
    } else if (state === 'waiting') {
      // Clicked too early
      setScore(Math.max(0, score - 100));
      onScore(score)
    }

    setAttempts(attempts + 1);
    setState('waiting');
    setStartTime(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      <button
        onClick={handleClick}
        className={`w-48 h-48 rounded-full text-white text-2xl font-bold transition-colors duration-200 ${
          state === 'ready'
            ? 'bg-green-500 hover:bg-green-600'
            : 'bg-red-500 hover:bg-red-600'
        }`}
      >
        {state === 'ready' ? 'CLICK!' : 'Wait...'}
      </button>
      <div className="mt-4 text-gray-300">Attempts: {attempts}</div>
    </div>
  );
};

export default ReactionTime;