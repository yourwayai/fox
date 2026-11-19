import React, { useRef, useEffect, useState, useCallback, useMemo, memo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import {
  Upload,
  Sparkles,
  PlusCircle,
  FileText,
  ArrowDownToLine,
  ChevronDown,
  Clock,
  Trash2,
  Check,
  ListTree,
  Search,
  Lightbulb,
  Cpu,
  Code2,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SelectionContext, PromptActionType } from '../types';
import { MarkdownPre, InlineCode, isSafeLinkHref } from './CodeBlock';
import { TableOfContents } from './TableOfContents';
import { DocumentSearch } from './DocumentSearch';
import { isTauriApp, openExternal, resolveMarkdownImageSrc } from '../utils/tauriBridge';
import {
  extractSelectionContext,
  computeContentHash,
  buildDocumentId,
  slugifyHeading,
  extractTocFromMarkdown,
} from '../utils/contextExtractor';

function extractNodeText(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return '';
}

interface RenderedMarkdownBodyProps {
  content: string;
  filePath?: string;
  onAnchorNavigate: (anchorId: string) => void;
}

/**
 * Memoized Markdown document renderer with KaTeX, Mermaid and Slug support:
 * Isolated from scroll progress updates so large Markdown ASTs
 * are ONLY parsed and rendered when `content` actually changes.
 */
const RenderedMarkdownBody: React.FC<RenderedMarkdownBodyProps> = memo(
  ({ content, filePath, onAnchorNavigate }) => {
    const markdownComponents: Components = React.useMemo(
      () => ({
        pre: MarkdownPre,
        code: InlineCode,
        img: ({ src, alt, ...props }) => {
          const resolved = resolveMarkdownImageSrc(src || '', filePath);
          return (
            <img
              src={resolved}
              alt={alt || ''}
              loading="lazy"
              className="max-w-full rounded-md shadow-sm my-3 border border-neutral-200 dark:border-neutral-800"
              {...props}
            />
          );
        },
        h1: ({ children }) => <h1 id={slugifyHeading(extractNodeText(children))}>{children}</h1>,
        h2: ({ children }) => <h2 id={slugifyHeading(extractNodeText(children))}>{children}</h2>,
        h3: ({ children }) => <h3 id={slugifyHeading(extractNodeText(children))}>{children}</h3>,
        h4: ({ children }) => <h4 id={slugifyHeading(extractNodeText(children))}>{children}</h4>,
        h5: ({ children }) => <h5 id={slugifyHeading(extractNodeText(children))}>{children}</h5>,
        h6: ({ children }) => <h6 id={slugifyHeading(extractNodeText(children))}>{children}</h6>,
        a: ({ href, children }) => {
          if (!isSafeLinkHref(href)) {
            return (
              <span className="text-neutral-500 dark:text-neutral-400 underline decoration-dotted">
                {children}
              </span>
            );
          }
          if (href && href.startsWith('#')) {
            return (
              <a
                href={href}
                onClick={(e) => {
                  e.preventDefault();
                  const rawId = decodeURIComponent(href.slice(1));
                  onAnchorNavigate(rawId);
                }}
              >
                {children}
              </a>
            );
          }
          return (
            <a
              href={href}
              onClick={(e) => {
                if (isTauriApp()) {
                  e.preventDefault();
                  openExternal(href || '');
                }
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
      }),
      [filePath, onAnchorNavigate]
    );

    return (
      <div className="max-w-3xl mx-auto markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeSlug, rehypeKatex]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
);
RenderedMarkdownBody.displayName = 'RenderedMarkdownBody';

const DEFAULT_SAMPLE_CONTENT = `# 欢迎使用 Fox 🦊

Fox 是专为 **技术阅读、概念深剖与公式理解** 设计的 Markdown AI 伴读工具。

> “读到不懂的地方，选中它，即可获得有上下文的解释，同时保持阅读位置不变。”

---

## 一、数学公式解析演示 (KaTeX)

Fox 内置行内与独立块数学公式渲染，学术材料与算法论文无缝呈现：

- **行内公式**：质能方程为 $E = mc^2$，高斯正态分布常数项 $\frac{1}{\sigma \sqrt{2\pi}}$。
- **独立公式块**：欧拉恒等式与柯西不等式：

$$e^{i\pi} + 1 = 0$$

$$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$

---

## 二、架构流程图演示 (Mermaid)

代码块标注 \`mermaid\` 时，Fox 会按需自动编译为高清晰度矢量流程图，并支持一键切换查看源码：

\`\`\`mermaid
flowchart LR
    A["📖 原文阅读"] --> B["✨ 划选难点句子"]
    B --> C{"💡 选区伴读指令"}
    C -->|类比| D["通俗生动解释"]
    C -->|推导| E["底层原理分析"]
    C -->|评审| F["代码审查优化"]
    D & E & F --> G["📥 导出 Markdown 笔记"]
\`\`\`

---

## 三、代码高亮与行内标记

同时支持行内代码（如 \`AIService.streamChat()\`）与独立代码块高亮及一键复制：

\`\`\`typescript
// src/services/aiService.ts
export interface ChatCompletionChunk {
  id: string;
  choices: Array<{
    delta: { content?: string };
    finish_reason: string | null;
  }>;
}

export async function parseSSE(stream: ReadableStream<Uint8Array>) {
  console.log("Fox 流式伴读解析就绪 🦊");
}
\`\`\`

---

## 四、核心伴读特性速览

1. **多维伴读指令预设**：划选文字即可触发 \`[解释]\`、\`[类比]\`、\`[深度]\`、\`[评审]\` 四套智能指令；
2. **浮动大纲与正文搜索**：点击顶部导航栏右上角的 \`大纲\` 或快捷键 \`Cmd+F\`，即可快速检索全篇与章节跳跃；
3. **精准阅读位置恢复**：毫秒级记忆精确到像素的滚动位置，切换文档后切回瞬间恢复；
4. **AI 回答二次追问**：阅读左侧 AI 的解释时，划选不明白的词汇同样可一键发起深度追问！
`;

export const MarkdownReader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const markdownBodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRafRef = useRef<number | null>(null);

  // Fine-grained Zustand subscriptions
  const activeDocId = useAppStore((s) => s.activeDocument?.id);
  const activeDocName = useAppStore((s) => s.activeDocument?.name);
  const activeDocFilePath = useAppStore((s) => s.activeDocument?.filePath);
  const activeDocContent = useAppStore((s) => s.activeDocument?.content || '');
  const activeDocInitialScrollTop = useAppStore((s) => s.activeDocument?.scrollTop || 0);
  const readingProgress = useAppStore((s) => s.readingProgress);
  const recentDocs = useAppStore((s) => s.recentDocs);
  const highlightQuoteText = useAppStore((s) => s.highlightQuoteText);
  const highlightSignal = useAppStore((s) => s.highlightSignal);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const isTocOpen = useAppStore((s) => s.isTocOpen);
  const setIsTocOpen = useAppStore((s) => s.setIsTocOpen);
  const openFileSignal = useAppStore((s) => s.openFileSignal);
  const triggerOpenFile = useAppStore((s) => s.triggerOpenFile);

  const setActiveDocument = useAppStore((s) => s.setActiveDocument);
  const openRecentDocument = useAppStore((s) => s.openRecentDocument);
  const removeRecentDocument = useAppStore((s) => s.removeRecentDocument);
  const setScrollPosition = useAppStore((s) => s.setScrollPosition);
  const setActiveQuote = useAppStore((s) => s.setActiveQuote);
  const executePromptAction = useAppStore((s) => s.executePromptAction);
  const triggerFocusInput = useAppStore((s) => s.triggerFocusInput);

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isDocDropdownOpen, setIsDocDropdownOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Extract TOC items from active content
  const tocItems = useMemo(
    () => extractTocFromMarkdown(activeDocContent),
    [activeDocContent]
  );

  const [selectionBox, setSelectionBox] = useState<{
    visible: boolean;
    x: number;
    y: number;
    context: SelectionContext | null;
  }>({ visible: false, x: 0, y: 0, context: null });

  // Listen for global open file trigger (e.g. Cmd+O in Web mode)
  useEffect(() => {
    if (openFileSignal > 0 && !isTauriApp()) {
      fileInputRef.current?.click();
    }
  }, [openFileSignal]);

  // Handle file loading with collision-free ID, filePath and contentHash
  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        alert('请载入 .md 或 .markdown 格式的文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        const contentHash = computeContentHash(content);
        const docId = buildDocumentId(file.name, content);
        const filePath = (file as any).path ? String((file as any).path) : undefined;
        setActiveDocument({
          id: docId,
          name: file.name,
          filePath,
          content,
          contentHash,
          scrollProgress: 0,
          scrollTop: 0,
        });
      };
      reader.readAsText(file);
    },
    [setActiveDocument]
  );

  // In-document #anchor smooth navigation
  const handleAnchorNavigate = useCallback(
    (rawAnchor: string) => {
      if (!containerRef.current) return;
      const slug = slugifyHeading(rawAnchor);
      const target =
        containerRef.current.querySelector(`#${CSS.escape(rawAnchor)}`) ||
        (slug ? containerRef.current.querySelector(`#${CSS.escape(slug)}`) : null);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({
          behavior: reduceMotion ? ('instant' as ScrollBehavior) : 'smooth',
          block: 'start',
        });
        setActiveHeadingId(target.id);
      }
    },
    [reduceMotion]
  );

  // Drag and Drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // rAF-throttled scroll listener with active heading tracking
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = window.requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (!containerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      if (scrollHeight <= clientHeight) {
        setScrollPosition(0, scrollTop);
        return;
      }
      const progress = Math.min(
        100,
        Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100)
      );
      setScrollPosition(progress, scrollTop);

      // Track currently active heading for TOC
      const headings = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          '.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4'
        )
      );
      if (headings.length > 0) {
        let currentActive: HTMLElement = headings[0];
        for (const h of headings) {
          const rect = h.getBoundingClientRect();
          if (rect.top <= 140) {
            currentActive = h;
          } else {
            break;
          }
        }
        if (currentActive && currentActive.id) {
          setActiveHeadingId(currentActive.id);
        }
      }
    });
  }, [setScrollPosition]);

  useEffect(() => {
    return () => {
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  // Keyboard shortcut listener (Cmd+F / Ctrl+F for Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Restore exact reading scroll position when switching documents
  useEffect(() => {
    if (!containerRef.current || !activeDocId) return;
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTo({
          top: activeDocInitialScrollTop || 0,
          behavior: 'instant' as ScrollBehavior,
        });
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [activeDocId, activeDocInitialScrollTop]);

  // Reverse locator: scroll to quote and pulse highlight
  useEffect(() => {
    if (!highlightQuoteText || !containerRef.current) return;

    const container = containerRef.current;
    const cleanSearch = highlightQuoteText.trim().slice(0, 80).toLowerCase();

    container.querySelectorAll('.fox-quote-highlight').forEach((el) => {
      el.classList.remove('fox-quote-highlight');
    });

    const allElements = Array.from(
      container.querySelectorAll(
        '.markdown-body p, .markdown-body li, .markdown-body blockquote, .markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body pre, .markdown-body td'
      )
    );

    let matchEl: HTMLElement | null = null;
    for (const el of allElements) {
      const text = el.textContent?.toLowerCase() || '';
      if (text.includes(cleanSearch)) {
        matchEl = el as HTMLElement;
        break;
      }
    }

    if (matchEl) {
      matchEl.scrollIntoView({
        behavior: reduceMotion ? ('instant' as ScrollBehavior) : 'smooth',
        block: 'center',
      });
      matchEl.classList.add('fox-quote-highlight');

      const removeTimer = setTimeout(
        () => {
          matchEl?.classList.remove('fox-quote-highlight');
        },
        reduceMotion ? 1200 : 2500
      );

      return () => clearTimeout(removeTimer);
    }
  }, [highlightSignal, highlightQuoteText, reduceMotion]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scoped selection detection strictly inside the Markdown reader body
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.selection-toolbar') || target?.closest('.search-toolbar')) return;

      const readerEl = markdownBodyRef.current;
      if (!readerEl) return;

      const extracted = extractSelectionContext(readerEl);
      if (!extracted || extracted.text.length < 2) {
        setSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerBounds = containerRef.current?.getBoundingClientRect();

      const minX = (containerBounds?.left ?? 0) + 140;
      const maxX = (containerBounds?.right ?? window.innerWidth) - 140;
      const clampedX = Math.min(maxX, Math.max(minX, rect.left + rect.width / 2));

      const placeBelow = rect.top < 70;
      const posY = placeBelow ? rect.bottom + 12 : rect.top - 50;

      setSelectionBox({
        visible: true,
        x: clampedX,
        y: Math.max(10, posY),
        context: extracted,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.selection-toolbar') || target.closest('.doc-dropdown')) return;
      setSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Preset action triggers
  const handleTriggerAction = (action: PromptActionType) => {
    if (!selectionBox.context) return;
    const quote = selectionBox.context;
    setSelectionBox((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
    void executePromptAction(quote, action);
  };

  // Action: Add quote to question input
  const handleAddToQuestion = () => {
    if (!selectionBox.context) return;
    const quote = selectionBox.context;
    setActiveQuote(quote);
    setSelectionBox((prev) => ({ ...prev, visible: false }));
    window.getSelection()?.removeAllRanges();
    triggerFocusInput();
  };

  // Load default welcome document on first launch
  useEffect(() => {
    if (!activeDocId) {
      setActiveDocument({
        id: 'sample_readme',
        name: '欢迎体验 Fox.md',
        content: DEFAULT_SAMPLE_CONTENT,
        contentHash: computeContentHash(DEFAULT_SAMPLE_CONTENT),
        scrollProgress: 0,
        scrollTop: 0,
      });
    }
  }, [activeDocId, setActiveDocument]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-full bg-white dark:bg-[#141416] select-text transition-colors duration-150"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-white/95 dark:bg-[#18181A]/95 backdrop-blur-sm flex flex-col items-center justify-center border-2 border-dashed border-fox-orange m-3 rounded-2xl select-none fox-pop-in">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/40 rounded-2xl text-fox-darkOrange mb-3 shadow-sm animate-bounce">
            <ArrowDownToLine className="w-10 h-10" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
            释放鼠标即可载入文档
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            支持标准 .md 或 .markdown 格式
          </p>
        </div>
      )}

      {/* Top Header */}
      <div
        data-tauri-drag-region
        className="h-12 border-b border-neutral-200 dark:border-neutral-800 px-6 flex items-center justify-between bg-white/80 dark:bg-[#141416]/80 backdrop-blur-sm z-20 flex-shrink-0 select-none"
      >
        {/* Document Switcher Dropdown */}
        <div className="relative flex items-center gap-2 min-w-0" ref={dropdownRef}>
          <FileText className="w-4 h-4 text-neutral-500 dark:text-neutral-400 flex-shrink-0" />

          <button
            type="button"
            onClick={() => setIsDocDropdownOpen(!isDocDropdownOpen)}
            className="group flex items-center gap-1.5 text-sm font-semibold text-neutral-800 dark:text-neutral-100 hover:text-fox-darkOrange dark:hover:text-fox-orange transition-colors max-w-[240px] truncate select-none text-left"
            title="点击切换最近打开的文档"
          >
            <span className="truncate">{activeDocName || '未打开文档'}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-fox-darkOrange transition-transform flex-shrink-0 ${
                isDocDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <span className="text-xs text-neutral-400 dark:text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded select-none flex-shrink-0">
            {activeDocId ? `已读 ${Math.round(readingProgress || 0)}%` : '只读'}
          </span>

          {/* Recent Docs Dropdown Menu */}
          {isDocDropdownOpen && (
            <div className="doc-dropdown absolute left-0 top-10 w-72 bg-white dark:bg-[#1C1C20] rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50 fox-pop-in select-none">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 flex items-center gap-1 border-b border-neutral-100 dark:border-neutral-800">
                <Clock className="w-3.5 h-3.5" />
                <span>最近阅读的文档 ({recentDocs.length})</span>
              </div>

              <div className="max-h-60 overflow-y-auto py-1">
                {recentDocs.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
                    暂无历史文档
                  </div>
                ) : (
                  recentDocs.map((doc) => {
                    const isActive = doc.id === activeDocId;
                    return (
                      <div
                        key={doc.id}
                        className={`group/item px-3 py-2 flex items-center justify-between text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/60 cursor-pointer transition-colors ${
                          isActive
                            ? 'bg-orange-50/70 dark:bg-orange-950/40 text-fox-darkOrange dark:text-fox-orange font-medium'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                        onClick={() => {
                          openRecentDocument(doc.id);
                          setIsDocDropdownOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isActive ? (
                            <Check className="w-3.5 h-3.5 text-fox-orange flex-shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                          )}
                          <div className="truncate">
                            <div className="truncate text-xs">{doc.name}</div>
                            <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                              进度 {Math.round(doc.scrollProgress)}% · 像素{' '}
                              {Math.round(doc.scrollTop)}px
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentDocument(doc.id);
                          }}
                          title="从历史中移除"
                          className="opacity-0 group-hover/item:opacity-100 p-1 text-neutral-400 hover:text-red-500 rounded transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Icons: Search + TOC toggle + Open file */}
        <div className="flex items-center gap-2 select-none">
          {/* In-Document Search Toggle */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isSearchOpen
                ? 'bg-orange-50 dark:bg-orange-950/50 text-fox-darkOrange dark:text-fox-orange font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title="查找正文 (Cmd+F / Ctrl+F)"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">查找</span>
          </button>

          {/* Table of Contents Toggle */}
          <button
            type="button"
            onClick={() => setIsTocOpen(!isTocOpen)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors ${
              isTocOpen
                ? 'bg-orange-50 dark:bg-orange-950/50 text-fox-darkOrange dark:text-fox-orange font-semibold'
                : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
            title={isTocOpen ? '收起大纲 (Cmd+B / Cmd+T)' : '展开大纲 (Cmd+B / Cmd+T)'}
          >
            <ListTree className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span className="hidden sm:inline">大纲</span>
            {tocItems.length > 0 && (
              <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.2 rounded-full">
                {tocItems.length}
              </span>
            )}
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) processFile(file);
              e.target.value = '';
            }}
            accept=".md,.markdown"
            className="hidden"
          />
          <button
            type="button"
            onClick={triggerOpenFile}
            title="打开本地 Markdown 文件 (Cmd+O)"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-md transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
            <span>打开文件</span>
          </button>
        </div>
      </div>

      {/* Main Body Area: Document on Left, optional TOC Drawer on Right */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* In-Document Search Bar */}
        <DocumentSearch
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          containerRef={containerRef}
        />

        {/* Markdown Reader Body */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onWheel={() => {
            if (selectionBox.visible) {
              setSelectionBox((prev) => ({ ...prev, visible: false }));
            }
          }}
          className="flex-1 overflow-y-auto px-10 py-8"
        >
          <div ref={markdownBodyRef}>
            <RenderedMarkdownBody
              content={activeDocContent}
              filePath={activeDocFilePath}
              onAnchorNavigate={handleAnchorNavigate}
            />
          </div>
        </div>

        {/* Collapsible / Slide-over Table of Contents Panel */}
        {isTocOpen && (
          <TableOfContents
            items={tocItems}
            activeHeadingId={activeHeadingId}
            onNavigate={handleAnchorNavigate}
            onClose={() => setIsTocOpen(false)}
          />
        )}
      </div>

      {/* Floating Selection Toolbar with Multi-Action Presets */}
      {selectionBox.visible && selectionBox.context && (
        <div
          className="selection-toolbar fixed z-50 flex items-center gap-1 bg-[#1F242D] text-white px-2 py-1.5 rounded-xl shadow-2xl border border-neutral-700 -translate-x-1/2 fox-pop-in select-none"
          style={{ left: `${selectionBox.x}px`, top: `${selectionBox.y}px` }}
        >
          <button
            type="button"
            onClick={() => handleTriggerAction('explain')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-orange-300 hover:text-orange-200"
            title="快速解释核心概念与背景"
          >
            <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
            解释
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('analogy')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-amber-200 hover:text-amber-100"
            title="通俗浅显的比喻类比说明"
          >
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            类比
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('deep_dive')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-cyan-200 hover:text-cyan-100"
            title="深度技术推导与权衡分析"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            推导
          </button>

          <button
            type="button"
            onClick={() => handleTriggerAction('code_review')}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-emerald-200 hover:text-emerald-100"
            title="审查复杂度、潜在缺陷与重构建议"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            审查
          </button>

          <div className="w-[1px] h-3.5 bg-neutral-600 mx-0.5" />

          <button
            type="button"
            onClick={handleAddToQuestion}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-neutral-300 hover:text-white"
            title="作为引用填入提问框自拟问题"
          >
            <PlusCircle className="w-3.5 h-3.5 text-neutral-400" />
            加入提问
          </button>
        </div>
      )}
    </div>
  );
};
