import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';
import DrinkModal from '../DrinkCommandModal';

interface VotingQuestionProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string }[];
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
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    socket.on('vote_update', ({ votedUsers }) => {
      setVotedUsers(votedUsers);
    });

    socket.on('voting_results', ({ results, question }) => {
      setResults(results);
      setShowModal(true);
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

  const getVoteStatus = () => {
    const totalUsers = users.length;
    const votedCount = votedUsers.length;
    return `${votedCount}/${totalUsers} votes cast`;
  };

  if (results) {
    return (
      <DrinkModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        message={`Results for "${question.text}":
          ${results.map((r, i) => `
            ${i + 1}. ${r.username}: ${r.votes} vote${r.votes !== 1 ? 's' : ''}`).join('')}`}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
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