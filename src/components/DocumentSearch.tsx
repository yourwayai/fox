import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronUp, ChevronDown, X } from 'lucide-react';

interface DocumentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  isOpen,
  onClose,
  containerRef,
}) => {
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<HTMLElement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.select();
    } else {
      setQuery('');
      clearHighlights();
    }
  }, [isOpen]);

  const clearHighlights = useCallback(() => {
    if (!containerRef.current) return;
    const marks = containerRef.current.querySelectorAll('.fox-search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
        parent.normalize();
      }
    });
    setMatches([]);
    setCurrentIndex(0);
  }, [containerRef]);

  // Perform search highlighting
  const performSearch = useCallback(() => {
    clearHighlights();
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery || !containerRef.current) return;

    const walker = document.createTreeWalker(
      containerRef.current,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.textContent?.toLowerCase().includes(cleanQuery)) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (
            parent &&
            (parent.tagName === 'SCRIPT' ||
              parent.tagName === 'STYLE' ||
              parent.classList.contains('fox-search-highlight'))
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        },
      }
    );

    const textNodes: Text[] = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      textNodes.push(currentNode as Text);
      currentNode = walker.nextNode();
    }

    const createdMatches: HTMLElement[] = [];
    textNodes.forEach((textNode) => {
      const parent = textNode.parentNode;
      if (!parent) return;

      const text = textNode.nodeValue || '';
      const lower = text.toLowerCase();
      let startIndex = 0;
      let matchIdx = lower.indexOf(cleanQuery, startIndex);

      if (matchIdx === -1) return;

      const fragment = document.createDocumentFragment();

      while (matchIdx !== -1) {
        // Text before match
        if (matchIdx > startIndex) {
          fragment.appendChild(document.createTextNode(text.slice(startIndex, matchIdx)));
        }

        // Highlighted mark
        const mark = document.createElement('mark');
        mark.className =
          'fox-search-highlight bg-amber-200 dark:bg-amber-500/40 text-neutral-900 dark:text-neutral-100 rounded-xs px-0.5';
        mark.textContent = text.slice(matchIdx, matchIdx + cleanQuery.length);
        fragment.appendChild(mark);
        createdMatches.push(mark);

        startIndex = matchIdx + cleanQuery.length;
        matchIdx = lower.indexOf(cleanQuery, startIndex);
      }

      // Remaining trailing text
      if (startIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(startIndex)));
      }

      parent.replaceChild(fragment, textNode);
    });

    setMatches(createdMatches);
    if (createdMatches.length > 0) {
      setCurrentIndex(0);
      highlightCurrent(createdMatches, 0);
    }
  }, [query, containerRef, clearHighlights]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 150);
    return () => clearTimeout(timer);
  }, [query, performSearch]);

  const highlightCurrent = (matchList: HTMLElement[], idx: number) => {
    matchList.forEach((el, i) => {
      if (i === idx) {
        el.classList.add('!bg-fox-orange', '!text-white');
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } else {
        el.classList.remove('!bg-fox-orange', '!text-white');
      }
    });
  };

  const handleNext = () => {
    if (matches.length === 0) return;
    const nextIdx = (currentIndex + 1) % matches.length;
    setCurrentIndex(nextIdx);
    highlightCurrent(matches, nextIdx);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    const prevIdx = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prevIdx);
    highlightCurrent(matches, prevIdx);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        handlePrev();
      } else {
        handleNext();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-6 top-14 z-40 flex items-center gap-1.5 bg-white dark:bg-[#1F2228] p-1.5 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 select-none animate-in fade-in zoom-in-95 duration-150">
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-2 text-neutral-400 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="查找正文…"
          className="w-44 pl-7 pr-2 py-1 text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-fox-orange"
        />
      </div>

      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 px-1 font-mono min-w-[50px] text-center">
        {matches.length > 0
          ? `${currentIndex + 1}/${matches.length}`
          : query.trim()
            ? '0 匹配'
            : ''}
      </span>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={handlePrev}
          disabled={matches.length === 0}
          className="p-1 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-40 transition-colors"
          title="上一个 (Shift+Enter)"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={matches.length === 0}
          className="p-1 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-40 transition-colors"
          title="下一个 (Enter)"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors ml-1"
          title="关闭搜索 (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
