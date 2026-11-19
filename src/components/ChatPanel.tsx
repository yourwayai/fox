import React, { useState, useRef, useEffect, useMemo, memo, useCallback } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  Send,
  Square,
  X,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Quote,
  Settings,
  AlertCircle,
  Eye,
  Compass,
  AlertTriangle,
  LocateFixed,
  Download,
  Info,
  BookOpen,
  Sun,
  Moon,
  Monitor,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FoxMascot } from './FoxMascot';
import { MarkdownPre, InlineCode, isSafeLinkHref } from './CodeBlock';
import { PromptPreviewModal } from './PromptPreviewModal';
import { AIService } from '../services/aiService';
import { ChatMessage, ProviderConfig } from '../types';
import { isTauriApp, openExternal } from '../utils/tauriBridge';

const CHAT_MD_COMPONENTS: Components = {
  pre: MarkdownPre,
  code: InlineCode,
  a: ({ href, children }) => {
    if (!isSafeLinkHref(href)) {
      return (
        <span className="text-neutral-500 dark:text-neutral-400 underline decoration-dotted">
          {children}
        </span>
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
};

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isCopied: boolean;
  onCopy: (id: string, text: string) => void;
  onRetry: () => void;
  onRegenerate: (messageId: string, targetConfigId?: string) => void;
  onScrollToQuote: (text: string) => void;
  providerConfigs: ProviderConfig[];
  activeConfigId: string | null;
}

/**
 * Memoized single chat message bubble:
 * Prevents re-parsing historical Markdown messages during SSE streaming or input typing.
 */
const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = memo(
  ({
    message: m,
    isCopied,
    onCopy,
    onRetry,
    onRegenerate,
    onScrollToQuote,
    providerConfigs,
    activeConfigId,
  }) => {
    const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

    return (
      <div className="flex flex-col space-y-1.5">
        {/* User Quote preview card with reverse locator click */}
        {m.quote && (
          <div
            onClick={() => m.quote && onScrollToQuote(m.quote.text)}
            className="group/quote text-xs border-l-2 border-fox-orange bg-orange-50/70 dark:bg-orange-950/30 hover:bg-orange-100/80 dark:hover:bg-orange-900/40 p-2.5 rounded-r-md text-neutral-600 dark:text-neutral-300 mb-1 cursor-pointer transition-colors shadow-sm"
            title="点击右侧平滑定位并高亮原文"
          >
            <div className="flex items-center justify-between text-[10px] font-semibold text-fox-darkOrange dark:text-fox-orange uppercase mb-1">
              <span className="flex items-center gap-1">
                <Quote className="w-3 h-3" />
                选区引用
                <span className="opacity-0 group-hover/quote:opacity-100 text-[10px] text-fox-darkOrange dark:text-fox-orange font-normal flex items-center gap-0.5 ml-1 transition-opacity">
                  <LocateFixed className="w-3 h-3" /> 定位原文
                </span>
              </span>
              {m.quote.headingPath && (
                <span className="flex items-center gap-1 text-neutral-400 dark:text-neutral-500 font-normal truncate max-w-[180px]">
                  <Compass className="w-3 h-3 flex-shrink-0" />
                  {m.quote.headingPath}
                </span>
              )}
            </div>
            <div className="line-clamp-3 text-neutral-700 dark:text-neutral-300 italic group-hover/quote:text-neutral-900 dark:group-hover/quote:text-white transition-colors">
              "{m.quote.text}"
            </div>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative group rounded-xl p-3 text-xs leading-relaxed ${
            m.role === 'user'
              ? 'bg-neutral-200/70 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 ml-6 self-end'
              : 'bg-white dark:bg-[#18181B] border border-neutral-200/80 dark:border-neutral-800 shadow-sm mr-2 self-start'
          }`}
        >
          {m.role === 'assistant' ? (
            <div className="chat-assistant-content">
              {m.status === 'streaming' && !m.content && (
                <span className="inline-flex items-center gap-1.5 text-neutral-400 dark:text-neutral-500 italic">
                  <span className="w-1.5 h-1.5 rounded-full bg-fox-orange animate-ping" />
                  思考并组织回答中…
                </span>
              )}

              {m.content && (
                <div className="markdown-body text-xs prose-neutral max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={CHAT_MD_COMPONENTS}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              )}

              {/* Error state */}
              {m.status === 'error' && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-lg flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{m.errorMessage || '请求失败'}</p>
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-1 flex items-center gap-1 text-[11px] underline hover:text-red-700 dark:hover:text-red-300"
                    >
                      <RotateCcw className="w-3 h-3" />
                      重试（保留原上下文）
                    </button>
                  </div>
                </div>
              )}

              {/* Footer copy & model tag & regenerate */}
              <div className="mt-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 select-none">
                <div className="relative flex items-center gap-1.5">
                  <span className="font-mono">{m.modelName || 'AI'}</span>
                  {m.status === 'done' && (
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          if (providerConfigs.length <= 1) {
                            onRegenerate(m.id);
                          } else {
                            setIsModelMenuOpen(!isModelMenuOpen);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 px-1 py-0.5 rounded text-neutral-400 hover:text-fox-darkOrange dark:hover:text-fox-orange hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        title="换模型重新生成本条回答"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>换模型重答</span>
                      </button>

                      {isModelMenuOpen && providerConfigs.length > 1 && (
                        <div className="absolute left-0 bottom-full mb-1 w-44 bg-white dark:bg-[#1E1E22] border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg py-1 z-30 fox-pop-in">
                          <div className="px-2 py-1 text-[9px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                            选择模型重新回答
                          </div>
                          {providerConfigs.map((cfg) => (
                            <button
                              key={cfg.id}
                              type="button"
                              onClick={() => {
                                setIsModelMenuOpen(false);
                                onRegenerate(m.id, cfg.id);
                              }}
                              className={`w-full text-left px-2.5 py-1.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-between transition-colors ${
                                cfg.id === activeConfigId
                                  ? 'text-fox-darkOrange dark:text-fox-orange font-medium'
                                  : 'text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <span className="truncate">{cfg.name}</span>
                              <span className="text-[10px] text-neutral-400 font-mono truncate ml-1">
                                {cfg.model}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onCopy(m.id, m.content)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-neutral-700 dark:hover:text-neutral-300"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500 font-medium">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>复制</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div>{m.content}</div>
              {!m.quote && m.scopeLabel && (
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400 flex items-center gap-1 pt-0.5 select-none">
                  <BookOpen className="w-2.5 h-2.5 text-fox-orange" />
                  <span>{m.scopeLabel}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);
ChatMessageBubble.displayName = 'ChatMessageBubble';

export const ChatPanel: React.FC = () => {
  // Fine-grained Zustand subscriptions
  const messages = useAppStore((s) => s.messages);
  const activeQuote = useAppStore((s) => s.activeQuote);
  const docScopeMode = useAppStore((s) => s.docScopeMode);
  const draftQuestion = useAppStore((s) => s.draftQuestion);
  const isPreviewOpen = useAppStore((s) => s.isPreviewOpen);
  const foxEarState = useAppStore((s) => s.foxEarState);
  const activeDocName = useAppStore((s) => s.activeDocument?.name || '当前文档');
  const activeDocContent = useAppStore((s) => s.activeDocument?.content || '');
  const readingProgress = useAppStore((s) => s.readingProgress);
  const contentUpdatedNotice = useAppStore((s) => s.contentUpdatedNotice);
  const focusInputSignal = useAppStore((s) => s.focusInputSignal);
  const providerConfigs = useAppStore((s) => s.providerConfigs);
  const activeConfigId = useAppStore((s) => s.activeConfigId);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);

  const clearMessages = useAppStore((s) => s.clearMessages);
  const setActiveQuote = useAppStore((s) => s.setActiveQuote);
  const setDocScopeMode = useAppStore((s) => s.setDocScopeMode);
  const setDraftQuestion = useAppStore((s) => s.setDraftQuestion);
  const setIsPreviewOpen = useAppStore((s) => s.setIsPreviewOpen);
  const sendQuestion = useAppStore((s) => s.sendQuestion);
  const retryLastMessage = useAppStore((s) => s.retryLastMessage);
  const regenerateAnswer = useAppStore((s) => s.regenerateAnswer);
  const stopGeneration = useAppStore((s) => s.stopGeneration);
  const setIsSettingsOpen = useAppStore((s) => s.setIsSettingsOpen);
  const triggerFocusInput = useAppStore((s) => s.triggerFocusInput);
  const scrollToQuote = useAppStore((s) => s.scrollToQuote);
  const dismissContentUpdatedNotice = useAppStore((s) => s.dismissContentUpdatedNotice);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Secondary selection state for clarifying concepts inside assistant's response
  const [asstSelectionBox, setAsstSelectionBox] = useState<{
    visible: boolean;
    x: number;
    y: number;
    text: string;
  }>({ visible: false, x: 0, y: 0, text: '' });

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  const isGenerating = foxEarState === 'generating' || foxEarState === 'waiting';
  const config = useMemo(
    () => providerConfigs.find((c) => c.id === activeConfigId) || providerConfigs[0],
    [providerConfigs, activeConfigId]
  );
  const budget = config?.contextBudget || 4096;

  // Auto focus input when signal changes
  useEffect(() => {
    if (focusInputSignal > 0) {
      inputRef.current?.focus();
    }
  }, [focusInputSignal]);

  // Respect user's scroll-up position
  const handleChatScroll = useCallback(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldAutoScrollRef.current = distanceFromBottom < 72;
  }, []);

  const lastMessageContent = messages[messages.length - 1]?.content;
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'instant' as ScrollBehavior });
  }, [messages.length, lastMessageContent]);

  // Real-time calculation of current prompt token budget
  const currentBudgetInfo = useMemo(() => {
    return AIService.assemblePromptPreview({
      documentName: activeDocName,
      documentContent: activeDocContent,
      scrollProgress: readingProgress,
      docScopeMode,
      quote: activeQuote,
      userQuestion:
        draftQuestion.trim() ||
        (activeQuote ? '请解释这段内容的核心含义及背景。' : '请总结这篇文档的核心内容。'),
      history: messages,
      budget,
    });
  }, [
    activeDocName,
    activeDocContent,
    readingProgress,
    docScopeMode,
    activeQuote,
    draftQuestion,
    messages,
    budget,
  ]);

  const handleCopy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const handleRetry = useCallback(() => {
    shouldAutoScrollRef.current = true;
    void retryLastMessage();
  }, [retryLastMessage]);

  const handlePrimarySend = () => {
    shouldAutoScrollRef.current = true;
    void sendQuestion();
  };

  // Cycle theme: system -> dark -> light -> system
  const handleCycleTheme = () => {
    if (theme === 'system') setTheme('dark');
    else if (theme === 'dark') setTheme('light');
    else setTheme('system');
  };

  // Secondary selection listener for clarifying terms in AI responses (Recursive Clarification)
  useEffect(() => {
    const handleMouseUp = () => {
      const container = messagesContainerRef.current;
      if (!container) return;

      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        setAsstSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 2) return;

      // Ensure selection is strictly inside an assistant's content block
      const anchorNode = selection.anchorNode;
      if (!anchorNode) return;
      const anchorEl =
        anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as HTMLElement);
      const asstBlock = anchorEl?.closest('.chat-assistant-content');
      if (!asstBlock) return;

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const containerBounds = container.getBoundingClientRect();

      const minX = containerBounds.left + 80;
      const maxX = containerBounds.right - 80;
      const clampedX = Math.min(maxX, Math.max(minX, rect.left + rect.width / 2));

      setAsstSelectionBox({
        visible: true,
        x: clampedX,
        y: Math.max(10, rect.top - 46),
        text,
      });
    };

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.asst-selection-toolbar')) return;
      setAsstSelectionBox((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  // Action: Deeply clarify concept in assistant's response
  const handleClarifyAsstConcept = () => {
    if (!asstSelectionBox.text) return;
    const term = asstSelectionBox.text;
    setAsstSelectionBox({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();

    void sendQuestion(
      `针对上述回答中提到的「${term}」，请做更深入的概念拆解与原理说明，并举具体实例辅助理解。`,
      {
        quoteOverride: {
          id: `asst_quote_${Date.now()}`,
          text: term,
          headingPath: 'AI 回答深度追问',
        },
      }
    );
  };

  const handleAddAsstQuoteToInput = () => {
    if (!asstSelectionBox.text) return;
    const term = asstSelectionBox.text;
    setActiveQuote({
      id: `asst_quote_${Date.now()}`,
      text: term,
      headingPath: 'AI 回答引用',
    });
    setAsstSelectionBox({ visible: false, x: 0, y: 0, text: '' });
    window.getSelection()?.removeAllRanges();
    triggerFocusInput();
  };

  // Export conversation to Markdown note
  const handleExportChat = () => {
    if (messages.length === 0) return;
    const dateStr = new Date().toLocaleString('zh-CN');

    let md = `# Fox 伴读问答笔记 · 《${activeDocName}》\n\n`;
    md += `> 📅 导出时间：${dateStr}  \n`;
    md += `> 🤖 伴读模型：${config?.model || '默认 AI'}  \n\n`;
    md += `---\n\n`;

    messages.forEach((m, idx) => {
      if (m.role === 'user') {
        md += `### 💬 读者提问 #${Math.floor(idx / 2) + 1}\n\n`;
        if (m.quote) {
          md += `> 📍 **参考选区**${m.quote.headingPath ? `（${m.quote.headingPath}）` : ''}：  \n`;
          md += `> ${m.quote.text.replace(/\n/g, '\n> ')}\n\n`;
        }
        md += `${m.content}\n\n`;
      } else if (m.role === 'assistant') {
        md += `### 🦊 Fox 回答\n\n`;
        md += `${m.content}\n\n`;
        md += `---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = activeDocName.replace(/\.md$|\.markdown$/i, '');
    link.download = `Fox问答笔记_${cleanFileName}_${Date.now()}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const canSendNow = Boolean(draftQuestion.trim() || activeQuote);

  return (
    <div className="flex flex-col h-full bg-[#FBFBFA] dark:bg-[#111113] border-r border-neutral-200 dark:border-neutral-800 select-text transition-colors duration-150">
      {/* Top Header */}
      <div
        data-tauri-drag-region
        className={`h-12 border-b border-neutral-200 dark:border-neutral-800 px-4 ${
          isTauriApp() ? 'pl-20' : 'pl-4'
        } flex items-center justify-between bg-white/70 dark:bg-[#111113]/70 backdrop-blur-sm z-10 flex-shrink-0 select-none`}
      >
        <FoxMascot
          earState={foxEarState}
          scrollProgress={readingProgress}
          onClick={triggerFocusInput}
        />

        <div className="flex items-center gap-1.5 select-none">
          {config && (
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              title={`当前模型：${config.name} (${config.model}) · 点击管理配置`}
              className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 max-w-[120px] truncate transition-colors"
            >
              {config.model}
            </button>
          )}

          {/* Theme Quick Toggle */}
          <button
            type="button"
            onClick={handleCycleTheme}
            title={`主题模式：${theme === 'system' ? '跟随系统' : theme === 'dark' ? '深色模式' : '浅色模式'}（点击切换）`}
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-orange-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Monitor className="w-4 h-4" />
            )}
          </button>

          {messages.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleExportChat}
                title="导出问答笔记为 Markdown (.md)"
                className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-fox-darkOrange dark:hover:text-fox-orange hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-md transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={clearMessages}
                title="清空当前会话"
                className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="配置 AI 服务"
            className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Document Version Updated Notice */}
      {contentUpdatedNotice && (
        <div className="mx-3 mt-2.5 px-3 py-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between gap-2 select-none fox-pop-in">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <span>检测到文档内容已更新，上方历史回答可能基于旧版本内容。</span>
          </div>
          <button
            type="button"
            onClick={dismissContentUpdatedNotice}
            className="p-0.5 text-amber-500 hover:text-amber-800 dark:hover:text-amber-200 rounded"
            title="关闭提示"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        onScroll={handleChatScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 select-none text-neutral-400 dark:text-neutral-500 space-y-3">
            <Quote className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
            <p className="text-xs leading-relaxed max-w-[240px]">
              在右侧选中任意段落即可触发多维伴读指令；阅读 AI 回答时划词也能直接二次追问！
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessageBubble
              key={m.id}
              message={m}
              isCopied={copiedId === m.id}
              onCopy={handleCopy}
              onRetry={handleRetry}
              onRegenerate={regenerateAnswer}
              onScrollToQuote={scrollToQuote}
              providerConfigs={providerConfigs}
              activeConfigId={activeConfigId}
            />
          ))
        )}
      </div>

      {/* Secondary Selection Toolbar on Assistant Message (Recursive Clarification) */}
      {asstSelectionBox.visible && (
        <div
          className="asst-selection-toolbar fixed z-50 flex items-center gap-1 bg-[#1F242D] text-white px-2 py-1.5 rounded-xl shadow-2xl border border-neutral-700 -translate-x-1/2 fox-pop-in select-none"
          style={{ left: `${asstSelectionBox.x}px`, top: `${asstSelectionBox.y}px` }}
        >
          <button
            type="button"
            onClick={handleClarifyAsstConcept}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-orange-300 hover:text-orange-200"
            title="对该概念发起深入二次追问"
          >
            <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
            追问此概念
          </button>
          <div className="w-[1px] h-3.5 bg-neutral-600 mx-0.5" />
          <button
            type="button"
            onClick={handleAddAsstQuoteToInput}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium hover:bg-neutral-700/80 rounded-lg transition-colors text-neutral-300 hover:text-white"
            title="作为引用填入提问框"
          >
            <PlusCircle className="w-3.5 h-3.5 text-neutral-400" />
            引用
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#141416] select-none transition-colors duration-150">
        {/* Active Quote preview card above textarea */}
        {activeQuote && (
          <div className="relative mb-2 p-2.5 bg-orange-50/80 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-lg text-xs text-neutral-700 dark:text-neutral-300">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-fox-darkOrange dark:text-fox-orange uppercase">
                <Quote className="w-3 h-3" />
                <span>附带选区上下文</span>
                {activeQuote.headingPath && (
                  <span className="text-neutral-400 dark:text-neutral-500 font-normal truncate max-w-[160px]">
                    · {activeQuote.headingPath}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveQuote(null)}
                title="移除本次引用"
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="line-clamp-2 italic text-neutral-600 dark:text-neutral-400 text-[11px]">
              "{activeQuote.text}"
            </div>
          </div>
        )}

        {/* Real-time Over-Budget Banner Warning */}
        {currentBudgetInfo.isOverBudget && (
          <div className="mb-2 p-2 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-lg text-red-700 dark:text-red-300 text-xs flex items-center justify-between gap-2 fox-pop-in">
            <div className="flex items-center gap-1.5 min-w-0">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-[11px] leading-tight">
                当前范围预估 <strong>{currentBudgetInfo.estimatedTokens}T</strong>，超出预算 (
                {currentBudgetInfo.budget}T)。
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!activeQuote && docScopeMode === 'full_doc' && (
                <button
                  type="button"
                  onClick={() => setDocScopeMode('viewport_section')}
                  className="text-[11px] font-semibold text-fox-darkOrange dark:text-fox-orange underline hover:opacity-80"
                >
                  仅发当前章节
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="text-[11px] font-medium underline hover:text-red-800 dark:hover:text-red-200"
              >
                详情
              </button>
            </div>
          </div>
        )}

        {/* Toolbar bar above input: Scope selector + Budget progress bar + Send Preview trigger */}
        <div className="flex items-center justify-between px-1 mb-1.5 text-[11px] text-neutral-400 dark:text-neutral-500">
          <div className="flex items-center gap-1.5 min-w-0">
            {activeQuote ? (
              <span className="truncate max-w-[160px] text-fox-darkOrange dark:text-fox-orange font-medium">
                范围：选区上下文
              </span>
            ) : (
              <button
                type="button"
                onClick={() =>
                  setDocScopeMode(docScopeMode === 'full_doc' ? 'viewport_section' : 'full_doc')
                }
                title="无选区时点击切换发送范围：完整文档全文 / 当前阅读位置章节"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors truncate max-w-[175px]"
              >
                <BookOpen className="w-3 h-3 text-fox-orange flex-shrink-0" />
                <span className="truncate">
                  {docScopeMode === 'full_doc' ? '范围：文档全文' : '范围：当前章节'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Real-time Budget Indicator */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className={`flex items-center gap-1.5 hover:opacity-80 transition-opacity ${
                currentBudgetInfo.isOverBudget
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
              title={`预算预估: ${currentBudgetInfo.estimatedTokens} / ${currentBudgetInfo.budget} Tokens (${currentBudgetInfo.budgetPercentage}%)`}
            >
              <div className="w-12 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, currentBudgetInfo.budgetPercentage)}%` }}
                  className={`h-full ${
                    currentBudgetInfo.isOverBudget ? 'bg-red-500' : 'bg-fox-orange'
                  }`}
                />
              </div>
              <span className="text-[10px]">{currentBudgetInfo.estimatedTokens}T</span>
            </button>

            {/* Preview trigger */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-1 text-neutral-500 dark:text-neutral-400 hover:text-fox-darkOrange dark:hover:text-fox-orange hover:underline transition-colors"
              title="查看完整发送给 AI 的 Prompt 与预估 Tokens"
            >
              <Eye className="w-3 h-3" />
              <span>发送预览</span>
            </button>
          </div>
        </div>

        <div
          className={`relative flex items-end gap-2 border rounded-xl px-3 py-2 bg-neutral-50/50 dark:bg-neutral-900/60 transition-colors ${
            currentBudgetInfo.isOverBudget
              ? 'border-red-300 dark:border-red-800 focus-within:border-red-500'
              : 'border-neutral-300 dark:border-neutral-700 focus-within:border-fox-orange'
          }`}
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={draftQuestion}
            onChange={(e) => setDraftQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePrimarySend();
              }
            }}
            placeholder={
              activeQuote
                ? '围绕选中的内容提问… (Enter 直接发送)'
                : '围绕当前文档提问… (Enter 发送)'
            }
            className="flex-1 bg-transparent resize-none text-xs text-neutral-800 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none max-h-28 py-0.5"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={stopGeneration}
              title="停止回答"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-white transition-colors flex-shrink-0"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePrimarySend}
              disabled={!canSendNow}
              title={currentBudgetInfo.isOverBudget ? '超出预算，点击查看并调整范围' : '发送'}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                canSendNow
                  ? currentBudgetInfo.isOverBudget
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-fox-orange hover:bg-fox-darkOrange text-white'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt Preview Modal */}
      <PromptPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        previewInfo={currentBudgetInfo}
        canSend={canSendNow && !isGenerating}
        onConfirmSend={() => {
          shouldAutoScrollRef.current = true;
          void sendQuestion(undefined, { forceOverBudget: true });
        }}
        onSwitchToViewportSection={() => {
          setDocScopeMode('viewport_section');
        }}
        onClearHistory={() => {
          clearMessages();
        }}
        onRemoveQuote={() => {
          setActiveQuote(null);
        }}
      />
    </div>
  );
};
