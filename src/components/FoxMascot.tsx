import React, { memo } from 'react';
import { FoxEarState } from '../types';
import { useAppStore } from '../store/useAppStore';
import { FoxVectorMascot } from './FoxVectorMascot';

interface FoxMascotProps {
  earState: FoxEarState;
  scrollProgress: number; // 0 - 100
  onClick?: () => void;
  className?: string;
}

const RING_RADIUS = 16;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const FoxMascot: React.FC<FoxMascotProps> = memo(
  ({ earState, scrollProgress, onClick, className = '' }) => {
    const reduceMotion = useAppStore((s) => s.reduceMotion);

    let stateText = '随时可以提问';
    let badgeColor =
      'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

    switch (earState) {
      case 'unconfigured':
        stateText = '需配置 AI 服务';
        badgeColor =
          'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        break;
      case 'waiting':
        stateText = '思考中…';
        badgeColor =
          'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        break;
      case 'generating':
        stateText = '正在回答…';
        badgeColor =
          'bg-orange-50 dark:bg-orange-950/40 text-fox-darkOrange dark:text-fox-orange border-orange-200 dark:border-orange-800';
        break;
      case 'error':
        stateText = '请求异常';
        badgeColor =
          'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800';
        break;
      case 'ready':
      default:
        stateText = '准备就绪';
        badgeColor =
          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        break;
    }

    const clampedProgress = Math.min(100, Math.max(0, scrollProgress || 0));
    const strokeDashoffset = RING_CIRCUMFERENCE * (1 - clampedProgress / 100);

    return (
      <div
        onClick={onClick}
        title="点击快速聚焦提问框"
        className={`group flex items-center gap-2.5 cursor-pointer select-none transition-all ${className}`}
      >
        {/* Fox Avatar with subtle reading progress ring */}
        <div className="relative w-9 h-9 flex-shrink-0 flex items-center justify-center">
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 36 36"
          >
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              className="text-neutral-200/60 dark:text-neutral-700/60"
              strokeWidth="1.5"
              stroke="currentColor"
              fill="none"
            />
            <circle
              cx="18"
              cy="18"
              r={RING_RADIUS}
              className={`text-fox-orange ${reduceMotion ? '' : 'transition-all duration-300'}`}
              strokeWidth="2"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
            />
          </svg>

          <div className="z-10 flex items-center justify-center group-hover:scale-105 transition-transform">
            <FoxVectorMascot
              earState={earState}
              scrollProgress={clampedProgress}
              reduceMotion={reduceMotion}
              size={24}
            />
          </div>
        </div>

        {/* State & progress badge */}
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 leading-tight flex items-center gap-1.5">
            Fox
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-normal ${badgeColor}`}>
              {stateText}
            </span>
          </span>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
            阅读进度 {Math.round(clampedProgress)}%
          </span>
        </div>
      </div>
    );
  }
);
FoxMascot.displayName = 'FoxMascot';
