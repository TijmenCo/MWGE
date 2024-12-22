import React from 'react';

interface DrinkCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const DrinkCommandModal: React.FC<DrinkCommandModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-white/10 shadow-lg relative z-[10000]">
        <h2 className="text-2xl font-bold text-white mb-4">Command Got!</h2>
        <p className="text-white text-lg mb-6">{message}</p>
        <button
          onClick={onClose}
          className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-lg font-semibold"
        >
          Cheers! 🍻
        </button>
      </div>
    </div>
  );
};

export default DrinkCommandModal;

