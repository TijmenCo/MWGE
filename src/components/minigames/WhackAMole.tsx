import React, { useState, useEffect } from 'react';
import { socket } from '../../socket';

interface WhackAMoleProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const WhackAMole: React.FC<WhackAMoleProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [isAnimating, setIsAnimating] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const spawnMole = () => {
      const newPosition = Math.floor(Math.random() * 9);
      setActiveMole(newPosition);
      
      // Hide mole after random time between 0.8 and 1.5 seconds
      const hideDelay = Math.random() * 700 + 800;
      setTimeout(() => {
        setActiveMole((current) => current === newPosition ? null : current);
      }, hideDelay);
    };

    // Spawn first mole immediately
    spawnMole();

    // Set up interval for spawning moles
    const interval = setInterval(() => {
      if (Math.random() > 0.3) { // 70% chance to spawn a mole
        spawnMole();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleWhack = (position: number) => {
    if (activeMole === position) {
      setIsAnimating(prev => ({ ...prev, [position]: true }));
      setTimeout(() => {
        setIsAnimating(prev => ({ ...prev, [position]: false }));
      }, 300);

      const newScore = score + 1;
      setScore(newScore);
      onScore(newScore);
      
      socket.emit('minigame_action', {
        lobbyId,
        username: currentUser,
        action: 'whackamole',
        data: { score: newScore }
      });
      
      setActiveMole(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-8">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      <div className="aspect-square w-full max-w-2xl bg-gradient-to-br from-green-800 to-green-900 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4 h-full">
          {Array.from({ length: 9 }).map((_, index) => (
            <div
              key={index}
              className="relative flex items-center justify-center"
              onClick={() => handleWhack(index)}
            >
              <div className="absolute bottom-0 w-4/5 h-1/3 bg-gradient-to-b from-brown-600 to-brown-800 rounded-full transform skew-x-6" />
              {activeMole === index && (
                <div
                  className={`absolute bottom-1/4 w-16 h-16 bg-brown-400 rounded-full 
                    ${isAnimating[index] ? 'animate-whack' : 'animate-bounce'}
                    cursor-pointer`}
                >
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-black rounded-full" />
                  <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-black rounded-full" />
                  <div className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-pink-300 rounded-full" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WhackAMole;