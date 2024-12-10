import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface QuizGameProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string }[];
}

interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
}

interface QuizResults {
  results: Array<{ username: string; answer: number }>;
  correctAnswer: number;
  correctUsers: string[];
  scores: Record<string, number>;
}

const QuizGame: React.FC<QuizGameProps> = ({
  lobbyId,
  onScore,
  currentUser,
  timeLeft,
  users
}) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredUsers, setAnsweredUsers] = useState<string[]>([]);
  const [results, setResults] = useState<QuizResults | null>(null);

  useEffect(() => {
    socket.on('quiz_question', (newQuestion: QuizQuestion) => {
      setQuestion(newQuestion);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnsweredUsers([]);
      setResults(null);
    });

    socket.on('quiz_answer_update', ({ answeredUsers }) => {
      setAnsweredUsers(answeredUsers);
    });

    socket.on('quiz_results', (results: QuizResults) => {
      setResults(results);
    });

    return () => {
      socket.off('quiz_question');
      socket.off('quiz_answer_update');
      socket.off('quiz_results');
    };
  }, []);

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || !question) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    socket.emit('quiz_answer', { lobbyId, answer: answerIndex });
  };

  const getAnswerButtonClass = (index: number) => {
    if (!results) {
      return `w-full p-4 rounded-lg transition-colors ${
        selectedAnswer === index
          ? 'bg-purple-600 text-white'
          : 'bg-white/5 hover:bg-white/10 text-white'
      }`;
    }

    if (index === results.correctAnswer) {
      return 'w-full p-4 rounded-lg bg-green-600 text-white';
    }

    if (selectedAnswer === index && selectedAnswer !== results.correctAnswer) {
      return 'w-full p-4 rounded-lg bg-red-600 text-white';
    }

    return 'w-full p-4 rounded-lg bg-white/5 text-white';
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      
      {question && (
        <div className="w-full max-w-2xl space-y-6">
          <h2 className="text-2xl text-white text-center mb-8">{question.text}</h2>
          
          <div className="grid grid-cols-1 gap-4">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={hasAnswered}
                className={getAnswerButtonClass(index)}
              >
                {option}
                {results && results.results.some(r => r.answer === index) && (
                  <span className="ml-2 text-sm">
                    ({results.results.filter(r => r.answer === index).length} votes)
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-300">
              {answeredUsers.length} / {users.length} players have answered
            </p>
            {results && (
              <div className="mt-4 text-green-400">
                {results.correctUsers.includes(currentUser)
                  ? 'You got it right! +10 points'
                  : 'Better luck next time!'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizGame;