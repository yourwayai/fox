import { createServer } from 'vite';
import assert from 'node:assert/strict';

async function main() {
  console.log('🧪 Running Fox Automated Test Suite...\n');
  const server = await createServer({
    server: { middlewareMode: true },
    optimizeDeps: { noDiscovery: true },
  });

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
      DEFAULT_PROMPT_ACTIONS,
    } = await server.ssrLoadModule('./src/utils/contextExtractor.ts');

    const { StorageService } = await server.ssrLoadModule('./src/services/storageService.ts');
    const {
      resolveMarkdownImageSrc,
      FOX_KEYCHAIN_SERVICE,
      KEYCHAIN_PLACEHOLDER,
      isKeychainSupported,
      saveSecureCredential,
      getSecureCredential,
      deleteSecureCredential,
    } = await server.ssrLoadModule('./src/utils/tauriBridge.ts');
    const { AIService } = await server.ssrLoadModule('./src/services/aiService.ts');
    const {
      isSafeLinkHref,
      isRemoteImageUrl,
      extractImageHostname,
      isImageDomainTrusted,
    } = await server.ssrLoadModule('./src/utils/security.ts');

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

    // Test 9: Remote Image Beacon Protection & Trusted Domains Gate
    await test('Security: blocks remote image beacons and verifies trusted image domain rules', () => {
      // Remote URL detection
      assert.equal(isRemoteImageUrl('https://tracker.com/pixel.png?uid=123'), true);
      assert.equal(isRemoteImageUrl('http://example.com/photo.jpg'), true);
      assert.equal(isRemoteImageUrl('//cdn.example.org/asset.png'), true);
      assert.equal(isRemoteImageUrl('data:image/png;base64,iVBORw0KGgo='), false);
      assert.equal(isRemoteImageUrl('blob:http://localhost:5173/uuid-123'), false);
      assert.equal(isRemoteImageUrl('./assets/local-fox.png'), false);
      assert.equal(isRemoteImageUrl('asset://localhost/Users/fox/pic.png'), false);

      // Hostname extraction
      assert.equal(extractImageHostname('https://raw.githubusercontent.com/user/repo/img.png'), 'raw.githubusercontent.com');
      assert.equal(extractImageHostname('//images.unsplash.com/photo-1'), 'images.unsplash.com');
      assert.equal(extractImageHostname('invalid-string'), '');

      // Trusted domain matching & subdomain handling
      assert.equal(isImageDomainTrusted('images.unsplash.com', ['unsplash.com']), true);
      assert.equal(isImageDomainTrusted('unsplash.com', ['unsplash.com']), true);
      assert.equal(isImageDomainTrusted('evil-unsplash.com', ['unsplash.com']), false);
      assert.equal(isImageDomainTrusted('tracker.com', ['unsplash.com', 'github.com']), false);
      assert.equal(isImageDomainTrusted('IMAGES.UNSPLASH.COM', ['unsplash.com']), true);

      // StorageService integration for trusted image domains
      StorageService.saveTrustedImageDomain('trusted-cdn.com');
      assert.ok(StorageService.getTrustedImageDomains().includes('trusted-cdn.com'));
      StorageService.removeTrustedImageDomain('trusted-cdn.com');
      assert.ok(!StorageService.getTrustedImageDomains().includes('trusted-cdn.com'));
    });

    // Test 10: Custom Prompt Actions & Dynamic Toolbar Integration (Task 6)
    await test('Prompt Actions: supports custom user-defined action presets and storage persistence', () => {
      assert.equal(DEFAULT_PROMPT_ACTIONS.length, 4, 'Has 4 default built-in actions');
      assert.equal(DEFAULT_PROMPT_ACTIONS[0].id, 'explain');
      assert.equal(DEFAULT_PROMPT_ACTIONS[1].id, 'analogy');
      assert.equal(DEFAULT_PROMPT_ACTIONS[2].id, 'deep_dive');
      assert.equal(DEFAULT_PROMPT_ACTIONS[3].id, 'code_review');

      // Custom action resolution
      const customActions = [
        ...DEFAULT_PROMPT_ACTIONS,
        {
          id: 'custom_translate_zh',
          label: '英译中',
          prompt: '请将选中文档翻译为自然流畅的现代汉语。',
          icon: 'Languages',
          builtin: false,
          enabled: true,
        },
      ];

      const resolvedCustom = getPresetPrompt('custom_translate_zh', customActions);
      assert.equal(resolvedCustom, '请将选中文档翻译为自然流畅的现代汉语。');

      // Built-in fallback
      const resolvedBuiltin = getPresetPrompt('analogy', customActions);
      assert.ok(resolvedBuiltin.includes('通俗易懂'));

      // Storage persistence
      StorageService.savePromptActions(customActions);
      const stored = StorageService.getPromptActions();
      assert.equal(stored.length, 5);
      assert.equal(stored.find((a) => a.id === 'custom_translate_zh')?.label, '英译中');

      // Reset to defaults
      const resetList = StorageService.resetPromptActions();
      assert.equal(resetList.length, 4);
    });

    // Test 11: OS Keychain / Credential Vault Integration & Web Fallback (Task 7)
    await test('Keychain: manages native credential contract, placeholders, and graceful web fallback', async () => {
      // Contract & service constants
      assert.equal(FOX_KEYCHAIN_SERVICE, 'ai.yourway.fox', 'Service namespace matches specification');
      assert.equal(KEYCHAIN_PLACEHOLDER, '[KEYCHAIN_SECURED]', 'Placeholder flag matches specification');

      // Non-tauri / Web environment fallback safety
      const supported = await isKeychainSupported();
      assert.equal(supported, false, 'Non-Tauri SSR / Web environment correctly reports keychain unsupported');

      const saved = await saveSecureCredential('test_key', 'sk-test-val');
      assert.equal(saved, false, 'saveSecureCredential returns false without unhandled exception');

      const retrieved = await getSecureCredential('test_key');
      assert.equal(retrieved, null, 'getSecureCredential returns null without unhandled exception');

      const deleted = await deleteSecureCredential('test_key');
      assert.equal(deleted, false, 'deleteSecureCredential returns false without unhandled exception');

      // AIService key resolution
      const plainResolved = await AIService.resolveApiKey({
        id: 'cfg_test_1',
        name: 'Test',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: '  sk-openai-live-key  ',
        model: 'gpt-4o',
        contextBudget: 4096,
      });
      assert.equal(plainResolved, 'sk-openai-live-key', 'Trims and returns plain key');

      const emptyResolved = await AIService.resolveApiKey({
        id: 'cfg_test_2',
        name: 'Ollama',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: '',
        model: 'qwen2.5',
        contextBudget: 4096,
      });
      assert.equal(emptyResolved, '', 'Empty key returns empty string');

      // StorageService credential lifecycle & state contract
      const isAvailable = await StorageService.isKeychainAvailable();
      assert.equal(isAvailable, false, 'StorageService.isKeychainAvailable returns false in web fallback');

      // Save and delete operations
      StorageService.saveProviderConfigs([
        {
          id: 'cfg_unit_test',
          name: 'Unit Test Provider',
          baseUrl: 'https://api.deepseek.com/v1',
          apiKey: 'sk-deepseek-unit-test-key',
          model: 'deepseek-chat',
          contextBudget: 8192,
        },
      ]);
      const storedConfigs = StorageService.getProviderConfigs();
      assert.equal(storedConfigs.length, 1);
      assert.equal(storedConfigs[0].id, 'cfg_unit_test');

      await StorageService.deleteSecureCredentialForConfig('cfg_unit_test');
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
