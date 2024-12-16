import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface BussenProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
  users: { username: string }[];
}

type Card = {
  suit: string;
  value: string;
  color: string;
};

type GamePhase = 'prediction' | 'bus' | 'complete';
type PredictionType = 'color' | 'highlow' | 'inout' | 'suit';

const Bussen: React.FC<BussenProps> = ({ lobbyId, currentUser, onScore, timeLeft, users }) => {
  const [gamePhase, setGamePhase] = useState<GamePhase>('prediction');
  const [currentPrediction, setCurrentPrediction] = useState<PredictionType>('color');
  const [currentPlayer, setCurrentPlayer] = useState<string>('');
  const [revealedCards, setRevealedCards] = useState<Card[]>([]);
  const [busCards, setBusCards] = useState<Card[]>([]);
  const [score, setScore] = useState(0);

  

 // Update the useEffect hook to initialize the game
useEffect(() => {
    // Request initial game state
    socket.emit('request_game_state', { lobbyId });
  
    const handleStateUpdate = (state: {
      phase: GamePhase;
      currentPlayer: string;
      revealedCards: Card[];
      busCards: Card[];
      prediction: PredictionType;
    }) => {
      console.log('Received game state:', state); // Add logging
      setGamePhase(state.phase);
      setCurrentPlayer(state.currentPlayer);
      setRevealedCards(state.revealedCards);
      setBusCards(state.busCards);
      setCurrentPrediction(state.prediction);
    };
  
    socket.on('bussen_state_update', handleStateUpdate);
    socket.on('bussen_score_update', ({ username, newScore }) => {
      if (username === currentUser) {
        setScore(newScore);
        onScore(newScore);
      }
    });
  
    return () => {
      socket.off('bussen_state_update', handleStateUpdate);
      socket.off('bussen_score_update');
    };
  }, [lobbyId, currentUser, onScore]);

  const handlePrediction = (prediction: string) => {
    if (currentPlayer !== currentUser) return;
    
    socket.emit('bussen_make_prediction', {
      lobbyId,
      prediction,
      username: currentUser
    });
  };

  const renderPredictionPhase = () => {
    if (currentPlayer !== currentUser) {
      return (
        <div className="text-white text-center">
          Waiting for {currentPlayer} to make their prediction...
        </div>
      );
    }

    switch (currentPrediction) {
      case 'color':
        return (
          <div className="space-y-4">
            <h3 className="text-white text-xl">Predict: Red or Black?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handlePrediction('red')}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Red
              </button>
              <button
                onClick={() => handlePrediction('black')}
                className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                Black
              </button>
            </div>
          </div>
        );
      case 'highlow':
        return (
          <div className="space-y-4">
            <h3 className="text-white text-xl">Higher or Lower?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handlePrediction('higher')}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Higher
              </button>
              <button
                onClick={() => handlePrediction('lower')}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Lower
              </button>
            </div>
          </div>
        );
      case 'inout':
        return (
          <div className="space-y-4">
            <h3 className="text-white text-xl">Inside or Outside?</h3>
            <div className="flex gap-4">
              <button
                onClick={() => handlePrediction('inside')}
                className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                Inside
              </button>
              <button
                onClick={() => handlePrediction('outside')}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Outside
              </button>
            </div>
          </div>
        );
      case 'suit':
        return (
          <div className="space-y-4">
            <h3 className="text-white text-xl">Pick a Suit</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handlePrediction('hearts')}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ♥ Hearts
              </button>
              <button
                onClick={() => handlePrediction('diamonds')}
                className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                ♦ Diamonds
              </button>
              <button
                onClick={() => handlePrediction('clubs')}
                className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                ♣ Clubs
              </button>
              <button
                onClick={() => handlePrediction('spades')}
                className="px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-900"
              >
                ♠ Spades
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderBusPhase = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-white text-xl">The Bus</h3>
        <div className="grid grid-cols-5 gap-4">
          {busCards.map((card, index) => (
            <div
              key={index}
              className={`aspect-[2/3] bg-white/10 rounded-lg flex items-center justify-center text-2xl ${
                card ? 'bg-white text-black' : ''
              }`}
            >
              {card ? `${card.value}${card.suit}` : '?'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      
      {gamePhase === 'prediction' && renderPredictionPhase()}
      {gamePhase === 'bus' && renderBusPhase()}
      
      <div className="mt-8">
        <h4 className="text-white font-semibold mb-2">Revealed Cards:</h4>
        <div className="flex gap-2">
          {revealedCards.map((card, index) => (
            <div
              key={index}
              className="w-12 h-16 bg-white rounded-lg flex items-center justify-center text-lg"
            >
              {card.value}{card.suit}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bussen;