import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface QuickMathProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const QuickMath: React.FC<QuickMathProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [problem, setProblem] = useState({ num1: 0, num2: 0, operator: '+', answer: 0 });
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);

  const generateProblem = () => {
    const operators = ['+', '-', '*'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const num1 = Math.floor(Math.random() * 12) + 1;
    const num2 = Math.floor(Math.random() * 12) + 1;
    let answer;

    switch (operator) {
      case '+':
        answer = num1 + num2;
        break;
      case '-':
        answer = num1 - num2;
        break;
      case '*':
        answer = num1 * num2;
        break;
      default:
        answer = 0;
    }

    setProblem({ num1, num2, operator, answer });
    setUserAnswer('');
  };

  useEffect(() => {
    generateProblem();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(userAnswer) === problem.answer) {
      const newScore = score + 1;
      setScore(newScore);
      onScore(newScore);
      socket.emit('minigame_action', {
        lobbyId,
        username: currentUser,
        action: 'quickmath',
        data: { score: newScore }
      });
      generateProblem();
    }
    setUserAnswer('');
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-4xl text-white mb-8">
        {problem.num1} {problem.operator} {problem.num2} = ?
      </div>
      <form onSubmit={handleSubmit} className="flex gap-4">
        <input
          type="number"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-24 px-4 py-2 text-2xl text-center bg-white/10 border border-white/20 rounded-md text-white"
          autoFocus
        />
        <button
          type="submit"
          className="px-6 py-2 bg-green-500 hover:bg-green-600 rounded-md text-white font-bold"
        >
          Submit
        </button>
      </form>
      <div className="mt-8 text-xl text-white">Score: {score}</div>
    </div>
  );
};

export default QuickMath;