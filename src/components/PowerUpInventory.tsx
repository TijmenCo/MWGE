import React, { useState, useEffect } from 'react';
import { PowerUp, PlayerInventory } from '../types/shop';
import { getPowerUpById } from '../utils/PowerUps';
import { socket } from '../socket';
import DrinkCommandModal from './DrinkCommandModal';

interface PowerUpInventoryProps {
  inventory: PlayerInventory;
  lobbyId: string;
  currentUser: string;
  users: { username: string }[];
  inShop: boolean;
}

interface DrinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: { username: string }[];
  onSelectUser: (username: string) => void;
  powerUp: PowerUp;
}

const DrinkModal: React.FC<DrinkModalProps> = ({
  isOpen,
  onClose,
  users,
  onSelectUser,
  powerUp
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">
          Select who should {powerUp.effect === 'make_drink' ? 'take a sip' : 'take a shot'}
        </h2>
        <div className="space-y-2">
          {users.map((user) => (
            <button
              key={user.username}
              onClick={() => onSelectUser(user.username)}
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-md text-white transition-colors"
            >
              {user.username}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-4 w-full p-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const PowerUpInventory: React.FC<PowerUpInventoryProps> = ({
  inventory,
  lobbyId,
  currentUser,
  users,
  inShop
}) => {
  const [showDrinkModal, setShowDrinkModal] = useState(false);
  const [selectedPowerUp, setSelectedPowerUp] = useState<PowerUp | null>(null);
  const [showDrinkCommandModal, setShowDrinkCommandModal] = useState(false);
  const [drinkCommandMessages, setDrinkCommandMessages] = useState<{ id: string; content: string }[]>([]);
  const [localInventory, setLocalInventory] = useState<PlayerInventory>(inventory);

  useEffect(() => {
    setLocalInventory(inventory);
  }, [inventory]);

  useEffect(() => {
    const handleDrinkCommand = (data: {
      id: string;
      type: 'sip' | 'shot' | 'all' | 'waterfall' | 'all_game' | 'chug';
      fromUser: string;
      toUser?: string;
      gameDescription?: string;
    }) => {
      console.log(data.type);
      let message = '';
    
      if (data.type === 'sip' || data.type === 'shot' || data.type === 'chug') {
        if (data.toUser === currentUser) {
          message = `${data.fromUser} says you need to ${data.type === 'chug' ? 'chug' : `take a ${data.type}`}! 🍻`;
        }
      } else if (data.type === 'all') {
        message = `${data.fromUser} says everyone needs to drink! 🍻`;
      } else if (data.type === 'waterfall') {
        message = `${data.fromUser} started a waterfall! Keep drinking until the person before you stops! 🌊`;
      } else if (data.type === 'all_game') {
        message = `${data.fromUser} started a Game! ${data.gameDescription}`;
      }
    
      if (message) {
        setDrinkCommandMessages(prev => [...prev, { id: data.id, content: message }]);
        setShowDrinkCommandModal(true);
      }
    };
    
    socket.on('drink_command', handleDrinkCommand);

    return () => {
      socket.off('drink_command', handleDrinkCommand);
    };
  }, [currentUser]);

  const handleUsePowerUp = (powerUpId: string) => {   
    const powerUp = getPowerUpById(powerUpId);
    if (!powerUp) return;

    if (powerUp.target === 'single') {
      setSelectedPowerUp(powerUp);
      setShowDrinkModal(true);
    } else {
      socket.emit('use_power_up', {
        lobbyId,
        username: currentUser,
        powerUpId
      });
    }
  };

  const handleSelectUser = (targetUsername: string) => {
    if (!selectedPowerUp) return;

    socket.emit('use_power_up', {
      lobbyId,
      username: currentUser,
      powerUpId: selectedPowerUp.id,
      targetUsername
    });

    setShowDrinkModal(false);
    setSelectedPowerUp(null);
  };

  const handleCloseDrinkCommandModal = () => {
    setDrinkCommandMessages([]);
    setShowDrinkCommandModal(false);
  };

  return (
    <>
      <div className="bg-black/20 rounded-lg p-4 border border-white/10">
        <h3 className="text-white font-semibold mb-4">Your Power-Ups</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(inventory.powerUps).map(([powerUpId, quantity]) => {
            if (quantity === 0) return null;
            const powerUp = getPowerUpById(powerUpId);
            if (!powerUp) return null;

            const isDisabled = !inShop && powerUp.type === 'all_game';

            return (
              <button
                key={powerUpId}
                onClick={() => handleUsePowerUp(powerUpId)}
                disabled={isDisabled}
                className={`p-2 rounded-md border border-white/10 transition-colors ${
                  isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white/10'
                }`}
                title={isDisabled ? 'This power-up can only be used during the shop phase' : undefined}
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

        <DrinkModal
          isOpen={showDrinkModal}
          onClose={() => {
            setShowDrinkModal(false);
            setSelectedPowerUp(null);
          }}
          users={users.filter(u => u.username !== currentUser)}
          onSelectUser={handleSelectUser}
          powerUp={selectedPowerUp!}
        />
      </div>
      <DrinkCommandModal
        isOpen={showDrinkCommandModal}
        onClose={handleCloseDrinkCommandModal}
        messages={drinkCommandMessages}
      />
    </>
  );
};

export default PowerUpInventory;