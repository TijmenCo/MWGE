import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';
import { FastForward, Minus, Plus, X } from 'lucide-react';
import RouletteWheel from '../RouletteWheel';

interface RouletteProps {
  lobbyId: string;
  currentUser: string;
  scores: Record<string, number>;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string; isHost?: boolean }[];
}

type BetType = 'red' | 'black' | 'green' | 'number';

interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

const NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0-36
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const Roulette: React.FC<RouletteProps> = ({
  lobbyId,
  currentUser,
  onScore,
  timeLeft,
  scores,
  users
}) => {
  const [selectedBetType, setSelectedBetType] = useState<BetType>('red');
  const [selectedNumber, setSelectedNumber] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [hasBet, setHasBet] = useState(false);
  const [bettingUsers, setBettingUsers] = useState<string[]>([]);
  const [spinStarted, setSpinStarted] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [isNumberModalOpen, setNumberModalOpen] = useState(false);
  
  const isHost = users.find(u => u.username === currentUser)?.isHost ?? false;

  useEffect(() => {
    const handleBetUpdate = ({ bettingUsers }: { bettingUsers: string[] }) => {
      setBettingUsers(bettingUsers);
    };

    const handleRouletteResult = ({ number, winners }: { number: number, winners: string[] }) => {
      setSpinStarted(true);
      
      setTimeout(() => {
        setResult(number);
        if (winners.includes(currentUser)) {
          let multiplier = 1;
          if (selectedBetType === 'number') multiplier = 35;
          else if (selectedBetType === 'green') multiplier = 17;
          else multiplier = 2;
          
          onScore(betAmount * multiplier);
        } else {
            onScore(-(betAmount))
        }
      }, 5000); // 5 seconds for the wheel to spin
    };

    socket.on('roulette_bet_update', handleBetUpdate);
    socket.on('roulette_result', handleRouletteResult);

    return () => {
      socket.off('roulette_bet_update', handleBetUpdate);
      socket.off('roulette_result', handleRouletteResult);
    };
  }, [currentUser, selectedBetType, betAmount, onScore]);

  const placeBet = () => {
    if (hasBet) return;
    
    const bet: Bet = {
      type: selectedBetType,
      value: selectedBetType === 'number' ? selectedNumber : selectedBetType,
      amount: betAmount
    };
    
    socket.emit('place_roulette_bet', { lobbyId, bet });
    setHasBet(true);
  };

  const handleProceedToShop = () => {
    socket.emit('proceed_to_shop', { lobbyId });
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-black-900';
  };

  const adjustBetAmount = (amount: number) => {
    if (!hasBet) {
      setBetAmount(prev => Math.max(10, prev + amount));
    }
  };

  const renderNumberSelectionModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-full w-full sm:w-4/5 lg:w-1/2 mx-4 border border-white/10 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Select a Number</h2>
          <button
            onClick={() => setNumberModalOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {NUMBERS.map((num) => (
            <button
              key={num}
              onClick={() => {
                setSelectedNumber(num);
                setNumberModalOpen(false);
              }}
              className={`w-12 h-12 rounded-full ${getNumberColor(num)} ${
                selectedNumber === num ? 'ring-2 ring-white' : ''
              } hover:opacity-80`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );


  if (result !== null) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full p-4">
        <RouletteWheel spinning={false} result={result} />
        <h2 className="text-xl md:text-2xl font-bold text-white mt-4 mb-4">
          Result: {result} {RED_NUMBERS.includes(result) ? '🔴' : result === 0 ? '💚' : '⚫'}
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

  if (!spinStarted) {
    return (
      <div className="h-full w-full flex flex-col overflow-y-auto">
        <div className="flex flex-col items-center justify-center w-full h-full p-4">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-4">Place Your Bets!</h2>
          <div className="grid grid-cols-2 gap-4 mt-6 mb-6">
            <button
              onClick={() => !hasBet && setSelectedBetType('red')}
              className={`p-4 rounded-lg ${
                selectedBetType === 'red'
                  ? 'bg-red-600 text-white'
                  : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              Red (2x)
            </button>
            <button
              onClick={() => !hasBet && setSelectedBetType('black')}
              className={`p-4 rounded-lg ${
                selectedBetType === 'black'
                  ? 'bg-gray-900 text-white'
                  : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              Black (2x)
            </button>
            <button
              onClick={() => !hasBet && setSelectedBetType('green')}
              className={`p-4 rounded-lg ${
                selectedBetType === 'green'
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              Green (17x)
            </button>
            <button
              onClick={() => {
                if (!hasBet) {
                  setSelectedBetType('number');
                  setNumberModalOpen(true);
                }
              }}
              className={`p-4 rounded-lg ${
                selectedBetType === 'number' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              Number (35x)
            </button>
          </div>

          {selectedBetType === 'number' && <p className="text-white">Selected: {selectedNumber}</p>}

          <div className="mb-6 w-full max-w-xs">
            <label className="block text-white text-sm mb-2">Bet Amount</label>
            <div className="flex items-center">
              <button
                onClick={() => adjustBetAmount(-10)}
                className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors"
                disabled={hasBet || betAmount <= 10}
              >
                <Minus className="w-4 h-4 text-gray-300" />
              </button>
              <input
                type="number"
                min="10"
                value={betAmount}
                onChange={(e) =>
                  !hasBet && setBetAmount(Math.max(10, parseInt(e.target.value) || 10))
                }
                className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                disabled={hasBet}
              />
              <button
                onClick={() => adjustBetAmount(1)}
                className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors"
                disabled={hasBet}
              >
                <Plus className="w-4 h-4 text-gray-300" />
              </button>
            </div>
          </div>

          <button
            onClick={placeBet}
            disabled={hasBet || betAmount > (scores[currentUser] || 0)}
            className={`w-full max-w-xs px-6 py-2 ${
              hasBet || betAmount > (scores[currentUser] || 0)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white rounded-md transition-colors`}
          >
            Place Bet
          </button>

          {isNumberModalOpen && renderNumberSelectionModal()}

          <div className="mt-4 text-gray-300 text-sm">
            {bettingUsers.length} / {users.length} players have bet
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4">
      <RouletteWheel spinning={true} result={null} />
      <p className="mt-4 text-xl text-white">Spinning...</p>
    </div>
  );
};

export default Roulette;
