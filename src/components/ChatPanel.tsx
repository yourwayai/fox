import React, { useState, useRef, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { FoxMascot } from './FoxMascot';
import { CodeBlock } from './CodeBlock';
import { PromptPreviewModal } from './PromptPreviewModal';
import { AIService, PromptPreviewInfo } from '../services/aiService';
import { ChatMessage } from '../types';

export const ChatPanel: React.FC = () => {
  const {
    messages,
    addMessage,
    appendStreamChunk,
    setLastMessageStatus,
    clearMessages,
    activeQuote,
    setActiveQuote,
    getActiveConfig,
    foxEarState,
    setFoxEarState,
    activeDocument,
    setIsSettingsOpen,
    focusInputSignal,
    triggerFocusInput,
    scrollToQuote,
  } = useAppStore();

  const [inputVal, setInputVal] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PromptPreviewInfo | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isGenerating = foxEarState === 'generating' || foxEarState === 'waiting';
  const config = getActiveConfig();
  const budget = config?.contextBudget || 4096;

  // Auto focus input when signal changes
  useEffect(() => {
    if (focusInputSignal > 0) {
      inputRef.current?.focus();
    }
  }, [focusInputSignal]);

  // Real-time calculation of current prompt token budget
  const currentBudgetInfo = useMemo(() => {
    return AIService.assemblePromptPreview({
      documentName: activeDocument?.name || '当前文档',
      quote: activeQuote,
      userQuestion: inputVal.trim() || (activeQuote ? '请解释这段内容的核心含义及背景。' : ''),
      history: messages,
      budget,
    });
  }, [activeDocument?.name, activeQuote, inputVal, messages, budget]);

  // Open Prompt Preview
  const handleOpenPreview = () => {
    setPreviewData(currentBudgetInfo);
    setIsPreviewOpen(true);
  };

  // Handle send question with optional over-budget bypass check
  const handleSend = async (customPrompt?: string, forceOverBudget = false) => {
    const prompt = (customPrompt || inputVal).trim();
    if (!prompt && !activeQuote) return;
    if (isGenerating) return;

    if (!config || !config.baseUrl || !config.model) {
      setIsSettingsOpen(true);
      return;
    }

    // Over budget guard
    if (currentBudgetInfo.isOverBudget && !forceOverBudget) {
      handleOpenPreview();
      return;
    }

    const currentQuote = activeQuote;
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: prompt || '请针对引用段落进行解读。',
      createdAt: Date.now(),
      status: 'done',
      quote: currentQuote || undefined,
    };

    const assistantMsg: ChatMessage = {
      id: `msg_asst_${Date.now()}`,
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
      status: 'streaming',
      modelName: config.model,
    };

    addMessage(userMsg);
    addMessage(assistantMsg);
    setInputVal('');
    setActiveQuote(null);
    setFoxEarState('waiting');

    // Trigger AI stream
    await AIService.streamChat({
      config,
      documentName: activeDocument?.name || '当前文档',
      messages: [...messages, userMsg],
      quote: currentQuote || undefined,
      onChunk: (delta) => {
        setFoxEarState('generating');
        appendStreamChunk(delta);
      },
      onFinish: () => {
        setFoxEarState('ready');
        setLastMessageStatus('done');
      },
      onError: (errMsg) => {
        setFoxEarState('error');
        setLastMessageStatus('error', errMsg);
      },
    });
  };

  // Stop generation
  const handleStop = () => {
    AIService.stopGenerating();
    setFoxEarState('ready');
    setLastMessageStatus('done');
  };

  // Copy message
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Retry last message
  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      handleSend(lastUserMsg.content, true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FBFBFA] border-r border-neutral-200 select-text">
      {/* Top Header */}
      <div className="h-12 border-b border-neutral-200 px-4 flex items-center justify-between bg-white/70 backdrop-blur z-10 flex-shrink-0">
        <FoxMascot
          earState={foxEarState}
          scrollProgress={activeDocument?.scrollProgress || 0}
          onClick={triggerFocusInput}
        />

        <div className="flex items-center gap-1.5 select-none">
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              title="清空当前会话"
              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            title="配置 AI 服务"
            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 select-none text-neutral-400 space-y-3">
            <Quote className="w-8 h-8 text-neutral-300" />
            <p className="text-xs leading-relaxed max-w-[240px]">
              在右侧阅读文档时，选中任意文本即可快速解释或发起提问。
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex flex-col space-y-1.5">
              {/* User Quote preview card with reverse locator click */}
              {m.quote && (
                <div
                  onClick={() => m.quote && scrollToQuote(m.quote.text)}
                  className="group/quote text-xs border-l-2 border-fox-orange bg-orange-50/70 hover:bg-orange-100/80 p-2.5 rounded-r-md text-neutral-600 mb-1 cursor-pointer transition-colors shadow-2xs"
                  title="点击右侧平滑定位并高亮原文"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-fox-darkOrange uppercase mb-1">
                    <span className="flex items-center gap-1">
                      <Quote className="w-3 h-3" />
                      选区引用
                      <span className="opacity-0 group-hover/quote:opacity-100 text-[10px] text-fox-darkOrange font-normal flex items-center gap-0.5 ml-1 transition-opacity">
                        <LocateFixed className="w-3 h-3" /> 定位原文
                      </span>
                    </span>
                    {m.quote.headingPath && (
                      <span className="flex items-center gap-1 text-neutral-400 font-normal truncate max-w-[180px]">
                        <Compass className="w-3 h-3 flex-shrink-0" />
                        {m.quote.headingPath}
                      </span>
                    )}
                  </div>
                  <div className="line-clamp-3 text-neutral-700 italic group-hover/quote:text-neutral-900 transition-colors">
                    "{m.quote.text}"
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`relative group rounded-xl p-3 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-neutral-200/70 text-neutral-800 ml-6 self-end'
                    : 'bg-white border border-neutral-200/80 shadow-xs mr-2 self-start'
                }`}
              >
                {/* Assistant response */}
                {m.role === 'assistant' ? (
                  <div>
                    {m.status === 'streaming' && !m.content && (
                      <span className="inline-flex items-center gap-1 text-neutral-400 italic">
                        <span className="w-1.5 h-1.5 rounded-full bg-fox-orange animate-ping" />
                        思考并组织回答中…
                      </span>
                    )}

                    <div className="markdown-body text-xs prose-neutral max-w-none">
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
                        {m.content}
                      </ReactMarkdown>
                    </div>

                    {/* Error state */}
                    {m.status === 'error' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-600 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium">{m.errorMessage || '请求失败'}</p>
                          <button
                            onClick={handleRetry}
                            className="mt-1 flex items-center gap-1 text-[11px] underline hover:text-red-700"
                          >
                            <RotateCcw className="w-3 h-3" />
                            重试
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Footer copy & model tag */}
                    <div className="mt-2 pt-1 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400 select-none">
                      <span>{m.modelName || 'AI'}</span>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:text-neutral-700"
                      >
                        {copiedId === m.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>已复制</span>
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
                  <div>{m.content}</div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-neutral-200 bg-white select-none">
        {/* Active Quote preview card above textarea */}
        {activeQuote && (
          <div className="relative mb-2 p-2.5 bg-orange-50/80 border border-orange-200 rounded-lg text-xs text-neutral-700">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-fox-darkOrange uppercase">
                <Quote className="w-3 h-3" />
                <span>附带选区上下文</span>
                {activeQuote.headingPath && (
                  <span className="text-neutral-400 font-normal truncate max-w-[160px]">
                    · {activeQuote.headingPath}
                  </span>
                )}
              </div>
              <button
                onClick={() => setActiveQuote(null)}
                title="移除本次引用"
                className="p-1 text-neutral-400 hover:text-neutral-700 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="line-clamp-2 italic text-neutral-600 text-[11px]">
              "{activeQuote.text}"
            </div>
          </div>
        )}

        {/* Real-time Over-Budget Banner Warning */}
        {currentBudgetInfo.isOverBudget && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <span className="text-[11px] leading-tight">
                发送内容预估 <strong>{currentBudgetInfo.estimatedTokens} Tokens</strong>，已超出预算上限 ({currentBudgetInfo.budget})。
              </span>
            </div>
            <button
              onClick={handleOpenPreview}
              className="text-[11px] font-medium underline hover:text-red-800 ml-2 flex-shrink-0"
            >
              调整范围
            </button>
          </div>
        )}

        {/* Toolbar bar above input: Document name + Real-time Budget progress bar + Send Preview trigger */}
        <div className="flex items-center justify-between px-1 mb-1.5 text-[11px] text-neutral-400">
          <span className="truncate max-w-[140px]">{activeDocument?.name || '当前文档'}</span>

          <div className="flex items-center gap-3">
            {/* Real-time Budget Indicator */}
            <button
              onClick={handleOpenPreview}
              className={`flex items-center gap-1.5 hover:opacity-80 transition-opacity ${
                currentBudgetInfo.isOverBudget ? 'text-red-600 font-semibold' : 'text-neutral-500'
              }`}
              title={`预算预估: ${currentBudgetInfo.estimatedTokens} / ${currentBudgetInfo.budget} Tokens (${currentBudgetInfo.budgetPercentage}%)`}
            >
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, currentBudgetInfo.budgetPercentage)}%` }}
                  className={`h-full ${currentBudgetInfo.isOverBudget ? 'bg-red-500' : 'bg-fox-orange'}`}
                />
              </div>
              <span className="text-[10px]">
                {currentBudgetInfo.estimatedTokens}T
              </span>
            </button>

            {/* Preview trigger */}
            <button
              onClick={handleOpenPreview}
              className="flex items-center gap-1 text-neutral-500 hover:text-fox-darkOrange hover:underline transition-colors"
              title="查看完整发送给 AI 的 Prompt 与预估 Tokens"
            >
              <Eye className="w-3 h-3" />
              <span>发送预览</span>
            </button>
          </div>
        </div>

        <div className={`relative flex items-end gap-2 border rounded-xl px-3 py-2 bg-neutral-50/50 transition-colors ${
          currentBudgetInfo.isOverBudget
            ? 'border-red-300 focus-within:border-red-500'
            : 'border-neutral-300 focus-within:border-fox-orange'
        }`}>
          <textarea
            ref={inputRef}
            rows={1}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={activeQuote ? '围绕选中的内容提问…' : '向 Fox 提问当前文档… (Enter 发送)'}
            className="flex-1 bg-transparent resize-none text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none max-h-28 py-0.5"
          />

          {isGenerating ? (
            <button
              onClick={handleStop}
              title="停止回答"
              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white transition-colors flex-shrink-0"
            >
              <Square className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => handleSend()}
              disabled={!inputVal.trim() && !activeQuote}
              title={currentBudgetInfo.isOverBudget ? '超出预算，点击查看并调整' : '发送'}
              className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${
                inputVal.trim() || activeQuote
                  ? currentBudgetInfo.isOverBudget
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-fox-orange hover:bg-fox-darkOrange text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Prompt Preview Modal */}
      {previewData && (
        <PromptPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          previewInfo={previewData}
          onClearHistory={() => {
            clearMessages();
            setIsPreviewOpen(false);
          }}
          onRemoveQuote={() => {
            setActiveQuote(null);
            setIsPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
};
