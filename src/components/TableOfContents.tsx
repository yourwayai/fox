import React, { useState, useMemo, useEffect, useRef } from 'react';
import { TocItem } from '../types';
import { X, Search, ListTree, ChevronRight } from 'lucide-react';

interface TableOfContentsProps {
  items: TocItem[];
  activeHeadingId: string | null;
  onNavigate: (headingId: string) => void;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  activeHeadingId,
  onNavigate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.text.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Keep active heading visible inside TOC list
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, [activeHeadingId]);

  return (
    <div className="w-72 h-full flex flex-col bg-white/95 dark:bg-[#18181B]/95 backdrop-blur-md border-l border-neutral-200 dark:border-neutral-800 select-none z-30 transition-all flex-shrink-0 shadow-lg animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="h-12 px-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-neutral-800 dark:text-neutral-100 font-semibold text-xs">
          <ListTree className="w-4 h-4 text-fox-orange" />
          <span>文档大纲 ({items.length})</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          title="关闭大纲"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar in TOC */}
      {items.length > 6 && (
        <div className="p-2.5 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-neutral-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="快速过滤章节…"
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-neutral-100 dark:bg-neutral-800/60 text-neutral-800 dark:text-neutral-200 rounded-lg border-0 focus:ring-1 focus:ring-fox-orange focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOC Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredItems.length === 0 ? (
          <div className="p-6 text-center text-xs text-neutral-400">
            {searchQuery ? '无匹配章节' : '文档中暂未包含标题'}
          </div>
        ) : (
          filteredItems.map((item) => {
            const isActive = item.id === activeHeadingId;
            const indentClass =
              item.level === 1
                ? 'pl-2 font-semibold text-neutral-800 dark:text-neutral-100'
                : item.level === 2
                  ? 'pl-4 font-medium text-neutral-700 dark:text-neutral-200'
                  : item.level === 3
                    ? 'pl-6 text-neutral-600 dark:text-neutral-400'
                    : 'pl-8 text-neutral-500 dark:text-neutral-500 text-[11px]';

            return (
              <button
                key={item.id}
                ref={isActive ? activeItemRef : null}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full group text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between gap-1.5 ${indentClass} ${
                  isActive
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-fox-darkOrange dark:text-fox-orange font-semibold border-l-2 border-fox-orange'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
                title={item.text}
              >
                <span className="truncate flex-1">{item.text}</span>
                <ChevronRight
                  className={`w-3 h-3 flex-shrink-0 transition-opacity ${
                    isActive
                      ? 'opacity-100 text-fox-orange'
                      : 'opacity-0 group-hover:opacity-60 text-neutral-400'
                  }`}
                />
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
