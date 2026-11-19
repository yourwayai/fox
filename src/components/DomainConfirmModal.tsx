import React, { useState } from 'react';
import { ShieldCheck, ExternalLink, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const DomainConfirmModal: React.FC = () => {
  const pending = useAppStore((s) => s.pendingDomainConfirm);
  const setPending = useAppStore((s) => s.setPendingDomainConfirm);
  const confirmDomain = useAppStore((s) => s.confirmDomain);

  const [remember, setRemember] = useState(true);

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs select-none fox-pop-in">
      <div className="bg-white dark:bg-[#1A1A1E] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800/80">
          <div className="flex items-center gap-2 text-fox-darkOrange dark:text-fox-orange font-semibold text-sm">
            <ShieldCheck className="w-5 h-5 text-fox-orange" />
            <span>首次外发服务安全提示</span>
          </div>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-600 dark:text-neutral-300">
          <div className="p-3 bg-orange-50/80 dark:bg-orange-950/30 rounded-xl border border-orange-200/50 dark:border-orange-900/40 space-y-1">
            <div className="text-[11px] font-medium text-fox-darkOrange dark:text-fox-orange">
              目标服务端点域名：
            </div>
            <div className="font-mono text-sm font-semibold text-neutral-800 dark:text-neutral-100 flex items-center gap-1.5">
              <span>{pending.domain}</span>
              <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>

          <p className="leading-relaxed">
            Fox 遵循<strong>“数据直连、零遥测、透明上下文”</strong>
            原则。本次提问将直接从您的设备发送至上述服务端点，内容包含您当前划选的原文或阅读视口段落。
          </p>

          <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
            您的 API Key 与文档内容绝不经过任何第三方服务器中转。请核对目标域名是否符合您的预期。
          </p>

          <label className="flex items-center gap-2 pt-1 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="rounded text-fox-orange focus:ring-fox-orange dark:bg-neutral-800 dark:border-neutral-700"
            />
            <span className="text-xs text-neutral-700 dark:text-neutral-300">
              记住此域名，后续对该域名的提问不再弹窗
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-neutral-50 dark:bg-[#141416] border-t border-neutral-100 dark:border-neutral-800/80">
          <button
            type="button"
            onClick={() => setPending(null)}
            className="px-3.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
          >
            取消本次发送
          </button>
          <button
            type="button"
            onClick={() => confirmDomain(pending.domain, remember)}
            className="px-4 py-1.5 text-xs font-medium text-white bg-fox-orange hover:bg-fox-darkOrange rounded-lg transition-colors shadow-xs"
          >
            确认并发送
          </button>
        </div>
      </div>
    </div>
  );
};
