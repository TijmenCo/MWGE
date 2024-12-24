import React from 'react';

const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

interface RouletteWheelProps {
  spinning: boolean;
  result: number | null;
}

const RouletteWheel: React.FC<RouletteWheelProps> = ({ spinning, result }) => {
  const getNumberColor = (num: number) => {
    if (num === 0) return 'fill-green-600';
    return RED_NUMBERS.includes(num) ? 'fill-red-600' : 'fill-gray-900';
  };

  return (
    <div className="relative w-full max-w-[300px] aspect-square mx-auto">
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full ${spinning ? 'animate-spin' : ''}`}
        style={{ animationDuration: '5s', animationTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
      >
        <circle cx="100" cy="100" r="98" fill="#c8a45d" />
        <circle cx="100" cy="100" r="88" fill="#23292f" />
        {NUMBERS.map((number, index) => {
          const angle = (index * 360) / NUMBERS.length;
          const radians = (angle * Math.PI) / 180;
          const x1 = 100 + 88 * Math.cos(radians);
          const y1 = 100 + 88 * Math.sin(radians);
          const x2 = 100 + 98 * Math.cos(radians);
          const y2 = 100 + 98 * Math.sin(radians);
          
          return (
            <g key={number}>
              <path
                d={`M 100 100 L ${x1} ${y1} A 88 88 0 0 1 ${x2} ${y2} Z`}
                className={getNumberColor(number)}
              />
              <text
                x={100 + 93 * Math.cos(radians)}
                y={100 + 93 * Math.sin(radians)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="6"
                fontWeight="bold"
                transform={`rotate(${angle + 90}, ${100 + 93 * Math.cos(radians)}, ${100 + 93 * Math.sin(radians)})`}
              >
                {number}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="absolute top-1/2 left-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full bg-white border-2 border-gray-800 z-10"></div>
      {result !== null && (
        <div className="absolute top-0 right-0 bg-white text-gray-900 text-sm font-bold px-2 py-1 rounded-bl-md">
          Result: {result}
        </div>
      )}
    </div>
  );
};

export default RouletteWheel;