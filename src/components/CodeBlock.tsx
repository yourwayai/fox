import React, { useState } from 'react';
import Prism from 'prismjs';

// Import popular language grammars
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-markdown';

import { Copy, Check } from 'lucide-react';
import { MermaidBlock } from './MermaidBlock';

interface BlockCodeViewProps {
  language?: string;
  code: string;
}

export const BlockCodeView: React.FC<BlockCodeViewProps> = ({ language = '', code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  let highlightedHtml: string | null = null;
  const normalizedLang = language.toLowerCase();
  const langAlias: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    md: 'markdown',
    rs: 'rust',
  };
  const resolvedLang = langAlias[normalizedLang] || normalizedLang;

  if (resolvedLang && Prism.languages[resolvedLang]) {
    try {
      highlightedHtml = Prism.highlight(code, Prism.languages[resolvedLang], resolvedLang);
    } catch {
      highlightedHtml = null;
    }
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-neutral-700/60 bg-[#1A1D24] shadow-md group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#14161B] border-b border-neutral-800 text-[11px] text-neutral-400 select-none">
        <span className="font-mono uppercase font-semibold text-neutral-300">
          {language || 'text'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
          title="复制代码"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">已复制</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>复制</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[13px] leading-relaxed font-mono">
        {highlightedHtml ? (
          <pre className="!bg-transparent !p-0 !m-0">
            <code
              className={`language-${resolvedLang}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="!bg-transparent !p-0 !m-0 text-neutral-200">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
};

/**
 * react-markdown v9 `<pre>` renderer:
 * In CommonMark/GFM, all fenced & indented code blocks render as `<pre><code class="language-...">...</code></pre>`.
 * Handling block code at `<pre>` avoids invalid `<pre><div>` DOM nesting and cleanly separates inline `<code>`.
 */
export const MarkdownPre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children }) => {
  if (React.isValidElement<{ className?: string; children?: React.ReactNode }>(children)) {
    const childClassName = children.props.className || '';
    const match = /language-([\w-]+)/.exec(childClassName);
    const language = match ? match[1] : '';
    const rawCode = String(children.props.children ?? '').replace(/\n$/, '');
    if (language.toLowerCase() === 'mermaid') {
      return <MermaidBlock code={rawCode} />;
    }
    return <BlockCodeView language={language} code={rawCode} />;
  }

  const fallbackText = String(children ?? '').replace(/\n$/, '');
  return <BlockCodeView code={fallbackText} />;
};

/**
 * react-markdown v9 inline `<code>` renderer:
 * Since `<pre>` intercepts all block code elements, `<code>` reached directly is guaranteed to be inline code.
 */
export const InlineCode: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children }) => {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 rounded text-[0.88em] font-mono bg-orange-50/90 dark:bg-orange-950/40 border border-orange-200/70 dark:border-orange-800/50 text-fox-darkOrange dark:text-orange-300 font-medium break-words">
      {children}
    </code>
  );
};

const SAFE_EXTERNAL_PROTOCOL = /^(https?:|mailto:)/i;

export function isSafeLinkHref(href?: string): boolean {
  if (!href) return false;
  const trimmed = href.trim();
  if (trimmed.startsWith('#')) return true;
  return SAFE_EXTERNAL_PROTOCOL.test(trimmed);
}
