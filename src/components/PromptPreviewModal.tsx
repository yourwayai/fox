import React, { useState } from 'react';
import { X, Eye, Copy, Check, Compass, FileText, Layers } from 'lucide-react';
import { PromptPreviewInfo } from '../services/aiService';

interface PromptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewInfo: PromptPreviewInfo;
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  isOpen,
  onClose,
  previewInfo,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullPromptText = `[System Prompt]:\n${previewInfo.systemPrompt}\n\n[User Context & Question]:\n${previewInfo.assembledUserMessage}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullPromptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800">本次发送内容预览</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-fox-darkOrange border border-orange-200 font-medium">
              ~ {previewInfo.estimatedTokens} Tokens
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
            💡 说明：Fox 仅将上方透明展示的选区切片及所属段落发送给您配置的 AI 服务端点，绝不发送未经您授权的设备数据。
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
