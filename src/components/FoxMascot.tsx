import React from 'react';
import { FoxEarState } from '../types';

interface FoxMascotProps {
  earState: FoxEarState;
  scrollProgress: number; // 0 - 100
  onClick?: () => void;
  className?: string;
}

export const FoxMascot: React.FC<FoxMascotProps> = ({
  earState,
  scrollProgress,
  onClick,
  className = '',
}) => {
  // Tail rotation: 0% -> 0deg, 100% -> -25deg (lifting gracefully)
  const tailRotation = -((scrollProgress / 100) * 22);

  // Ear rotation offsets based on state
  let leftEarTransform = 'rotate(0deg)';
  let rightEarTransform = 'rotate(0deg)';
  let stateText = '随时可以提问';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';

  switch (earState) {
    case 'unconfigured':
      leftEarTransform = 'rotate(-8deg)';
      rightEarTransform = 'rotate(8deg)';
      stateText = '需配置 AI 服务';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'waiting':
      leftEarTransform = 'rotate(4deg)';
      rightEarTransform = 'rotate(-4deg)';
      stateText = '思考中…';
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'generating':
      leftEarTransform = 'rotate(2deg)';
      rightEarTransform = 'rotate(-2deg)';
      stateText = '正在回答…';
      badgeColor = 'bg-orange-50 text-fox-darkOrange border-orange-200';
      break;
    case 'error':
      leftEarTransform = 'rotate(-16deg)';
      rightEarTransform = 'rotate(16deg)';
      stateText = '请求异常';
      badgeColor = 'bg-red-50 text-red-600 border-red-200';
      break;
    case 'ready':
    default:
      leftEarTransform = 'rotate(0deg)';
      rightEarTransform = 'rotate(0deg)';
      stateText = '准备就绪';
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
  }

  return (
    <div
      onClick={onClick}
      title="点击快速聚焦提问框"
      className={`group flex items-center gap-2.5 cursor-pointer select-none transition-all ${className}`}
    >
      {/* SVG Fox Mascot */}
      <div className="relative w-9 h-9 flex-shrink-0">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
        >
          {/* Big Fluffy Tail (Rotates based on reading progress) */}
          <g
            className="transition-transform duration-500 ease-out origin-bottom-left"
            style={{
              transform: `translate(20px, 60px) rotate(${tailRotation}deg) translate(-20px, -60px)`,
            }}
          >
            {/* Orange tail body */}
            <path
              d="M 22 75 C 5 65 2 45 15 32 C 25 22 35 25 38 38 C 40 50 32 68 22 75 Z"
              fill="#FF7A30"
            />
            {/* Cream tail tip */}
            <path
              d="M 15 32 C 18 26 25 23 30 25 C 28 32 20 38 15 32 Z"
              fill="#FFF5EB"
            />
          </g>

          {/* Body */}
          <path
            d="M 32 78 C 30 60 40 46 56 46 C 72 46 80 60 76 78 C 74 85 34 85 32 78 Z"
            fill="#FF7A30"
          />

          {/* Cream Chest */}
          <path
            d="M 44 58 C 48 52 60 52 64 58 C 66 68 58 76 54 77 C 50 76 42 68 44 58 Z"
            fill="#FFF5EB"
          />

          {/* Left Ear */}
          <path
            d="M 40 32 L 32 10 L 48 24 Z"
            fill="#FF7A30"
            className="transition-transform duration-300 origin-[40px_32px]"
            style={{ transform: leftEarTransform }}
          />
          {/* Left Ear Inner */}
          <path
            d="M 40 28 L 35 15 L 45 24 Z"
            fill="#FFF5EB"
            className="transition-transform duration-300 origin-[40px_32px]"
            style={{ transform: leftEarTransform }}
          />

          {/* Right Ear */}
          <path
            d="M 68 32 L 76 10 L 60 24 Z"
            fill="#FF7A30"
            className="transition-transform duration-300 origin-[68px_32px]"
            style={{ transform: rightEarTransform }}
          />
          {/* Right Ear Inner */}
          <path
            d="M 68 28 L 73 15 L 63 24 Z"
            fill="#FFF5EB"
            className="transition-transform duration-300 origin-[68px_32px]"
            style={{ transform: rightEarTransform }}
          />

          {/* Head */}
          <circle cx="54" cy="38" r="18" fill="#FF7A30" />

          {/* Cheeks Cream */}
          <path
            d="M 38 38 C 38 48 48 53 54 53 C 60 53 70 48 70 38 C 66 42 59 44 54 44 C 49 44 42 42 38 38 Z"
            fill="#FFF5EB"
          />

          {/* Eyes (Quiet, friendly) */}
          <ellipse cx="47" cy="36" rx="2" ry="2.5" fill="#22252A" />
          <ellipse cx="61" cy="36" rx="2" ry="2.5" fill="#22252A" />

          {/* Eye shine */}
          <circle cx="46.5" cy="35" r="0.7" fill="#FFFFFF" />
          <circle cx="60.5" cy="35" r="0.7" fill="#FFFFFF" />

          {/* Nose */}
          <polygon points="53,42 55,42 54,43.5" fill="#22252A" />
        </svg>
      </div>

      {/* State badge */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-neutral-800 leading-tight flex items-center gap-1">
          Fox
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-normal ${badgeColor}`}>
            {stateText}
          </span>
        </span>
        <span className="text-[10px] text-neutral-400">
          阅读进度 {Math.round(scrollProgress)}%
        </span>
      </div>
    </div>
  );
};
