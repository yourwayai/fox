import React, { useState } from 'react';
import {
  X,
  Eye,
  Copy,
  Check,
  Compass,
  FileText,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Send,
  BookOpen,
} from 'lucide-react';
import { PromptPreviewInfo } from '../services/aiService';

interface PromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewInfo: PromptPreviewInfo;
  canSend?: boolean;
  onConfirmSend?: () => void;
  onSwitchToViewportSection?: () => void;
  onClearHistory?: () => void;
  onRemoveQuote?: () => void;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  isOpen,
  onClose,
  previewInfo,
  canSend = false,
  onConfirmSend,
  onSwitchToViewportSection,
  onClearHistory,
  onRemoveQuote,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullPromptText = `[System Prompt]:\n${previewInfo.systemPrompt}\n\n[User Context & Question]:\n${previewInfo.assembledUserMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isOver = previewInfo.isOverBudget;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none p-4">
      <div className="bg-white dark:bg-[#1C1C20] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden fox-pop-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              本次发送内容预览
            </h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                isOver
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900 animate-pulse'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-fox-darkOrange dark:text-fox-orange border-orange-200 dark:border-orange-900/50'
              }`}
            >
              ~ {previewInfo.estimatedTokens} / {previewInfo.budget} Tokens
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 select-text">
          {/* Budget Progress Bar */}
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700 space-y-2 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                {isOver ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                {isOver ? '上下文超出预算' : '预算消耗健康'}
              </span>
              <span
                className={`font-semibold ${
                  isOver
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {previewInfo.budgetPercentage}% (预估 {previewInfo.estimatedTokens} Tokens)
              </span>
            </div>

            {/* Progress Bar with multi-segment breakdown */}
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden flex">
              <div
                style={{
                  width: `${Math.min(100, (previewInfo.systemTokens / previewInfo.budget) * 100)}%`,
                }}
                className="bg-blue-400"
                title={`系统指令: ~${previewInfo.systemTokens} Tokens`}
              />
              <div
                style={{
                  width: `${Math.min(100, (previewInfo.userTokens / previewInfo.budget) * 100)}%`,
                }}
                className="bg-fox-orange"
                title={`当前范围与提问: ~${previewInfo.userTokens} Tokens`}
              />
              <div
                style={{
                  width: `${Math.min(100, (previewInfo.historyTokens / previewInfo.budget) * 100)}%`,
                }}
                className={isOver ? 'bg-red-500' : 'bg-neutral-400 dark:bg-neutral-500'}
                title={`历史对话: ~${previewInfo.historyTokens} Tokens`}
              />
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> 指令 ~
                  {previewInfo.systemTokens}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-fox-orange inline-block" /> 正文/选区 ~
                  {previewInfo.userTokens}
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full inline-block ${
                      isOver ? 'bg-red-500' : 'bg-neutral-400 dark:bg-neutral-500'
                    }`}
                  />{' '}
                  历史 ~{previewInfo.historyTokens}
                </span>
              </div>
            </div>

            {/* Over-budget mitigation buttons */}
            {isOver && (
              <div className="mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/60 flex flex-col gap-2 bg-red-50/60 dark:bg-red-950/40 p-2.5 rounded-lg text-red-700 dark:text-red-300">
                <span className="text-[11px] leading-tight">
                  当前发送规模超出设定的上下文预算，请选择精简方式（Fox 绝不静默截断内容）：
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {previewInfo.scopeMode === 'full_doc' && onSwitchToViewportSection && (
                    <button
                      type="button"
                      onClick={onSwitchToViewportSection}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-fox-orange text-white hover:bg-fox-darkOrange rounded transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      改发当前阅读章节（推荐）
                    </button>
                  )}
                  {previewInfo.historyCount > 0 && onClearHistory && (
                    <button
                      type="button"
                      onClick={onClearHistory}
                      className="px-2.5 py-1 text-[11px] bg-white dark:bg-neutral-800 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                    >
                      清空历史对话
                    </button>
                  )}
                  {previewInfo.scopeMode === 'selection' && onRemoveQuote && (
                    <button
                      type="button"
                      onClick={onRemoveQuote}
                      className="px-2.5 py-1 text-[11px] bg-white dark:bg-neutral-800 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 rounded transition-colors"
                    >
                      移除长选区
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metadata banner with transparent scope badge */}
          <div className="flex flex-wrap items-center gap-2.5 p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 select-none">
            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
              <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="font-medium text-neutral-700 dark:text-neutral-200 truncate">
                {previewInfo.documentTitle}
              </span>
            </div>
            <div className="w-[1px] h-3 bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-1 text-fox-darkOrange dark:text-fox-orange font-medium truncate max-w-[220px]">
              <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{previewInfo.scopeLabel}</span>
            </div>
            <div className="w-[1px] h-3 bg-neutral-300 dark:bg-neutral-700" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>历史: {previewInfo.historyCount} 条</span>
            </div>
          </div>

          {/* 1. System Prompt */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 select-none">
              <Compass className="w-3.5 h-3.5 text-fox-darkOrange dark:text-fox-orange" />
              <span>系统伴读指令 (System Directive)</span>
            </div>
            <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-neutral-600 dark:text-neutral-300 leading-relaxed font-mono text-[11px] whitespace-pre-wrap border border-neutral-200 dark:border-neutral-700">
              {previewInfo.systemPrompt}
            </div>
          </div>

          {/* 2. Assembled User Context & Question */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 select-none">
              <span>组装的上下文与提问 (Assembled Prompt)</span>
            </div>
            <pre className="p-3.5 bg-[#1F242D] dark:bg-[#14161B] text-neutral-100 rounded-xl leading-relaxed font-mono text-[11px] whitespace-pre-wrap break-words border border-neutral-800 dark:border-neutral-700 max-h-64 overflow-y-auto">
              {previewInfo.assembledUserMessage}
            </pre>
          </div>

          {/* Privacy statement note */}
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-normal select-none">
            💡 说明：预览与实际请求共用同一份组装载荷（所见即所发）。若需提高默认上下文预算，可在设置面板调整。
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-[#151518] border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0 select-none">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700 dark:text-emerald-400">已复制完整 Payload</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-500 dark:text-neutral-400" />
                <span>复制完整 Payload</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              关闭
            </button>

            {canSend && onConfirmSend && (
              <button
                type="button"
                onClick={onConfirmSend}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white rounded-lg transition-colors ${
                  isOver
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-fox-orange hover:bg-fox-darkOrange'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isOver ? '接受超限并发送' : '确认发送'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
