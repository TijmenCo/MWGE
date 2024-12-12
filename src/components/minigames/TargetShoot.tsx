import React, { useState, useEffect, useRef } from 'react';

interface TargetShootProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

interface Target {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  direction: number;
  points: number;
}

const TargetShoot: React.FC<TargetShootProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [targets, setTargets] = useState<Target[]>([]);
  const [score, setScore] = useState(0);
  const [lastSpawn, setLastSpawn] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const spawnTarget = () => {
    const now = Date.now();
    if (now - lastSpawn >= 500) { // Spawn every second
      const newTarget: Target = {
        id: now,
        x: Math.random() * 80 + 10, // Keep away from edges
        y: Math.random() * 80 + 10,
        size: Math.random() * 20 + 20, // Random size between 20-40
        speed: 0.5 * 2, // Random speed
        direction: Math.random() * Math.PI * 2, // Random direction
        points: Math.floor(Math.random() * 2) + 1 // 1 or 2 points
      };
      setTargets(prev => [...prev, newTarget]);
      setLastSpawn(now);
    }
  };

  const updateTargets = () => {
    setTargets(prev => prev.map(target => {
      let newX = target.x + Math.cos(target.direction) * target.speed;
      let newY = target.y + Math.sin(target.direction) * target.speed;

      // Bounce off walls
      if (newX <= 0 || newX >= 100 - target.size/2) {
        target.direction = Math.PI - target.direction;
        newX = target.x;
      }
      if (newY <= 0 || newY >= 100 - target.size/2) {
        target.direction = -target.direction;
        newY = target.y;
      }

      return {
        ...target,
        x: newX,
        y: newY
      };
    }));
  };

  const gameLoop = () => {
    spawnTarget();
    updateTargets();
    animationFrameRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lastSpawn]);

  const handleClick = (target: Target) => {
    setScore(prev => {
      const newScore = prev + target.points;
      onScore(target.points);
      return newScore;
    });
    setTargets(prev => prev.filter(t => t.id !== target.id));
  };

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-4">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      <div
        ref={gameAreaRef}
        className="w-full h-[400px] bg-black/20 rounded-lg relative overflow-hidden cursor-crosshair"
      >
        {targets.map(target => (
          <button
            key={target.id}
            onClick={() => handleClick(target)}
            className={`absolute rounded-full transition-transform hover:scale-90 ${
              target.points === 2 ? 'bg-red-500' : 'bg-yellow-500'
            }`}
            style={{
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-white font-bold">
              {target.points}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TargetShoot;