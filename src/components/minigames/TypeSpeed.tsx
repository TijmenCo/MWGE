import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface TypeSpeedProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const WORDS = [
  'quick', 'brown', 'fox', 'jumps', 'lazy', 'dog',
  'hello', 'world', 'coding', 'game', 'speed', 'type',
  'fast', 'slow', 'jump', 'run', 'play', 'win'
];

const TypeSpeed: React.FC<TypeSpeedProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);

  const generateNewWord = () => {
    const newWord = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(newWord);
    setUserInput('');
  };

  useEffect(() => {
    generateNewWord();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setUserInput(input);

    if (input === currentWord) {
      const newScore = score + 1;
      setScore(newScore);
      onScore(newScore);
      socket.emit('minigame_action', {
        lobbyId,
        username: currentUser,
        action: 'typespeed',
        data: { score: newScore }
      });
      generateNewWord();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-4xl text-white mb-8">{currentWord}</div>
      <input
        type="text"
        value={userInput}
        onChange={handleInputChange}
        className="w-64 px-4 py-2 text-2xl text-center bg-white/10 border border-white/20 rounded-md text-white"
        autoFocus
      />
      <div className="mt-8 text-xl text-white">Words Typed: {score}</div>
    </div>
  );
};

export default TypeSpeed;