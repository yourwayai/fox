import React, { useState, useCallback, useEffect } from 'react';
import { ChatPanel } from './components/ChatPanel';
import { MarkdownReader } from './components/MarkdownReader';
import { SettingsModal } from './components/SettingsModal';
import { DomainConfirmModal } from './components/DomainConfirmModal';
import { useAppStore } from './store/useAppStore';
import { isTauriApp, readMarkdownFileFromPath } from './utils/tauriBridge';
import { computeContentHash, buildDocumentId } from './utils/contextExtractor';

export const App: React.FC = () => {
  const splitRatio = useAppStore((s) => s.splitRatio);
  const setSplitRatio = useAppStore((s) => s.setSplitRatio);
  const setActiveDocument = useAppStore((s) => s.setActiveDocument);
  const [isDragging, setIsDragging] = useState(false);

  // Listen for native OS "open-file" events (CLI argument or Finder double click)
  useEffect(() => {
    if (!isTauriApp()) return;
    let unlistenFn: (() => void) | undefined;
    import('@tauri-apps/api/event').then(({ listen }) => {
      listen<string>('open-file', async (event) => {
        const filePath = event.payload;
        if (!filePath) return;
        const file = await readMarkdownFileFromPath(filePath);
        if (file) {
          const contentHash = computeContentHash(file.content);
          const docId = buildDocumentId(file.name, file.content);
          setActiveDocument(
            {
              id: docId,
              name: file.name,
              filePath: file.path,
              content: file.content,
              contentHash,
              scrollProgress: 0,
              scrollTop: 0,
            },
            true
          );
        }
      }).then((unlisten) => {
        unlistenFn = unlisten;
      });
    });

    return () => {
      unlistenFn?.();
    };
  }, [setActiveDocument]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const newRatio = e.clientX / window.innerWidth;
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
    if (!isDragging) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      className={`flex w-screen h-screen overflow-hidden ${
        isDragging ? 'select-none cursor-col-resize' : ''
      }`}
    >
      {/* Left AI Conversation Panel */}
      <div style={{ width: `${splitRatio * 100}%` }} className="h-full flex-shrink-0">
        <ChatPanel />
      </div>

      {/* Draggable Divider */}
      <div
        onMouseDown={handleMouseDown}
        className="w-1.5 h-full bg-neutral-200 dark:bg-neutral-800 hover:bg-fox-orange/70 cursor-col-resize transition-colors flex-shrink-0 relative group"
      >
        <div className="absolute inset-y-0 -left-1 -right-1 z-20" />
      </div>

      {/* Right Markdown Reader Panel */}
      <div className="flex-1 h-full min-w-0">
        <MarkdownReader />
      </div>

      {/* Settings Modal & Privacy Domain Confirm Modal */}
      <SettingsModal />
      <DomainConfirmModal />
    </div>
  );
};

export default App;
