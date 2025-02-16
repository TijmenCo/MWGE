import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface WordScrambleProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const WORDS = [ 
  'REACT', 'GAME', 'CODE', 'PLAY', 'FUN',
  'JUMP', 'QUICK', 'ZOOM', 'HAPPY', 'SKILL',
  'LEVEL', 'SCORE', 'WIN', 'FAST', 'SMART',
  'LUCK', 'SPIN', 'RACE', 'GUESS', 'TIMER',
  'MOVE', 'SHARP', 'TAP', 'SWIPE', 'MATCH',
  'LOGIC', 'STACK', 'QUIZ', 'RIVAL', 'GOAL',
  'BLAST', 'FLIP', 'RUSH', 'TOKEN', 'QUEST'
];

const WordScramble: React.FC<WordScrambleProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [currentWord, setCurrentWord] = useState('');
  const [scrambledWord, setScrambledWord] = useState('');
  const [userInput, setUserInput] = useState('');
  const [score, setScore] = useState(0);

  const scrambleWord = (word: string) => {
    return word
      .split('')
      .sort(() => Math.random() - 0.5)
      .join('');
  };

  const generateNewWord = () => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setCurrentWord(word);
    setScrambledWord(scrambleWord(word));
    setUserInput('');
  };

  useEffect(() => {
    generateNewWord();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.toUpperCase() === currentWord) {
      const newScore = 4;
      setScore(score + newScore);
      onScore(newScore);
      generateNewWord();
    }
    setUserInput('');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-4xl text-white mb-8">{scrambledWord}</div>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value.toUpperCase())}
          className="w-48 px-4 py-2 text-2xl text-center bg-white/10 border border-white/20 rounded-md text-white"
          maxLength={currentWord.length}
          autoFocus
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md text-white font-bold"
        >
          Submit
        </button>
      </form>
      <div className="mt-8 text-xl text-white">Words Solved: {score}</div>
    </div>
  );
};

export default WordScramble;