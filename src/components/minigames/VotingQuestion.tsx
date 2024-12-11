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
    const handleVoteUpdate = ({ votedUsers }: { votedUsers: string[] }) => {
      setVotedUsers(votedUsers);

      // End voting when all users have voted
      if (votedUsers.length === users.length) {
        socket.emit('voting_complete', { lobbyId });
      }
    };

    const handleVotingResults = ({ results }: { results: { username: string; votes: number }[] }) => {
      setResults(results);
    };

    socket.on('vote_update', handleVoteUpdate);
    socket.on('voting_results', handleVotingResults);

    return () => {
      socket.off('vote_update', handleVoteUpdate);
      socket.off('voting_results', handleVotingResults);
    };
  }, [lobbyId, users.length]);

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
      <div className="flex flex-col items-center justify-center h-full px-2 sm:px-4 w-full max-w-lg mx-auto">
        <div className="bg-black/40 p-3 sm:p-6 rounded-lg w-full">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">Voting Results</h2>
          <div className="space-y-2 mb-4 sm:mb-6">
            {results.map((result, index) => (
              <div
                key={result.username}
                className={`p-2 sm:p-3 rounded-md ${
                  index === 0 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-white/5 text-gray-300'
                } flex justify-between items-center`}
              >
                <span className="text-sm sm:text-base">{result.username} {index === 0 && '👑'}</span>
                <span className="text-sm sm:text-base">{result.votes} vote{result.votes !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
          {isHost && (
            <button
              onClick={handleProceedToShop}
              className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors text-sm sm:text-base"
            >
              <FastForward className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Continue to Shop</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-2 sm:px-4 w-full max-w-lg mx-auto">
      {!results && (
        <div className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-8">{timeLeft}s</div>
      )}
      <div className="text-lg sm:text-2xl text-white mb-4 sm:mb-8 text-center">{question.text}</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 w-full">
        {users.filter(u => u.username !== currentUser).map((user) => (
          <button
            key={user.username}
            onClick={() => handleVote(user.username)}
            disabled={hasVoted}
            className={`p-3 sm:p-4 rounded-lg transition-colors ${
              hasVoted
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-700'
            } ${
              votedUsers.includes(user.username)
                ? 'border-2 border-green-500'
                : ''
            }`}
          >
            <span className="text-white font-medium text-sm sm:text-base">{user.username}</span>
            {votedUsers.includes(user.username) && (
              <span className="ml-2 text-green-400">✓</span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-4 sm:mt-8 text-gray-300 text-sm sm:text-base">{getVoteStatus()}</div>
    </div>
  );
};

export default VotingQuestion;
