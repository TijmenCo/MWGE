import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { FastForward } from 'lucide-react';

interface QuizGameProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string; isHost?: boolean }[];
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
  currentUser,
  timeLeft,
  onScore,
  users,
}) => {
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [answeredUsers, setAnsweredUsers] = useState<string[]>([]);
  const [results, setResults] = useState<QuizResults | null>(null);
  const isHost = users.find(u => u.username === currentUser)?.isHost ?? false;

  useEffect(() => {
    const handleQuizQuestion = (newQuestion: QuizQuestion) => {
      setQuestion(newQuestion);
      setSelectedAnswer(null);
      setHasAnswered(false);
      setAnsweredUsers([]);
      setResults(null);
    };

    const handleAnswerUpdate = ({
      answeredUsers,
    }: {
      answeredUsers: string[];
    }) => {
      setAnsweredUsers(answeredUsers);
    };

    const handleQuizResults = (results: QuizResults) => {
      if (results.correctUsers.find(user => user === currentUser.toString())) {
      const newScore = 10;
      onScore(newScore);
      }
      setResults(results);
    };
    

    socket.on('quiz_question', handleQuizQuestion);
    socket.on('quiz_answer_update', handleAnswerUpdate);
    socket.on('quiz_results', handleQuizResults);

    // Request current question state when component mounts
    socket.emit('request_quiz_state', { lobbyId });

    return () => {
      socket.off('quiz_question', handleQuizQuestion);
      socket.off('quiz_answer_update', handleAnswerUpdate);
      socket.off('quiz_results', handleQuizResults);
    };
  }, [lobbyId]);

  const handleAnswer = (answerIndex: number) => {
    if (hasAnswered || !question) return;

    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    socket.emit('quiz_answer', { lobbyId, answer: answerIndex });
  };

  const handleProceedToShop = () => {
    socket.emit('proceed_to_shop', { lobbyId });
  };

  const getAnswerButtonClass = (index: number) => {
    const baseClass =
      'w-full p-3 sm:p-4 rounded-lg transition-colors text-sm sm:text-base';
    if (!results) {
      return `${baseClass} ${
        selectedAnswer === index
          ? 'bg-purple-600 text-white'
          : 'bg-white/5 hover:bg-white/10 text-white'
      }`;
    }

    if (index === results.correctAnswer) {
      return `${baseClass} bg-green-600 text-white`;
    }

    if (selectedAnswer === index && selectedAnswer !== results.correctAnswer) {
      return `${baseClass} bg-red-600 text-white`;
    }

    return `${baseClass} bg-white/5 text-white`;
  };

  if (!question) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-white text-xl">Waiting for question...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 w-full max-w-lg mx-auto overflow-auto">
      {!results && (
        <div className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8">
          {timeLeft}s
        </div>
      )}

      <div className="w-full space-y-4 sm:space-y-6">
        <h2 className="text-lg sm:text-2xl font-semibold text-white text-center">
          {question.text}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={hasAnswered}
              className={getAnswerButtonClass(index)}
            >
              {option}
              {results &&
                results.results.some((r) => r.answer === index) && (
                  <span className="ml-2 text-sm">
                    (
                    {results.results.filter((r) => r.answer === index).length}{' '}
                    votes)
                  </span>
                )}
            </button>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-gray-300 text-sm">
            {answeredUsers.length} / {users.length} players have answered
          </p>
          {results && (
            <div className="mt-4 text-green-400">
              {results.correctUsers.includes(currentUser)
                ? 'You got it right! +10 points'
                : 'Better luck next time!'}
              {isHost && (
              <button
                onClick={handleProceedToShop}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors text-lg mt-4"
              >
                <FastForward className="w-5 h-5" />
                <span>Continue to Shop</span>
              </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizGame;
