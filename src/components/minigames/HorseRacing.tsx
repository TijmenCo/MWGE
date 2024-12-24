import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { FastForward } from 'lucide-react';

interface HorseRacingProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string; isHost?: boolean }[];
}

interface Horse {
  id: number;
  name: string;
  position: number;
  odds: number;
}

const HorseRacing: React.FC<HorseRacingProps> = ({
  lobbyId,
  currentUser,
  onScore,
  timeLeft,
  users
}) => {
  const [horses] = useState<Horse[]>([
    { id: 1, name: "Lightning Bolt", position: 0, odds: 2.0 },
    { id: 2, name: "Thunder Hooves", position: 0, odds: 3.0 },
    { id: 3, name: "Wind Runner", position: 0, odds: 4.0 },
    { id: 4, name: "Lucky Star", position: 0, odds: 5.0 }
  ]);
  const [selectedHorse, setSelectedHorse] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [hasBet, setHasBet] = useState(false);
  const [bettingUsers, setBettingUsers] = useState<string[]>([]);
  const [raceStarted, setRaceStarted] = useState(false);
  const [winner, setWinner] = useState<Horse | null>(null);
  
  const isHost = users.find(u => u.username === currentUser)?.isHost ?? false;

  useEffect(() => {
    const handleBetUpdate = ({ bettingUsers }: { bettingUsers: string[] }) => {
      setBettingUsers(bettingUsers);
    };

    const handleRaceResult = ({ winningHorse, winners }: { winningHorse: Horse, winners: string[] }) => {
      setWinner(winningHorse);
      if (winners.includes(currentUser)) {
        const winnings = betAmount * winningHorse.odds;
        onScore(Math.floor(winnings));
      }
    };

    socket.on('horse_bet_update', handleBetUpdate);
    socket.on('horse_race_result', handleRaceResult);

    return () => {
      socket.off('horse_bet_update', handleBetUpdate);
      socket.off('horse_race_result', handleRaceResult);
    };
  }, [currentUser, betAmount, onScore]);

  const placeBet = () => {
    if (selectedHorse === null || hasBet) return;
    socket.emit('place_horse_bet', { lobbyId, horseId: selectedHorse, amount: betAmount });
    setHasBet(true);
  };

  const handleProceedToShop = () => {
    socket.emit('proceed_to_shop', { lobbyId });
  };

  if (winner) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-2xl font-bold text-white mb-4">
          {winner.name} Wins!
        </h2>
        {isHost && (
          <button
            onClick={handleProceedToShop}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            <FastForward className="w-5 h-5" />
            <span>Continue to Shop</span>
          </button>
        )}
      </div>
    );
  }

  if (!raceStarted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <h2 className="text-2xl font-bold text-white mb-4">Place Your Bets!</h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          {horses.map((horse) => (
            <button
              key={horse.id}
              onClick={() => !hasBet && setSelectedHorse(horse.id)}
              className={`p-4 rounded-lg ${
                selectedHorse === horse.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              <div className="font-bold">{horse.name}</div>
              <div className="text-sm">Odds: {horse.odds}x</div>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-white text-sm mb-2">Bet Amount</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => !hasBet && setBetAmount(Math.max(10, parseInt(e.target.value) || 0))}
            className="w-32 px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
            min="10"
            disabled={hasBet}
          />
        </div>

        <button
          onClick={placeBet}
          disabled={selectedHorse === null || hasBet}
          className="px-6 py-2 bg-green-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Place Bet
        </button>

        <div className="mt-4 text-gray-300">
          {bettingUsers.length} / {users.length} players have bet
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="w-full max-w-2xl bg-black/20 rounded-lg p-4">
        {horses.map((horse) => (
          <div
            key={horse.id}
            className="h-16 mb-4 bg-white/5 rounded-lg relative overflow-hidden"
          >
            <div
              className="absolute inset-y-0 left-0 bg-purple-600 transition-all duration-300"
              style={{ width: `${(horse.position / 100) * 100}%` }}
            />
            <div className="absolute inset-0 flex items-center px-4">
              <span className="text-white font-bold">{horse.name}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HorseRacing;