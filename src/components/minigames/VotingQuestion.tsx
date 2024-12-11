import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { FastForward } from 'lucide-react';

interface VotingQuestionProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string; isHost?: boolean }[];
  question: { id: string; text: string };
}

const VotingQuestion: React.FC<VotingQuestionProps> = ({
  lobbyId,
  currentUser,
  timeLeft,
  users,
  question
}) => {
  const [hasVoted, setHasVoted] = useState(false);
  const [votedUsers, setVotedUsers] = useState<string[]>([]);
  const [results, setResults] = useState<{ username: string; votes: number }[] | null>(null);

  const isHost = users.find(u => u.username === currentUser)?.isHost ?? false;

  useEffect(() => {
    socket.on('vote_update', ({ votedUsers }) => {
      setVotedUsers(votedUsers);
    });

    socket.on('voting_results', ({ results }) => {
      setResults(results);
    });

    return () => {
      socket.off('vote_update');
      socket.off('voting_results');
    };
  }, []);

  const handleVote = (votedFor: string) => {
    if (hasVoted || votedFor === currentUser) return;
    socket.emit('cast_vote', { lobbyId, votedFor });
    setHasVoted(true);
  };

  const handleProceedToShop = () => {
    socket.emit('proceed_to_shop', { lobbyId });
  };

  const getVoteStatus = () => {
    const totalUsers = users.length;
    const votedCount = votedUsers.length;
    return `${votedCount}/${totalUsers} votes cast`;
  };

  if (results) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="bg-black/40 p-6 rounded-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-white mb-4">Voting Results</h2>
          <div className="space-y-2 mb-6">
            {results.map((result, index) => (
              <div
                key={result.username}
                className={`p-3 rounded-md ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-gray-300'
                } flex justify-between items-center`}
              >
                <span>{result.username} {index === 0 && '👑'}</span>
                <span>{result.votes} vote{result.votes !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {isHost && (
            <button
              onClick={handleProceedToShop}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors"
            >
              <FastForward className="w-5 h-5" />
              <span>Continue to Shop</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      {!results && (
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
       )}
      <div className="text-2xl text-white mb-8 text-center">{question.text}</div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
        {users.filter(u => u.username !== currentUser).map((user) => (
          <button
            key={user.username}
            onClick={() => handleVote(user.username)}
            disabled={hasVoted}
            className={`p-4 rounded-lg transition-colors ${
              hasVoted
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } ${
              votedUsers.includes(user.username)
                ? 'border-2 border-green-500'
                : ''
            }`}
          >
            <span className="text-white font-medium">{user.username}</span>
            {votedUsers.includes(user.username) && (
              <span className="ml-2 text-green-400">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-8 text-gray-300">{getVoteStatus()}</div>
    </div>
  );
};

export default VotingQuestion;