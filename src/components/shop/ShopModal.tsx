import React, { useState } from 'react';
import { X, Play } from 'lucide-react';
import { PowerUp, PlayerInventory } from '../../types/shop';
import { POWER_UPS, MINI_UPS, canAffordPowerUp } from '../../utils/PowerUps';
import { socket } from '../../socket';

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  lobbyId: string;
  currentUser: string;
  inventory: PlayerInventory;
  isHost?: boolean;
}

const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  lobbyId,
  currentUser,
  inventory,
  isHost
}) => {
  const [activeTab, setActiveTab] = useState<'power-ups' | 'mini-ups'>('power-ups');

  if (!isOpen) return null;

  const handleGivePoints = () => {
      socket.emit('give_points', {
        lobbyId,
        username: currentUser,
      });
  };

  const handlePurchase = (powerUp: PowerUp) => {
    if (canAffordPowerUp(inventory.points, powerUp)) {
      socket.emit('purchase_power_up', {
        lobbyId,
        username: currentUser,
        powerUpId: powerUp.id,
        currentPoints: inventory.points
      });
    }
  };

  const startNextMinigame = () => {
    socket.emit('start_next_minigame', { lobbyId });
    onClose();
  };

  const renderPowerUpGrid = (powerUps: PowerUp[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {powerUps.map((powerUp) => (
        <div
          key={powerUp.id}
          className="bg-gray-800/50 rounded-lg p-4 border border-white/5 hover:border-purple-500/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div>
              <span className="text-2xl mr-2">{powerUp.icon}</span>
              <h3 className="text-white font-semibold inline-block">
                {powerUp.name}
              </h3>
            </div>
            <span className="text-yellow-400 font-mono">{powerUp.cost} pts</span>
          </div>
          <p className="text-gray-300 text-sm mb-4">{powerUp.description}</p>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">
              Owned: {inventory.powerUps[powerUp.id] || 0}
            </span>
            <button
              onClick={() => handlePurchase(powerUp)}
              disabled={!canAffordPowerUp(inventory.points, powerUp)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                canAffordPowerUp(inventory.points, powerUp)
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              Purchase
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-full w-full sm:w-4/5 lg:w-2/3 mx-4 border border-white/10 max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Shop</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-purple-300 font-semibold">Your Points: {inventory.points}</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('power-ups')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'power-ups'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            Drink-Ups
          </button>
          <button
            onClick={() => setActiveTab('mini-ups')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mini-ups'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            Mini-Ups
          </button>

          {currentUser === 'ericderic' && (
  <button
    onClick={() => handleGivePoints()}
    className="px-4 py-2 rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
  >
    Give Points
  </button>
)}
        </div>

        {activeTab === 'power-ups' ? renderPowerUpGrid(POWER_UPS) : renderPowerUpGrid(MINI_UPS)}

        {isHost && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={startNextMinigame}
              className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Play className="w-5 h-5" />
              <span>Start Next Minigame</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopModal;