import React, { useState, useEffect, useRef } from 'react';
import { socket } from '../../socket';

interface WheelSegment {
  id: string;
  label: string;
  probability: number;
  color: string;
  effect?: string;
}

interface GamblingWheelProps {
  segments: WheelSegment[];
  onSpin: (betAmount: number) => void;
  maxBet: number;
  currentPoints: number;
}

const GamblingWheel: React.FC<GamblingWheelProps> = ({
  segments,
  onSpin,
  maxBet,
  currentPoints
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [betAmount, setBetAmount] = useState(10);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    drawWheel();
  }, [segments]);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    const segmentAngle = (2 * Math.PI) / segments.length;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    segments.forEach((segment, index) => {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(
        centerX,
        centerY,
        radius,
        index * segmentAngle,
        (index + 1) * segmentAngle
      );
      ctx.closePath();

      ctx.fillStyle = segment.color;
      ctx.fill();
      ctx.stroke();

      // Add text
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(index * segmentAngle + segmentAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px Arial';
      ctx.fillText(segment.label, radius - 20, 5);
      ctx.restore();
    });

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI);
    ctx.fillStyle = '#333';
    ctx.fill();
  };

  const handleSpin = () => {
    if (isSpinning || betAmount > currentPoints) return;

    setIsSpinning(true);
    setResult(null);

    // Calculate random rotation (5-10 full spins plus random segment)
    const spinCount = 5 + Math.random() * 5;
    const randomSegment = Math.floor(Math.random() * segments.length);
    const segmentAngle = 360 / segments.length;
    const finalAngle = spinCount * 360 + randomSegment * segmentAngle;

    // Animate the spin
    setRotation(finalAngle);

    // Trigger the spin callback
    onSpin(betAmount);

    // Show result after animation
    setTimeout(() => {
      setIsSpinning(false);
      setResult(segments[randomSegment].label);
    }, 3000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="transform transition-transform duration-3000 ease-out"
          style={{
            transform: `rotate(${rotation}deg)`
          }}
        />
        <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-t-[40px] border-t-yellow-500 border-r-[20px] border-r-transparent" />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <input
          type="number"
          min={10}
          max={maxBet}
          value={betAmount}
          onChange={(e) => setBetAmount(Math.min(maxBet, Math.max(10, parseInt(e.target.value) || 0)))}
          className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white text-center"
        />
        <button
          onClick={handleSpin}
          disabled={isSpinning || betAmount > currentPoints}
          className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSpinning ? 'Spinning...' : 'Spin!'}
        </button>
      </div>

      {result && (
        <div className="text-center">
          <p className="text-xl font-bold text-white">You got: {result}!</p>
        </div>
      )}
    </div>
  );
};

export default GamblingWheel;