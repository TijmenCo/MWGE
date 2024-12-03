import React from 'react';
import { PowerUp, PlayerInventory } from '../types/shop';
import { getPowerUpById } from '../utils/PowerUps';
import { socket } from '../socket';

interface PowerUpInventoryProps {
  inventory: PlayerInventory;
  lobbyId: string;
  currentUser: string;
  isGameActive: boolean;
}

const PowerUpInventory: React.FC<PowerUpInventoryProps> = ({
  inventory,
  lobbyId,
  currentUser,
  isGameActive
}) => {
  const handleUsePowerUp = (powerUpId: string) => {
    if (!isGameActive) return;
    
    socket.emit('use_power_up', {
      lobbyId,
      username: currentUser,
      powerUpId
    });
  };

  return (
    <div className="bg-black/20 rounded-lg p-4 border border-white/10">
      <h3 className="text-white font-semibold mb-4">Your Power-Ups</h3>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(inventory.powerUps).map(([powerUpId, quantity]) => {
          if (quantity === 0) return null;
          const powerUp = getPowerUpById(powerUpId);
          if (!powerUp) return null;

          return (
            <button
              key={powerUpId}
              onClick={() => handleUsePowerUp(powerUpId)}
              disabled={!isGameActive}
              className={`p-2 rounded-md border border-white/10 transition-colors ${
                isGameActive
                  ? 'hover:bg-white/10 cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">{powerUp.icon}</span>
                <div className="text-left">
                  <div className="text-white text-sm font-medium">
                    {powerUp.name}
                  </div>
                  <div className="text-gray-400 text-xs">
                    Quantity: {quantity}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PowerUpInventory;