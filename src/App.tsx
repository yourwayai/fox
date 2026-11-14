import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MarkdownReader } from './components/MarkdownReader';
import { SettingsModal } from './components/SettingsModal';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const { splitRatio, setSplitRatio } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newRatio = e.clientX / window.innerWidth;
      // Clamp between 25% and 60%
      if (newRatio >= 0.25 && newRatio <= 0.6) {
        setSplitRatio(newRatio);
      }
    },
    [isDragging, setSplitRatio]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={`flex w-screen h-screen overflow-hidden ${isDragging ? 'select-none cursor-col-resize' : ''}`}>
      {/* Left AI Conversation Panel */}
      <div
        style={{ width: `${splitRatio * 100}%` }}
        className="h-full flex-shrink-0"
      >
        <ChatPanel />
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1.5 h-full bg-neutral-200 hover:bg-fox-orange/70 cursor-col-resize transition-colors flex-shrink-0 relative group"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 z-20" />
      </div>

      {/* Right Markdown Reader Panel */}
      <div className="flex-1 h-full min-w-0">
        <MarkdownReader />
      </div>

      {/* Settings Modal */}
      <SettingsModal />
    </div>
  );
};

export default App;
