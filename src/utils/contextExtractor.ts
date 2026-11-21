import { SelectionContext, TocItem, PromptActionType, PromptAction } from '../types';

/**
 * Conservative token estimator based on project specification:
 * - Chinese characters: ~1.2 - 1.5 chars per token
 * - English / code words: ~3.8 chars per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonCjkLength = text.length - cjkCount;

  const cjkTokens = Math.ceil(cjkCount * 0.75);
  const nonCjkTokens = Math.ceil(nonCjkLength / 3.8);

  return cjkTokens + nonCjkTokens;
}

/**
 * Fast, deterministic 53-bit hash (cyrb53) formatted as hex string.
 * Used for document content change detection and collision-free document IDs.
 */
export function computeContentHash(content: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < content.length; i++) {
    const ch = content.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return combined.toString(16).padStart(13, '0');
}

/**
 * Builds a stable document identifier:
 * - Combines filename + top-level H1 heading hash so two different projects' `README.md`
 *   never overwrite each other, while editing the body of the *same* document preserves its ID
 *   and allows detecting version updates via `contentHash`.
 * - Falls back to contentHash when the document has no top-level heading.
 */
export function buildDocumentId(fileName: string, content: string): string {
  const cleanName = fileName.trim().replace(/\s+/g, '_');
  const h1Match = content.match(/^#\s+(.+)$/m);
  const identitySeed = h1Match
    ? `${cleanName}::${h1Match[1].trim()}`
    : `${cleanName}::${computeContentHash(content).slice(0, 8)}`;
  return `doc_${cleanName}_${computeContentHash(identitySeed).slice(0, 8)}`;
}

/**
 * Generates GitHub-compatible heading anchor IDs for in-document `#anchor` navigation.
 */
export function slugifyHeading(rawText: string): string {
  return rawText
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extracts a hierarchical table of contents (TOC) from Markdown text.
 * Safely ignores headings that appear inside fenced code blocks.
 */
export function extractTocFromMarkdown(content: string): TocItem[] {
  if (!content) return [];
  const lines = content.split('\n');
  const items: TocItem[] = [];
  let inCodeBlock = false;
  const slugCounts = new Map<string, number>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = /^(#{1,6})\s+(.+)$/.exec(trimmed);
    if (match) {
      const level = match[1].length;
      let rawText = match[2].trim();
      rawText = rawText
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

      let slug = slugifyHeading(rawText);
      if (!slug) slug = `heading-${items.length + 1}`;

      const count = slugCounts.get(slug) || 0;
      slugCounts.set(slug, count + 1);
      const uniqueId = count === 0 ? slug : `${slug}-${count}`;

      items.push({
        id: uniqueId,
        text: rawText,
        level,
      });
    }
  }
  return items;
}

/**
 * Built-in default prompt templates for one-click reading actions.
 */
export const DEFAULT_PROMPT_ACTIONS: PromptAction[] = [
  {
    id: 'explain',
    label: '解释',
    prompt: '请解释这段内容的核心含义及背景。',
    icon: 'Sparkles',
    builtin: true,
    enabled: true,
  },
  {
    id: 'analogy',
    label: '类比',
    prompt: '请用生动形象、通俗易懂的生活常识或比喻（类比），向初学者解释选中的内容，帮助直观理解其本质。',
    icon: 'Lightbulb',
    builtin: true,
    enabled: true,
  },
  {
    id: 'deep_dive',
    label: '推导',
    prompt: '请对选中的内容进行深度推导与技术解构，分析其底层运作机制、设计权衡（Trade-offs）与边界考量。',
    icon: 'Cpu',
    builtin: true,
    enabled: true,
  },
  {
    id: 'code_review',
    label: '审查',
    prompt: '请对选中的代码/技术逻辑进行专业审查（Code Review），分析时间与空间复杂度、潜在边界缺陷并给出优雅的重构优化方案。',
    icon: 'Code2',
    builtin: true,
    enabled: true,
  },
];

/**
 * Pre-configured prompt templates for one-click reading actions.
 * Supports both built-in action IDs and user-defined custom prompt presets.
 */
export function getPresetPrompt(action: PromptActionType, customActions: PromptAction[] = []): string {
  // Check custom actions first
  const foundCustom = customActions.find((a) => a.id === action);
  if (foundCustom && foundCustom.prompt) {
    return foundCustom.prompt;
  }

  // Check built-in actions
  const foundBuiltin = DEFAULT_PROMPT_ACTIONS.find((a) => a.id === action);
  if (foundBuiltin && foundBuiltin.prompt) {
    return foundBuiltin.prompt;
  }

  // If direct prompt text passed
  if (action && action.length > 20 && (action.includes(' ') || action.includes('请') || action.includes('的'))) {
    return action;
  }

  return '请解释这段内容的核心含义及背景。';
}

/**
 * Extracts a budget-friendly local section around the user's current scroll progress
 * for Mode B fallback when full document exceeds token budget.
 */
export function extractViewportSection(
  content: string,
  scrollProgress: number,
  maxTokensBudget: number
): { sectionText: string; sectionLabel: string } {
  if (!content) {
    return { sectionText: '', sectionLabel: '空文档' };
  }

  const ratio = Math.min(1, Math.max(0, (scrollProgress || 0) / 100));
  const targetCharIndex = Math.floor(content.length * ratio);

  // Split markdown into logical heading sections
  const lines = content.split('\n');
  interface Section {
    heading: string;
    startChar: number;
    endChar: number;
    text: string;
  }

  const sections: Section[] = [];
  let currentHeading = '文档开头';
  let currentLines: string[] = [];
  let sectionStart = 0;
  let runningChar = 0;

  for (const line of lines) {
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(line);
    if (headingMatch && currentLines.length > 0) {
      const sectionBody = currentLines.join('\n');
      sections.push({
        heading: currentHeading,
        startChar: sectionStart,
        endChar: runningChar,
        text: sectionBody,
      });
      currentHeading = headingMatch[2].trim();
      currentLines = [line];
      sectionStart = runningChar;
    } else {
      if (headingMatch && currentLines.length === 0) {
        currentHeading = headingMatch[2].trim();
      }
      currentLines.push(line);
    }
    runningChar += line.length + 1;
  }

  if (currentLines.length > 0) {
    sections.push({
      heading: currentHeading,
      startChar: sectionStart,
      endChar: runningChar,
      text: currentLines.join('\n'),
    });
  }

  // Locate active section around scroll position
  let activeIdx = sections.findIndex(
    (s) => targetCharIndex >= s.startChar && targetCharIndex <= s.endChar
  );
  if (activeIdx < 0) activeIdx = 0;

  const safeMaxChars = Math.max(800, Math.floor(maxTokensBudget * 1.4));
  let resultText = sections[activeIdx].text;
  let label = `章节「${sections[activeIdx].heading}」（阅读位置 ~${Math.round(scrollProgress)}%）`;

  // Expand to adjacent sections if well within budget
  if (resultText.length < safeMaxChars * 0.5 && activeIdx + 1 < sections.length) {
    const combined = `${resultText}\n\n${sections[activeIdx + 1].text}`;
    if (combined.length <= safeMaxChars) {
      resultText = combined;
      label = `章节「${sections[activeIdx].heading} ~ ${sections[activeIdx + 1].heading}」`;
    }
  }

  if (resultText.length > safeMaxChars) {
    resultText = resultText.slice(0, safeMaxChars) + '\n…（当前章节超出预算部分已省略）';
  }

  // Prepend document outline skeleton so AI still understands macro structure
  const outline = lines
    .filter((l) => /^#{1,3}\s+/.test(l))
    .slice(0, 25)
    .join('\n');

  const finalSection = outline
    ? `【文档目录大纲骨架】:\n${outline}\n\n【当前阅读局部章节正文】:\n${resultText}`
    : resultText;

  return {
    sectionText: finalSection,
    sectionLabel: label,
  };
}

/**
 * Extracts heading hierarchy and surrounding context from browser DOM selection.
 * Strictly requires the selection to reside inside `allowedContainer` (when provided)
 * so selecting text in ChatPanel or modals never triggers the reader toolbar.
 */
export function extractSelectionContext(allowedContainer?: HTMLElement | null): SelectionContext | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length < 2) return null;

  const anchorNode = selection.anchorNode;
  const focusNode = selection.focusNode;
  if (!anchorNode || !focusNode) return null;

  if (allowedContainer) {
    if (!allowedContainer.contains(anchorNode) || !allowedContainer.contains(focusNode)) {
      return null;
    }
  }

  const anchorEl =
    anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as HTMLElement);
  if (!anchorEl) return null;

  const container = allowedContainer || (anchorEl.closest('.markdown-body') as HTMLElement | null);
  if (!container) return null;

  // 1. Find nearest heading hierarchy
  const headings: string[] = [];
  const allElements = Array.from(
    container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote, table')
  );
  const closestBlock =
    anchorEl.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote, table') || anchorEl;
  const currentIndex = allElements.indexOf(closestBlock);

  if (currentIndex >= 0) {
    const headingLevels: { [key: number]: string } = {};
    for (let i = 0; i <= currentIndex; i++) {
      const el = allElements[i];
      const match = /^H([1-6])$/i.exec(el.tagName);
      if (match) {
        const level = parseInt(match[1], 10);
        headingLevels[level] = el.textContent?.trim() || '';
        for (let l = level + 1; l <= 6; l++) {
          delete headingLevels[l];
        }
      }
    }

    for (let l = 1; l <= 6; l++) {
      if (headingLevels[l]) {
        headings.push(headingLevels[l]);
      }
    }
  }

  // 2. Find surrounding paragraph text
  let surroundingContext = '';
  const currentBlock = anchorEl.closest('p, pre, blockquote, li, tr');
  if (currentBlock) {
    const prevBlock = currentBlock.previousElementSibling;
    const nextBlock = currentBlock.nextElementSibling;

    const parts: string[] = [];
    if (prevBlock && prevBlock.textContent) {
      parts.push(`【前文】${prevBlock.textContent.trim().slice(-120)}`);
    }
    if (currentBlock.textContent) {
      parts.push(`【所在段落】${currentBlock.textContent.trim().slice(0, 600)}`);
    }
    if (nextBlock && nextBlock.textContent) {
      parts.push(`【后文】${nextBlock.textContent.trim().slice(0, 120)}`);
    }
    surroundingContext = parts.join('\n');
  }

  return {
    id: `quote_${Date.now()}`,
    text: selectedText,
    headingPath: headings.length > 0 ? headings.join(' > ') : undefined,
    surroundingContext: surroundingContext || undefined,
  };
}
