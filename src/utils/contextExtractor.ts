import { SelectionContext } from '../types';

/**
 * Conservative token estimator based on project specification:
 * - Chinese characters: ~1.2 - 1.5 chars per token
 * - English / code words: ~4 chars per token
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Count CJK characters
  const cjkMatches = text.match(/[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]/g);
  const cjkCount = cjkMatches ? cjkMatches.length : 0;
  const nonCjkLength = text.length - cjkCount;

  const cjkTokens = Math.ceil(cjkCount * 0.75);
  const nonCjkTokens = Math.ceil(nonCjkLength / 3.8);

  return cjkTokens + nonCjkTokens;
}

/**
 * Extracts heading hierarchy and surrounding context from the browser DOM selection
 */
export function extractSelectionContext(): SelectionContext | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.toString().trim()) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (selectedText.length < 2) return null;

  let anchorNode: Node | null = selection.anchorNode;
  if (anchorNode && anchorNode.nodeType === Node.TEXT_NODE) {
    anchorNode = anchorNode.parentElement;
  }

  const targetElement = anchorNode as HTMLElement | null;
  if (!targetElement) {
    return {
      id: `quote_${Date.now()}`,
      text: selectedText,
    };
  }

  // 1. Find nearest heading hierarchy
  const headings: string[] = [];
  const container = targetElement.closest('.markdown-body');
  if (container) {
    const allElements = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote'));
    const currentIndex = allElements.indexOf(targetElement.closest('h1, h2, h3, h4, h5, h6, p, ul, ol, pre, blockquote') || targetElement);

    if (currentIndex >= 0) {
      // Trace backwards to find active headings
      const headingLevels: { [key: number]: string } = {};
      for (let i = 0; i <= currentIndex; i++) {
        const el = allElements[i];
        const match = /^H([1-6])$/i.exec(el.tagName);
        if (match) {
          const level = parseInt(match[1], 10);
          headingLevels[level] = el.textContent?.trim() || '';
          // Remove deeper levels
          for (let l = level + 1; l <= 6; l++) {
            delete headingLevels[l];
          }
        }
      }

      // Collect breadcrumb
      for (let l = 1; l <= 6; l++) {
        if (headingLevels[l]) {
          headings.push(headingLevels[l]);
        }
      }
    }
  }

  // 2. Find surrounding paragraph text
  let surroundingContext = '';
  const currentBlock = targetElement.closest('p, pre, blockquote, li');
  if (currentBlock) {
    const prevBlock = currentBlock.previousElementSibling;
    const nextBlock = currentBlock.nextElementSibling;

    const parts: string[] = [];
    if (prevBlock && prevBlock.textContent) {
      parts.push(`【前文】${prevBlock.textContent.trim().slice(-120)}`);
    }
    if (currentBlock.textContent) {
      parts.push(`【所在段落】${currentBlock.textContent.trim()}`);
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
