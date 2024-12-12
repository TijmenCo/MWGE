import React, { useState, useEffect, useRef } from 'react';

interface FallingCatchProps {
  lobbyId: string;
  currentUser: string;
  onScore: (score: number) => void;
  timeLeft: number;
}

const ITEMS = ['🍎', '🍌', '🍇', '⭐', '💎'];
const BASKET_WIDTH = 60;
const ITEM_SPAWN_RATE = 1000;
const FALL_SPEED = 3;

interface FallingItem {
  id: number;
  type: string;
  x: number;
  y: number;
}

const FallingCatch: React.FC<FallingCatchProps> = ({ lobbyId, currentUser, onScore, timeLeft }) => {
  const [basketPosition, setBasketPosition] = useState(50);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const gameAreaRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const lastSpawnTime = useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setBasketPosition(Math.max(0, Math.min(100 - (BASKET_WIDTH / 4), x)));
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    setBasketPosition(Math.max(0, Math.min(100 - (BASKET_WIDTH / 4), x)));
  };

  const spawnItem = () => {
    const now = Date.now();
    if (now - lastSpawnTime.current >= ITEM_SPAWN_RATE) {
      const newItem: FallingItem = {
        id: now,
        type: ITEMS[Math.floor(Math.random() * ITEMS.length)],
        x: Math.random() * (100 - 10),
        y: 0
      };
      setItems(prev => [...prev, newItem]);
      lastSpawnTime.current = now;
    }
  };

  const updateGame = () => {
    spawnItem();
    setItems(prevItems => {
      const updatedItems = prevItems.map(item => ({
        ...item,
        y: item.y + FALL_SPEED
      }));

      // Check for catches and remove fallen items
      const remainingItems = updatedItems.filter(item => {
        if (item.y >= 85 && item.y <= 95) {
          const itemCenterX = item.x + 5;
          const basketLeft = basketPosition;
          const basketRight = basketPosition + BASKET_WIDTH;

          if (itemCenterX >= basketLeft && itemCenterX <= basketRight) {
            setScore(prev => {
              const newScore = prev + 1;
              onScore(1);
              return newScore;
            });
            return false;
          }
        }
        return item.y < 100;
      });

      return remainingItems;
    });

    requestRef.current = requestAnimationFrame(updateGame);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateGame);
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [basketPosition]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <div className="text-4xl font-bold text-white mb-4">{timeLeft}s</div>
      <div className="text-2xl text-white mb-4">Score: {score}</div>
      <div
        ref={gameAreaRef}
        className="w-full h-[400px] bg-black/20 rounded-lg relative overflow-hidden"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-2xl transform -translate-x-1/2"
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`
            }}
          >
            {item.type}
          </div>
        ))}
        <div
          className="absolute bottom-0 h-12 bg-brown-600 rounded-lg transition-all duration-50"
          style={{
            left: `${basketPosition}%`,
            width: `${BASKET_WIDTH}px`
          }}
        >
          <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-2xl">
            🧺
          </div>
        </div>
      </div>
    </div>
  );
};

export default FallingCatch;