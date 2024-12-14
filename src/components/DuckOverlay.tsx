import React, { useEffect, useRef } from 'react';

interface DuckProps {
  username: string;
  color: string;
  position: { x: number; y: number };
}

const Duck: React.FC<DuckProps> = ({ username, position, color }) => {
    return (
      <div
        className="absolute"
        style={{
          left: `${position.x}%`,
          top: `${position.y}%`,
          transition: 'left 2s ease-in-out, top 2s ease-in-out',
          zIndex: 10,
        }}
      >
        <div className="relative">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center animate-walk"
            style={{ backgroundColor: color }}
          >
            🦆
          </div>
          <span className="absolute -top-5 left-1/2 transform -translate-x-1/2 text-xs text-white bg-black/50 px-1 rounded">
            {username}
          </span>
        </div>
      </div>
    );
  };
  
interface DuckOverlayProps {
  users: {
      color: string; username: string 
}[];
}

const DuckOverlay: React.FC<DuckOverlayProps> = React.memo(({ users }) => {
  const [duckPositions, setDuckPositions] = React.useState<{ [key: string]: { x: number; y: number } }>({});

  useEffect(() => {
    setDuckPositions(prevPositions => {
      const newPositions = { ...prevPositions };
      users.forEach(user => {
        if (!newPositions[user.username]) {
          newPositions[user.username] = {
            x: Math.random() * 100, 
            y: Math.random() * 100,
          };
        } else {
          newPositions[user.username] = {
            x: Math.max(0, Math.min(100, newPositions[user.username].x + (Math.random() - 0.5) * 10)),
            y: Math.max(0, Math.min(100, newPositions[user.username].y + (Math.random() - 0.5) * 10)),
          };
        }
      });
      return newPositions;
    });
  }, [users]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuckPositions(prevPositions => {
        const newPositions = { ...prevPositions };
        users.forEach(user => {
          if (!newPositions[user.username]) {
            newPositions[user.username] = {
              x: Math.random() * 100, 
              y: Math.random() * 100,
            };
          } else {
            newPositions[user.username] = {
              x: Math.max(0, Math.min(100, newPositions[user.username].x + (Math.random() - 0.5) * 20)),
              y: Math.max(0, Math.min(100, newPositions[user.username].y + (Math.random() - 0.5) * 20)),
            };
          }
        });
        return newPositions;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [users]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {users.map(user => (
        <Duck
          key={user.username}
          username={user.username}
          color={user.color}
          position={duckPositions[user.username] || { x: 0, y: 0 }}
        />
      ))}
    </div>
  );
});

export default DuckOverlay;

