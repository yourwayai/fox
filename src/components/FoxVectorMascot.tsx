import React, { memo } from 'react';
import { FoxEarState } from '../types';

interface FoxVectorMascotProps {
  earState: FoxEarState;
  scrollProgress: number; // 0 - 100
  reduceMotion: boolean;
  size?: number;
  className?: string;
}

/**
 * High-precision Vector Mascot with dynamic tail & ear posing:
 * - Tail: smoothly perks up as reading progress advances (0% tucked -> 100% raised).
 * - Ears: expressively reflect AI state (ready, waiting, generating, error).
 * - Fully accessible: falls back to clean static pose when reduceMotion is enabled.
 */
export const FoxVectorMascot: React.FC<FoxVectorMascotProps> = memo(
  ({ earState, scrollProgress, reduceMotion, size = 28, className = '' }) => {
    const clampedProgress = Math.min(100, Math.max(0, scrollProgress || 0));

    // Tail angle: -6deg (tucked at 0%) to +12deg (raised at 100%)
    const tailRotation = reduceMotion ? 0 : -6 + (clampedProgress / 100) * 18;

    // Ears transform based on earState
    let leftEarTransform = '';
    let rightEarTransform = '';
    let bodyAnimClass = '';

    if (!reduceMotion) {
      switch (earState) {
        case 'unconfigured':
          leftEarTransform = 'rotate(4deg)';
          rightEarTransform = 'rotate(-4deg)';
          break;
        case 'waiting':
          leftEarTransform = 'scale(1.04)';
          rightEarTransform = 'scale(1.04)';
          bodyAnimClass = 'animate-pulse';
          break;
        case 'generating':
          leftEarTransform = 'translate(0px, -1px)';
          rightEarTransform = 'translate(0px, -1px)';
          bodyAnimClass = 'transition-transform hover:scale-105';
          break;
        case 'error':
          leftEarTransform = 'rotate(8deg) translate(0px, 1px)';
          rightEarTransform = 'rotate(-8deg) translate(0px, 1px)';
          break;
        case 'ready':
        default:
          leftEarTransform = 'none';
          rightEarTransform = 'none';
          break;
      }
    }

    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`select-none overflow-visible ${bodyAnimClass} ${className}`}
      >
        <g>
          {/* Animated Tail: pivots smoothly around tail root (cx: 24, cy: 75) */}
          <g
            style={{
              transformOrigin: '24px 75px',
              transform: `rotate(${tailRotation}deg)`,
              transition: reduceMotion ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            {/* Tail Main Body */}
            <path
              d="M 22 75 C 5 65 2 45 15 32 C 25 22 35 25 38 38 C 40 50 32 68 22 75 Z"
              fill="#FF7A30"
            />
            {/* Tail Cream Tip */}
            <path
              d="M 15 32 C 18 26 25 23 30 25 C 28 32 20 38 15 32 Z"
              fill="#FFF5EB"
            />
          </g>

          {/* Fox Body */}
          <path
            d="M 32 78 C 30 60 40 46 56 46 C 72 46 80 60 76 78 C 74 85 34 85 32 78 Z"
            fill="#FF7A30"
          />

          {/* Cream Chest */}
          <path
            d="M 44 58 C 48 52 60 52 64 58 C 66 68 58 76 54 77 C 50 76 42 68 44 58 Z"
            fill="#FFF5EB"
          />

          {/* Left Ear: pivots around ear base (40, 28) */}
          <g
            style={{
              transformOrigin: '40px 28px',
              transform: leftEarTransform,
              transition: reduceMotion ? 'none' : 'transform 0.3s ease',
            }}
          >
            <path d="M 40 32 L 32 10 L 48 24 Z" fill="#FF7A30" />
            <path d="M 40 28 L 35 15 L 45 24 Z" fill="#FFF5EB" />
          </g>

          {/* Right Ear: pivots around ear base (68, 28) */}
          <g
            style={{
              transformOrigin: '68px 28px',
              transform: rightEarTransform,
              transition: reduceMotion ? 'none' : 'transform 0.3s ease',
            }}
          >
            <path d="M 68 32 L 76 10 L 60 24 Z" fill="#FF7A30" />
            <path d="M 68 28 L 73 15 L 63 24 Z" fill="#FFF5EB" />
          </g>

          {/* Head & Face */}
          <circle cx="54" cy="38" r="18" fill="#FF7A30" />
          <path
            d="M 38 38 C 38 48 48 53 54 53 C 60 53 70 48 70 38 C 66 42 59 44 54 44 C 49 44 42 42 38 38 Z"
            fill="#FFF5EB"
          />

          {/* Eyes with friendly white sparkle */}
          <ellipse cx="47" cy="36" rx="2" ry="2.5" fill="#22252A" />
          <ellipse cx="61" cy="36" rx="2" ry="2.5" fill="#22252A" />
          <circle cx="46.5" cy="35" r="0.7" fill="#FFFFFF" />
          <circle cx="60.5" cy="35" r="0.7" fill="#FFFFFF" />

          {/* Nose */}
          <polygon points="53,42 55,42 54,43.5" fill="#22252A" />
        </g>
      </svg>
    );
  }
);
FoxVectorMascot.displayName = 'FoxVectorMascot';
