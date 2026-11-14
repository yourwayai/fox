import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Upload, Sparkles, PlusCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SelectionContext } from '../types';

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

  const [selectionBox, setSelectionBox] = useState<{
    visible: boolean;
    x: number;
    y: number;
    selectedText: string;
  }>({ visible: false, x: 0, y: 0, selectedText: '' });

  // Handle file reading
  const handleFileChange = (file: File) => {
    if (!file.name.endsWith('.md') && !file.name.endsWith('.markdown')) {
      alert('请上传 .md 或 .markdown 格式的文件');
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

  // Selection detection
  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setSelectionBox((prev) => ({ ...prev, visible: false }));
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Show floating popup directly above selection
      setSelectionBox({
        visible: true,
        x: rect.left + rect.width / 2,
        y: Math.max(10, rect.top - 46),
        selectedText: text,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Don't close if clicking within the floating popup
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
    if (!selectionBox.selectedText) return;
    const quote: SelectionContext = {
      id: `quote_${Date.now()}`,
      text: selectionBox.selectedText,
    };
    setActiveQuote(quote);
    setSelectionBox((prev) => ({ ...prev, visible: false }));

    // Send explain prompt directly
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
    if (!selectionBox.selectedText) return;
    const quote: SelectionContext = {
      id: `quote_${Date.now()}`,
      text: selectionBox.selectedText,
    };
    setActiveQuote(quote);
    setSelectionBox((prev) => ({ ...prev, visible: false }));
    triggerFocusInput();
  };

  // Load default sample if no doc
  useEffect(() => {
    if (!activeDocument) {
      setActiveDocument({
        id: 'sample_readme',
        name: '欢迎体验 Fox.md',
        content: `# 欢迎使用 Fox 🦊

Fox 是专为 **深度阅读与概念理解** 设计的 Markdown AI 伴读工具。

> “读到不懂的地方，选中它，即可获得有上下文的解释，同时保持阅读位置不变。”

---

### 快速上手

1. **选中任意文本**：例如选中这一段文字，会自动浮现 **[✨ 解释]** 和 **[➕ 加入提问]** 按钮。
2. **点击 [✨ 解释]**：Fox 将在左侧对话栏为您针对性解读，无需来回复制粘贴。
3. **点击 [➕ 加入提问]**：引用段落将自动作为上下文附着在输入框上方，便于您连续追问。
4. **尾巴与耳朵反馈**：
   - 当您在右侧滚动页面时，请观察左上角的小狐狸，**大尾巴会随着您的阅读进度舒展与抬起**；
   - 顶部状态徽章会随着 AI 服务的状态（就绪、思考、生成中）灵动切换。

---

### 技术规格简述

- **只读沙箱**：不修改原文档，不执行 Markdown 中嵌入的恶意脚本。
- **自定义 AI 服务**：点击左上角齿轮设置，支持接入任何兼容 OpenAI 协议的端点（如 DeepSeek、OpenAI、本地 Ollama 等）。
- **可控上下文预算**：所有发送给 AI 的引用均透明可见，杜绝隐式截断。

*祝您阅读愉快！随时在右上方点击【打开文档】导入您自己的 Markdown 学习资料。*
`,
        scrollProgress: 0,
      });
    }
  }, [activeDocument, setActiveDocument]);

  return (
    <div className="relative flex flex-col h-full bg-white select-text">
      {/* Top Header */}
      <div className="h-12 border-b border-neutral-200 px-6 flex items-center justify-between bg-white/80 backdrop-blur z-10 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
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
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
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
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {activeDocument?.content || ''}
          </ReactMarkdown>
        </div>
      </div>

      {/* Floating Selection Toolbar */}
      {selectionBox.visible && (
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
