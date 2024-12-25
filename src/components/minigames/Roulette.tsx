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

type BetType = 'red' | 'black' | 'green' | 'number' | 'first12' | 'second12' | 'third12' | 'even' | 'odd' | '1to18' | '19to36';

interface Bet {
  type: BetType;
  value: number | string;
  amount: number;
}

const NUMBERS = Array.from({ length: 37 }, (_, i) => i);
const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const FIRST_12 = Array.from({ length: 12 }, (_, i) => i + 1);
const SECOND_12 = Array.from({ length: 12 }, (_, i) => i + 13);
const THIRD_12 = Array.from({ length: 12 }, (_, i) => i + 25);

const getBetMultiplier = (betType: BetType): number => {
  switch (betType) {
    case 'number': return 35;
    case 'green': return 17;
    case 'first12':
    case 'second12':
    case 'third12': return 3;
    default: return 2;
  }
};

const isWinningBet = (betType: BetType, value: number | string, result: number): boolean => {
  switch (betType) {
    case 'red': return RED_NUMBERS.includes(result);
    case 'black': return result !== 0 && !RED_NUMBERS.includes(result);
    case 'green': return result === 0;
    case 'number': return result === Number(value);
    case 'first12': return FIRST_12.includes(result);
    case 'second12': return SECOND_12.includes(result);
    case 'third12': return THIRD_12.includes(result);
    case 'even': return result !== 0 && result % 2 === 0;
    case 'odd': return result % 2 === 1;
    case '1to18': return result >= 1 && result <= 18;
    case '19to36': return result >= 19 && result <= 36;
    default: return false;
  }
};

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
  const [isAdvancedBetsOpen, setAdvancedBetsOpen] = useState(false);
  
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
          const multiplier = getBetMultiplier(selectedBetType);
          onScore(betAmount * multiplier);
        } else {
          onScore(-betAmount);
        }
      }, 5000);
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
    setAdvancedBetsOpen(false);
  };

  const handleProceedToShop = () => {
    socket.emit('proceed_to_shop', { lobbyId });
  };

  const getNumberColor = (num: number) => {
    if (num === 0) return 'bg-green-600';
    return RED_NUMBERS.includes(num) ? 'bg-red-600' : 'bg-black';
  };

  const adjustBetAmount = (amount: number) => {
    if (!hasBet) {
      setBetAmount(prev => Math.max(0, prev + amount));
    }
  };

  const renderAdvancedBetsModal = () => (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-full w-full sm:w-4/5 lg:w-1/2 mx-4 border border-white/10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Advanced Bets</h2>
          <button
            onClick={() => setAdvancedBetsOpen(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => {
              setSelectedBetType('first12');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            1st 12 (1-12) - 3x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('second12');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            2nd 12 (13-24) - 3x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('third12');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            3rd 12 (25-36) - 3x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('even');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Even - 2x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('odd');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Odd - 2x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('1to18');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            1 to 18 - 2x
          </button>
          <button
            onClick={() => {
              setSelectedBetType('19to36');
              setAdvancedBetsOpen(false);
            }}
            className="p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            19 to 36 - 2x
          </button>
        </div>
      </div>
    </div>
  );

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
              } hover:opacity-80 text-white`}
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
              onClick={() => !hasBet && setAdvancedBetsOpen(true)}
              className={`p-4 rounded-lg ${
                ['first12', 'second12', 'third12', 'even', 'odd', '1to18', '19to36'].includes(selectedBetType)
                  ? 'bg-green-600 text-white'
                  : 'bg-white/5 text-gray-300'
              } ${hasBet ? 'cursor-not-allowed' : 'hover:bg-white/10'}`}
              disabled={hasBet}
            >
              Advanced Bets
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
          {['first12', 'second12', 'third12', 'even', 'odd', '1to18', '19to36'].includes(selectedBetType) && (
            <p className="text-white">Selected: {selectedBetType}</p>
          )}

          <div className="mb-6 w-full max-w-xs">
            <label className="block text-white text-sm mb-2">Bet Amount</label>
            <div className="flex flex-col">
              <div className="grid grid-cols-5 mb-1">
                <span className="text-xs text-gray-400 flex justify-center items-center">-10</span>
                <span className="text-xs text-gray-400 flex justify-center items-center">-1</span>
                <span className="text-xs text-gray-400 flex justify-center items-center">Amount</span>
                <span className="text-xs text-gray-400 flex justify-center items-center">+1</span>
                <span className="text-xs text-gray-400 flex justify-center items-center">+10</span>
              </div>
              <div className="grid grid-cols-5 items-center">
                <button
                  onClick={() => adjustBetAmount(-10)}
                  className="p-2 bg-white/5 rounded-l-md hover:bg-white/10 transition-colors flex justify-center items-center"
                  disabled={hasBet || betAmount < 10}
                >
                  <Minus className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => adjustBetAmount(-1)}
                  className="p-2 bg-white/5 border-l border-white/10 hover:bg-white/10 transition-colors flex justify-center items-center"
                  disabled={hasBet || betAmount < 1}
                >
                  <Minus className="w-4 h-4 text-gray-300" />
                </button>
                <input
                  type="number"
                  min="0"
                  value={betAmount}
                  onChange={(e) =>
                    !hasBet && setBetAmount(Math.max(0, parseInt(e.target.value) || 0))
                  }
                  className="w-full px-4 py-2 bg-white/5 border-x border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
                  disabled={hasBet}
                />
                <button
                  onClick={() => adjustBetAmount(1)}
                  className="p-2 bg-white/5 border-r border-white/10 hover:bg-white/10 transition-colors flex justify-center items-center"
                  disabled={hasBet}
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
                <button
                  onClick={() => adjustBetAmount(10)}
                  className="p-2 bg-white/5 rounded-r-md hover:bg-white/10 transition-colors flex justify-center items-center"
                  disabled={hasBet}
                >
                  <Plus className="w-4 h-4 text-gray-300" />
                </button>
              </div>
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
          {isAdvancedBetsOpen && renderAdvancedBetsModal()}

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