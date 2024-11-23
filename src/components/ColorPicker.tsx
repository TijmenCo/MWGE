import React from 'react';
import { useStore } from '../store';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
  '#D4A5A5', '#9B59B6', '#3498DB', '#E67E22', '#2ECC71',
  '#FF4757', '#2ED573', '#5352ED', '#FF6348', '#747D8C'
];

const ColorPicker: React.FC = () => {
  const { userColor, setUserColor } = useStore();

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-black/20 rounded-lg border border-white/10">
      <h3 className="w-full text-white font-semibold mb-2">Choose Color</h3>
      <div className="flex flex-wrap gap-2">
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => setUserColor(color)}
            className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${
              userColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-purple-900' : ''
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
    </div>
  );
};

export default ColorPicker;