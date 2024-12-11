import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface MemoryMatchProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const SYMBOLS = ['🎮', '🎲', '🎯', '🎪', '🎨', '🎭', '🎪', '🎯', '🎲', '🎮', '🎨', '🎭'];

const MemoryMatch: React.FC<MemoryMatchProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [cards, setCards] = useState<{ symbol: string; flipped: boolean; matched: boolean }[]>([]);
  const [flippedIndexes, setFlippedIndexes] = useState<number[]>([]);
  const [score, setScore] = useState(0);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const shuffledCards = [...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map(symbol => ({ symbol, flipped: false, matched: false }));
    setCards(shuffledCards);
    setFlippedIndexes([]);
  };

  const handleCardClick = (index: number) => {
    if (flippedIndexes.length === 2 || cards[index].flipped || cards[index].matched) return;

    const newCards = [...cards];
    newCards[index].flipped = true;
    setCards(newCards);

    const newFlippedIndexes = [...flippedIndexes, index];
    setFlippedIndexes(newFlippedIndexes);

    if (newFlippedIndexes.length === 2) {
      const [firstIndex, secondIndex] = newFlippedIndexes;
      if (cards[firstIndex].symbol === cards[secondIndex].symbol) {
        setTimeout(() => {
          const matchedCards = [...cards];
          matchedCards[firstIndex].matched = true;
          matchedCards[secondIndex].matched = true;
          setCards(matchedCards);
          setFlippedIndexes([]);
          const newScore = 1;
          setScore(score + newScore);
          onScore(newScore);
        }, 500);
      } else {
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIndex].flipped = false;
          resetCards[secondIndex].flipped = false;
          setCards(resetCards);
          setFlippedIndexes([]);
        }, 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="grid grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <button
            key={index}
            onClick={() => handleCardClick(index)}
            className={`w-20 h-20 flex items-center justify-center text-3xl rounded-lg transition-all duration-300 transform ${
              card.flipped || card.matched
                ? 'bg-purple-500 rotate-0'
                : 'bg-gray-700 rotate-180'
            }`}
          >
            {(card.flipped || card.matched) && card.symbol}
          </button>
        ))}
      </div>
      <div className="mt-8 text-xl text-white">Matches: {score}</div>
    </div>
  );
};

export default MemoryMatch;