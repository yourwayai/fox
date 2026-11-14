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

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ inline, className, children }) => {
  const [copied, setCopied] = useState(false);

  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const codeString = String(children || '').replace(/\n$/, '');

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded text-xs font-mono bg-neutral-100 text-fox-darkOrange font-medium">
        {children}
      </code>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Syntax highlighting via Prism
  let highlightedHtml: string | null = null;
  if (language && Prism.languages[language]) {
    try {
      highlightedHtml = Prism.highlight(codeString, Prism.languages[language], language);
    } catch {
      highlightedHtml = null;
    }
  }

  return (
    <div className="relative my-4 rounded-xl overflow-hidden border border-neutral-700/60 bg-[#1A1D24] shadow-md group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#14161B] border-b border-neutral-800 text-[11px] text-neutral-400 select-none">
        <span className="font-mono uppercase font-semibold text-neutral-300">
          {language || 'code'}
        </span>
        <button
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
              className={`language-${language}`}
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </pre>
        ) : (
          <pre className="!bg-transparent !p-0 !m-0 text-neutral-200">
            <code>{codeString}</code>
          </pre>
        )}
      </div>
    </div>
  );
};
