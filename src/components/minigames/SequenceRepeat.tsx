import React, { useState, useEffect } from 'react';

interface SequenceRepeatProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const COLORS = ['red', 'blue', 'green', 'yellow'];
const INITIAL_SEQUENCE_LENGTH = 3;

const SequenceRepeat: React.FC<SequenceRepeatProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSequence, setPlayerSequence] = useState<number[]>([]);
  const [isShowingSequence, setIsShowingSequence] = useState(false);
  const [score, setScore] = useState(0);
  const [currentLength, setCurrentLength] = useState(INITIAL_SEQUENCE_LENGTH);

  const generateSequence = () => {
    const newSequence = Array.from(
      { length: currentLength },
      () => Math.floor(Math.random() * COLORS.length)
    );
    setSequence(newSequence);
    setPlayerSequence([]);
    setIsShowingSequence(true);
    showSequence(newSequence);
  };

  const showSequence = async (sequenceToShow: number[]) => {
    for (let i = 0; i < sequenceToShow.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setIsShowingSequence(false);
  };

  useEffect(() => {
    generateSequence();
  }, [currentLength]);

  const handleColorClick = (colorIndex: number) => {
    if (isShowingSequence) return;

    const newPlayerSequence = [...playerSequence, colorIndex];
    setPlayerSequence(newPlayerSequence);

    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      // Wrong color
      setCurrentLength(INITIAL_SEQUENCE_LENGTH);
      generateSequence();
      return;
    }

    if (newPlayerSequence.length === sequence.length) {
      // Completed sequence correctly
      const newScore = currentLength;
      setScore(score + newScore + 2);
      onScore(newScore);
      setCurrentLength(currentLength + 1);
    }
  };

  const getColorClass = (color: string) => {
    const baseClasses = "w-24 h-24 rounded-lg cursor-pointer transition-all duration-200";
    const colorClasses: Record<string, string> = {
      red: "bg-red-500 hover:bg-red-600",
      blue: "bg-blue-500 hover:bg-blue-600",
      green: "bg-green-500 hover:bg-green-600",
      yellow: "bg-yellow-500 hover:bg-yellow-600"
    };
    return `${baseClasses} ${colorClasses[color]}`;
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
            disabled={isShowingSequence}
            className={`${getColorClass(color)} ${
              sequence[playerSequence.length] === index && isShowingSequence
                ? 'scale-110 brightness-150'
                : ''
            }`}
          />
        ))}
      </div>
      <div className="mt-4 text-white">
        Sequence Length: {currentLength}
      </div>
    </div>
  );
};

export default SequenceRepeat;