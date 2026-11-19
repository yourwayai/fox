import React, { useEffect, useState } from 'react';
import { Copy, Check, Code, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface MermaidBlockProps {
  code: string;
}

let mermaidInstance: typeof import('mermaid').default | null = null;
let currentMermaidTheme: string | null = null;

async function getMermaid(isDark: boolean) {
  if (!mermaidInstance) {
    const mod = await import('mermaid');
    mermaidInstance = mod.default;
  }
  const targetTheme = isDark ? 'dark' : 'default';
  if (currentMermaidTheme !== targetTheme) {
    mermaidInstance.initialize({
      startOnLoad: false,
      theme: targetTheme as 'dark' | 'default',
      securityLevel: 'loose',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });
    currentMermaidTheme = targetTheme;
  }
  return mermaidInstance;
}

export const MermaidBlock: React.FC<MermaidBlockProps> = ({ code }) => {
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCode, setShowCode] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Detect theme from DOM
  const theme = useAppStore((s) => s.theme);

  useEffect(() => {
    let isMounted = true;
    const cleanCode = code.trim();
    if (!cleanCode) {
      setSvgHtml('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const isDark =
      document.documentElement.classList.contains('dark') ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
      theme === 'dark';

    getMermaid(isDark)
      .then(async (mermaid) => {
        try {
          const uniqueId = `mermaid_svg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
          const { svg } = await mermaid.render(uniqueId, cleanCode);
          if (isMounted) {
            setSvgHtml(svg);
            setError(null);
            setLoading(false);
          }
        } catch (err: unknown) {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : String(err);
            setError(msg);
            setLoading(false);
          }
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(String(err));
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [code, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700/60 bg-white dark:bg-[#1A1D24] shadow-sm select-none group">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-[#14161B] border-b border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-mono uppercase font-semibold text-fox-darkOrange dark:text-fox-orange">
            MERMAID
          </span>
          {loading && (
            <span className="flex items-center gap-1 text-[10px] text-neutral-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              渲染中
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title={showCode ? '切换到图表渲染' : '查看原始 Mermaid 源码'}
          >
            {showCode ? (
              <>
                <Eye className="w-3.5 h-3.5 text-neutral-500" />
                <span>图表</span>
              </>
            ) : (
              <>
                <Code className="w-3.5 h-3.5 text-neutral-500" />
                <span>源码</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="复制代码"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-500 font-medium">已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>复制</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content Body */}
      {showCode || error ? (
        <div className="select-text">
          {error && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>语法尚未闭合或解析异常，已自动切换为源码显示</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-[13px] font-mono leading-relaxed bg-[#1A1D24] text-neutral-200 !m-0">
            <code>{code}</code>
          </pre>
        </div>
      ) : (
        <div
          ref={(el) => {
            if (el && svgHtml) {
              el.innerHTML = svgHtml;
            }
          }}
          className="p-6 overflow-x-auto flex justify-center items-center min-h-[120px] bg-white dark:bg-[#18181B]"
        />
      )}
    </div>
  );
};
