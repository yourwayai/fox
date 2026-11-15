import React, { useState } from 'react';
import { X, Eye, Copy, Check, Compass, FileText, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PromptPreviewInfo } from '../services/aiService';

interface PromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewInfo: PromptPreviewInfo;
  onClearHistory?: () => void;
  onRemoveQuote?: () => void;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  isOpen,
  onClose,
  previewInfo,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800">本次发送内容预览</h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${
                isOver
                  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                  : 'bg-orange-50 text-fox-darkOrange border-orange-200'
              }`}
            >
              ~ {previewInfo.estimatedTokens} / {previewInfo.budget} Tokens
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 select-text">
          {/* Budget Progress Bar */}
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200/80 space-y-2 select-none">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-medium text-neutral-700 flex items-center gap-1.5">
                {isOver ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
                {isOver ? '上下文超出预算' : '预算消耗健康'}
              </span>
              <span className={`font-semibold ${isOver ? 'text-red-600 font-bold' : 'text-neutral-600'}`}>
                {previewInfo.budgetPercentage}% (预估 {previewInfo.estimatedTokens} Tokens)
              </span>
            </div>

            {/* Progress Bar with multi-segment breakdown */}
            <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${Math.min(100, (previewInfo.systemTokens / previewInfo.budget) * 100)}%` }}
                className="bg-blue-400"
                title={`系统指令: ~${previewInfo.systemTokens} Tokens`}
              />
              <div
                style={{ width: `${Math.min(100, (previewInfo.userTokens / previewInfo.budget) * 100)}%` }}
                className="bg-fox-orange"
                title={`当前选区与提问: ~${previewInfo.userTokens} Tokens`}
              />
              <div
                style={{ width: `${Math.min(100, (previewInfo.historyTokens / previewInfo.budget) * 100)}%` }}
                className={isOver ? 'bg-red-500' : 'bg-neutral-400'}
                title={`历史对话: ~${previewInfo.historyTokens} Tokens`}
              />
            </div>

            {/* Legend & fast mitigation actions */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 pt-1">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" /> 指令 ~{previewInfo.systemTokens}
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-fox-orange inline-block" /> 选区 ~{previewInfo.userTokens}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full inline-block ${isOver ? 'bg-red-500' : 'bg-neutral-400'}`} /> 历史 ~{previewInfo.historyTokens}
                </span>
              </div>
            </div>

            {/* Over-budget mitigation buttons */}
            {isOver && (
              <div className="mt-2 pt-2 border-t border-red-200/60 flex items-center justify-between bg-red-50/50 p-2 rounded-lg text-red-700">
                <span className="text-[11px] leading-tight">
                  发送规模已超出限制，建议精简发送范围避免请求被拒或截断：
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {previewInfo.historyCount > 0 && onClearHistory && (
                    <button
                      onClick={onClearHistory}
                      className="px-2 py-1 text-[11px] bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded transition-colors"
                    >
                      清空历史对话
                    </button>
                  )}
                  {onRemoveQuote && (
                    <button
                      onClick={onRemoveQuote}
                      className="px-2 py-1 text-[11px] bg-white border border-red-300 text-red-700 hover:bg-red-100 rounded transition-colors"
                    >
                      移除长选区
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Metadata banner */}
          <div className="flex items-center gap-3 p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/70 text-neutral-600 select-none">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
              <span className="font-medium text-neutral-700 truncate">{previewInfo.documentTitle}</span>
            </div>
            <div className="w-[1px] h-3 bg-neutral-300" />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>历史上下文: {previewInfo.historyCount} 条</span>
            </div>
          </div>

          {/* 1. System Prompt */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 mb-1.5 select-none">
              <Compass className="w-3.5 h-3.5 text-fox-darkOrange" />
              <span>系统伴读指令 (System Directive)</span>
            </div>
            <div className="p-3 bg-neutral-100/70 rounded-xl text-neutral-600 leading-relaxed font-mono text-[11px] border border-neutral-200">
              {previewInfo.systemPrompt}
            </div>
          </div>

          {/* 2. Assembled User Context & Question */}
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-600 mb-1.5 select-none">
              <span>组装的上下文与提问 (Assembled Prompt)</span>
            </div>
            <pre className="p-3.5 bg-[#1F242D] text-neutral-100 rounded-xl leading-relaxed font-mono text-[11px] whitespace-pre-wrap break-words border border-neutral-800">
              {previewInfo.assembledUserMessage}
            </pre>
          </div>

          {/* Privacy statement note */}
          <p className="text-[10px] text-neutral-400 leading-normal select-none">
            💡 说明：Fox 严格贯彻“所见即所发”原则，绝不静默裁剪内容后声称理解全文。如需调整总预算，请至右上角设置面板更改。
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between flex-shrink-0 select-none">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 bg-white border border-neutral-300 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">已复制完整 Payload</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-500" />
                <span>复制完整 Payload</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg transition-colors"
          >
            关闭预览
          </button>
        </div>
      </div>
    </div>
  );
};
