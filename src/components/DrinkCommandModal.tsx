import React, { useState, useEffect } from 'react';

interface QueuedMessage {
  id: string;
  content: string;
}

interface DrinkCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: QueuedMessage[];
}

const DrinkCommandModal: React.FC<DrinkCommandModalProps> = ({ isOpen, onClose, messages }) => {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  useEffect(() => {
    setCurrentMessageIndex(0);
  }, [messages]);

  const currentMessage = messages[currentMessageIndex];

  const handleClose = () => {
    if (currentMessageIndex < messages.length - 1) {
      setCurrentMessageIndex(currentMessageIndex + 1);
    } else {
      onClose();
    }
  };

  if (!isOpen || !currentMessage) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full mx-4 border border-white/10 shadow-lg relative z-[10000]">
        <h2 className="text-2xl font-bold text-white mb-4">Command Got!</h2>
        <p className="text-white text-lg mb-6">{currentMessage.content}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleClose}
            className="w-full p-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-lg font-semibold"
          >
            Cheers! 🍻
          </button>
          {currentMessageIndex < messages.length - 1 && (
            <p className="text-center text-gray-400 text-sm">
              {messages.length - currentMessageIndex - 1} more command{messages.length - currentMessageIndex - 1 !== 1 ? 's' : ''} in queue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DrinkCommandModal;

