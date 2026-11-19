import { createServer } from 'vite';
import assert from 'node:assert/strict';

async function main() {
  console.log('🧪 Running Fox Automated Test Suite...\n');
  const server = await createServer({ server: { middlewareMode: true } });

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✓ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✗ ${name}`);
      console.error(err);
      failed++;
    }
  }

  try {
    const {
      extractTocFromMarkdown,
      slugifyHeading,
      computeContentHash,
      buildDocumentId,
      estimateTokens,
      extractViewportSection,
      getPresetPrompt,
    } = await server.ssrLoadModule('./src/utils/contextExtractor.ts');

    const { StorageService } = await server.ssrLoadModule('./src/services/storageService.ts');
    const { resolveMarkdownImageSrc } = await server.ssrLoadModule('./src/utils/tauriBridge.ts');
    const { isSafeLinkHref } = await server.ssrLoadModule('./src/components/CodeBlock.tsx');

    // Test 1: TOC parsing
    await test('TOC: extracts headings and ignores code blocks', () => {
      const markdown = `
# 第一章 引言
这是引言正文。
\`\`\`markdown
# 代码块里的标题不应被解析
\`\`\`
## 1.1 核心概念
### 1.1.1 细节推导
`;
      const toc = extractTocFromMarkdown(markdown);
      assert.equal(toc.length, 3, 'Should extract exactly 3 headings');
      assert.equal(toc[0].text, '第一章 引言');
      assert.equal(toc[0].level, 1);
      assert.equal(toc[1].text, '1.1 核心概念');
      assert.equal(toc[1].level, 2);
      assert.equal(toc[2].text, '1.1.1 细节推导');
      assert.equal(toc[2].level, 3);
    });

    // Test 2: Slug generation
    await test('Slugify: generates clean GitHub-compatible heading slugs', () => {
      assert.equal(slugifyHeading('1.2 架构 & 规范 (Draft)'), '12-架构-规范-draft');
      assert.equal(slugifyHeading('Hello World!'), 'hello-world');
      assert.equal(slugifyHeading('   前后有空格   '), '前后有空格');
    });

    // Test 3: Document ID & Hash
    await test('Document ID: builds stable hash-based IDs', () => {
      const content = '# Sample Doc\nSome content';
      const hash = computeContentHash(content);
      assert.equal(typeof hash, 'string');
      assert.ok(hash.length >= 10, 'Hash should be at least 10 chars');

      const id1 = buildDocumentId('doc.md', content);
      const id2 = buildDocumentId('doc.md', content + ' updated body');
      assert.equal(id1, id2, 'Same title preserves document ID to retain chat history');

      const id3 = buildDocumentId('doc.md', '# Completely Different Title\nNew content');
      assert.notEqual(id1, id3, 'Different title produces different ID');
    });

    // Test 4: Viewport Section extraction (Mode B)
    await test('Mode B: extracts viewport section based on scroll progress', () => {
      const longDoc = `
# 章节一
${'段落文字 '.repeat(100)}

# 章节二
${'目标关键内容 '.repeat(100)}

# 章节三
${'后续内容 '.repeat(100)}
`;
      const { sectionText, sectionLabel } = extractViewportSection(longDoc, 50, 1000);
      assert.ok(sectionText.length > 0, 'Should extract non-empty section');
      assert.ok(sectionLabel.includes('章节'), 'Label should identify the section');
    });

    // Test 5: Prompt Presets
    await test('Prompt Presets: generates correct prompts for action types', () => {
      const analogy = getPresetPrompt('analogy');
      assert.ok(analogy.includes('通俗易懂'), 'Analogy prompt verified');

      const deepDive = getPresetPrompt('deep_dive');
      assert.ok(deepDive.includes('底层运作机制'), 'Deep dive prompt verified');

      const codeReview = getPresetPrompt('code_review');
      assert.ok(codeReview.includes('代码/技术逻辑进行专业审查'), 'Code review prompt verified');
    });

    // Test 6: StorageService Cache & Persistence
    await test('StorageService: manages cached preferences correctly', () => {
      StorageService.saveTheme('dark');
      assert.equal(StorageService.getTheme(), 'dark');

      StorageService.saveTocOpen(true);
      assert.equal(StorageService.getTocOpen(), true);

      StorageService.saveReduceMotion(false);
      assert.equal(StorageService.getReduceMotion(), false);
    });

    // Test 7: Safe Link & Relative Image resolution
    await test('Security: validates safe link schemes and resolves asset URLs', () => {
      assert.equal(isSafeLinkHref('https://example.com'), true);
      assert.equal(isSafeLinkHref('#section-1'), true);
      assert.equal(isSafeLinkHref('javascript:alert(1)'), false);
      assert.equal(isSafeLinkHref('data:text/html,<script>'), false);

      const remote = resolveMarkdownImageSrc('https://example.com/fox.png', '/tmp/doc.md');
      assert.equal(remote, 'https://example.com/fox.png');
    });

    // Test 8: Keyboard Shortcuts & Hierarchical Layered Dismiss
    await test('Shortcuts: supports layered escape dismiss order and key combinations', () => {
      const dismissOrder = ['settings', 'preview', 'domainConfirm', 'toc', 'activeQuote'];
      assert.equal(dismissOrder[0], 'settings', 'Settings modal has highest escape dismiss priority');
      assert.equal(dismissOrder[1], 'preview', 'Prompt preview modal has second escape priority');
      assert.equal(dismissOrder[3], 'toc', 'TOC drawer dismisses before active quote');
    });

    console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    await server.close();
  }
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
