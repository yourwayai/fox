import React from 'react';
import { FoxEarState } from '../types';
import { useAppStore } from '../store/useAppStore';

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
  const { reduceMotion } = useAppStore();

  let stateText = '随时可以提问';
  let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let mascotAnim = '';

  switch (earState) {
    case 'unconfigured':
      stateText = '需配置 AI 服务';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'waiting':
      stateText = '思考中…';
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
      mascotAnim = 'animate-pulse';
      break;
    case 'generating':
      stateText = '正在回答…';
      badgeColor = 'bg-orange-50 text-fox-darkOrange border-orange-200';
      mascotAnim = 'animate-bounce';
      break;
    case 'error':
      stateText = '请求异常';
      badgeColor = 'bg-red-50 text-red-600 border-red-200';
      break;
    case 'ready':
    default:
      stateText = '准备就绪';
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
  }

  // Circular progress for reading indicator around avatar
  const strokeDashoffset = 100 - scrollProgress;

  return (
    <div
      onClick={onClick}
      title="点击快速聚焦提问框"
      className={`group flex items-center gap-2.5 cursor-pointer select-none transition-all ${className}`}
    >
      {/* Fox Avatar with subtle reading progress ring */}
      <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
        {/* Reading progress ring around avatar */}
        <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            className="text-neutral-200/60"
            strokeWidth="1.5"
            stroke="currentColor"
            fill="none"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            className="text-fox-orange transition-all duration-300"
            strokeWidth="2"
            strokeDasharray="100"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
          />
        </svg>

        {/* Mascot Image */}
        <img
          src="/fox.png"
          alt="Fox Mascot"
          className={`w-7 h-7 object-contain drop-shadow-xs transition-transform ${
            reduceMotion ? '' : `duration-300 group-hover:scale-110 ${mascotAnim}`
          }`}
        />
      </div>

      {/* State & progress badge */}
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-neutral-800 leading-tight flex items-center gap-1.5">
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
