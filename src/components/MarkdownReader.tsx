import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, Sparkles, PlusCircle, FileText, ArrowDownToLine } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SelectionContext } from '../types';
import { CodeBlock } from './CodeBlock';
import { extractSelectionContext } from '../utils/contextExtractor';

export const MarkdownReader: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeDocument,
    setActiveDocument,
    setScrollProgress,
    setActiveQuote,
    addMessage,
    triggerFocusInput,
  } = useAppStore();

  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    visible: boolean;
    x: number;
    y: number;
    context: SelectionContext | null;
  }>({ visible: false, x: 0, y: 0, context: null });

  // Handle file reading
  const processFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
        alert('请载入 .md 或 .markdown 格式的文件');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = (e.target?.result as string) || '';
        setActiveDocument({
          id: `doc_${Date.now()}_${file.name}`,
          name: file.name,
          content,
          scrollProgress: 0,
        });
      };
      reader.readAsText(file);
    },
    [setActiveDocument]
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

  // Scroll listener for reading progress
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight <= clientHeight) {
      setScrollProgress(100);
      return;
    }
    const progress = Math.min(100, Math.max(0, (scrollTop / (scrollHeight - clientHeight)) * 100));
    setScrollProgress(progress);
  }, [setScrollProgress]);

  // Selection detection with full heading path & surrounding paragraph extraction
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionBox((prev) => ({ ...prev, visible: false }));
        return;
      }

      const extracted = extractSelectionContext();
      if (!extracted || extracted.text.length < 2) {
        setSelectionBox((prev) => ({ ...prev, visible: false }));
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setSelectionBox({
        visible: true,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 46),
        context: extracted,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.selection-toolbar')) return;
      setSelectionBox((prev) => ({ ...prev, visible: false }));
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Action: Explain selection immediately
  const handleExplain = () => {
    if (!selectionBox.context) return;
    const quote = selectionBox.context;
    setActiveQuote(quote);
    setSelectionBox((prev) => ({ ...prev, visible: false }));

    addMessage({
      id: `msg_${Date.now()}`,
      role: 'user',
      content: '请解释这段内容的核心含义及背景。',
      createdAt: Date.now(),
      status: 'idle',
      quote,
    });
  };

  // Action: Add quote to question input
  const handleAddToQuestion = () => {
    if (!selectionBox.context) return;
    const quote = selectionBox.context;
    setActiveQuote(quote);
    setSelectionBox((prev) => ({ ...prev, visible: false }));
    triggerFocusInput();
  };

  // Default sample with code blocks and rich markdown
  useEffect(() => {
    if (!activeDocument) {
      setActiveDocument({
        id: 'sample_readme',
        name: '欢迎体验 Fox.md',
        content: `# 欢迎使用 Fox 🦊

Fox 是专为 **技术阅读与概念深度理解** 设计的 Markdown AI 伴读工具。

> “读到不懂的地方，选中它，即可获得有上下文的解释，同时保持阅读位置不变。”

---

### 🎨 代码高亮与代码块已就绪

Fox 全面支持各类主流语言的代码高亮及一键复制：

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
  console.log("Fox 流式解析就绪 🦊");
}
\`\`\`

\`\`\`python
# 示例：快速分析文档向量相似度
def compute_relevance(query: str, doc_segment: str) -> float:
    print(f"Analyzing relevance for: {query[:20]}...")
    return 0.985
\`\`\`

---

### 🧭 上下文透明与章节追踪

当您在这一小节选中文字时：
1. Fox 会**自动定位您所在的小节层级**（例如：\`欢迎使用 Fox 🦊 > 🧭 上下文透明与章节追踪\`）；
2. 自动抓取选中句子的**前后邻近上下文段落**，作为背景知识提供给 AI；
3. 点击左侧输入框上方的 **【👁️ 发送预览】**，可以随时查看真实发送给 AI 的 Prompt 和 Token 预估，杜绝盲盒！
`,
        scrollProgress: 0,
      });
    }
  }, [activeDocument, setActiveDocument]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="relative flex flex-col h-full bg-white select-text"
    >
      {/* Drag & Drop Visual Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center border-2 border-dashed border-fox-orange m-3 rounded-2xl select-none animate-in fade-in duration-150">
          <div className="p-4 bg-orange-50 rounded-2xl text-fox-darkOrange mb-3 shadow-xs animate-bounce">
            <ArrowDownToLine className="w-10 h-10" />
          </div>
          <h3 className="text-base font-semibold text-neutral-800 mb-1">
            释放鼠标即可载入文档
          </h3>
          <p className="text-xs text-neutral-500">
            支持标准 .md 或 .markdown 格式
          </p>
        </div>
      )}

      {/* Top Header */}
      <div className="h-12 border-b border-neutral-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <FileText className="w-4 h-4 text-neutral-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-neutral-800 truncate">
            {activeDocument?.name || '未打开文档'}
          </span>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded">
            只读预览
          </span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
            accept=".md,.markdown"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-neutral-500" />
            打开文件
          </button>
        </div>
      </div>

      {/* Markdown Reader Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-10 py-8 scroll-smooth"
      >
        <div className="max-w-3xl mx-auto markdown-body">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code: CodeBlock,
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              ),
            }}
          >
            {activeDocument?.content || ''}
          </ReactMarkdown>
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      {selectionBox.visible && selectionBox.context && (
        <div
          className="selection-toolbar fixed z-50 flex items-center gap-1 bg-[#1F242D] text-white px-2 py-1.5 rounded-lg shadow-xl border border-neutral-700 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150 select-none"
          style={{ left: `${selectionBox.x}px`, top: `${selectionBox.y}px` }}
        >
          <button
            onClick={handleExplain}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700 rounded transition-colors text-orange-300 hover:text-orange-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
            解释
          </button>
          <div className="w-[1px] h-3.5 bg-neutral-600" />
          <button
            onClick={handleAddToQuestion}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700 rounded transition-colors text-neutral-200 hover:text-white"
          >
            <PlusCircle className="w-3.5 h-3.5 text-neutral-400" />
            加入提问
          </button>
        </div>
      )}
    </div>
  );
};
