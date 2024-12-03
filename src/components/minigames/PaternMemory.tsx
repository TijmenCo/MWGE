import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface PatternMemoryProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow'];
const INITIAL_PATTERN_LENGTH = 3;

const PatternMemory: React.FC<PatternMemoryProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [playerPattern, setPlayerPattern] = useState<number[]>([]);
  const [isShowingPattern, setIsShowingPattern] = useState(false);
  const [score, setScore] = useState(0);
  const [currentLength, setCurrentLength] = useState(INITIAL_PATTERN_LENGTH);

  const generatePattern = () => {
    const newPattern = Array.from({ length: currentLength }, () =>
      Math.floor(Math.random() * COLORS.length)
    );
    setPattern(newPattern);
    setPlayerPattern([]);
    setIsShowingPattern(true);
    showPattern(newPattern);
  };

  const showPattern = async (patternToShow: number[]) => {
    for (let i = 0; i < patternToShow.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setIsShowingPattern(false);
  };

  useEffect(() => {
    generatePattern();
  }, [currentLength]);

  const handleColorClick = (colorIndex: number) => {
    if (isShowingPattern) return;

    const newPlayerPattern = [...playerPattern, colorIndex];
    setPlayerPattern(newPlayerPattern);

    if (newPlayerPattern[newPlayerPattern.length - 1] !== pattern[newPlayerPattern.length - 1]) {
      // Wrong color
      setCurrentLength(INITIAL_PATTERN_LENGTH);
      generatePattern();
      return;
    }

    if (newPlayerPattern.length === pattern.length) {
      // Completed pattern correctly
      const newScore = score + currentLength;
      setScore(newScore);
      onScore(newScore);
      socket.emit('minigame_action', {
        lobbyId,
        username: currentUser,
        action: 'patternmemory',
        data: { score: newScore }
      });
      setCurrentLength(currentLength + 1);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      <div className="grid grid-cols-2 gap-4">
        {COLORS.map((color, index) => (
          <button
            key={index}
            onClick={() => handleColorClick(index)}
            disabled={isShowingPattern}
            className={`w-24 h-24 rounded-lg transition-transform ${
              pattern[playerPattern.length] === index && isShowingPattern
                ? 'scale-110 brightness-150'
                : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="mt-4 text-white">
        Pattern Length: {currentLength}
      </div>
    </div>
  );
};

export default PatternMemory;