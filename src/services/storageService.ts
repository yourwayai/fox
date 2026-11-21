import { ProviderConfig, ChatMessage, RecentDocumentMeta, ThemeMode, PromptAction } from '../types';
import { DEFAULT_PROMPT_ACTIONS } from '../utils/contextExtractor';
import { IStorageAdapter } from './storage/types';
import { LocalStorageAdapter } from './storage/localStorageAdapter';
import { IndexedDBAdapter } from './storage/indexedDBAdapter';

const localFallback = new LocalStorageAdapter();
const idbAdapter = new IndexedDBAdapter();

let currentAdapter: IStorageAdapter = idbAdapter;

// Synchronous memory cache populated immediately from localStorage
class MemoryCache {
  theme: ThemeMode = 'system';
  tocOpen: boolean = false;
  reduceMotion: boolean = false;
  activeConfigId: string | null = null;
  providerConfigs: ProviderConfig[] = [];
  recentDocs: RecentDocumentMeta[] = [];
  confirmedDomains: string[] = [];
  trustedImageDomains: string[] = [];
  promptActions: PromptAction[] = [...DEFAULT_PROMPT_ACTIONS];
  docContents: Map<string, string> = new Map();
  docHashes: Map<string, string> = new Map();
  chatMessages: Map<string, ChatMessage[]> = new Map();
  readingPositions: Map<string, { progress: number; scrollTop: number }> = new Map();

  constructor() {
    this.hydrateFromLocalStorage();
  }

  hydrateFromLocalStorage() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const t = localStorage.getItem('fox_theme');
      if (t === 'light' || t === 'dark' || t === 'system') this.theme = t;

      this.tocOpen = localStorage.getItem('fox_toc_open') === 'true';

      const rm = localStorage.getItem('fox_reduce_motion');
      if (rm !== null) {
        this.reduceMotion = rm === 'true';
      } else {
        this.reduceMotion = Boolean(
          window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
        );
      }

      this.activeConfigId = localStorage.getItem('fox_active_config_id');

      const configs = localStorage.getItem('fox_provider_configs');
      if (configs) this.providerConfigs = JSON.parse(configs);

      const docs = localStorage.getItem('fox_recent_docs');
      if (docs) this.recentDocs = JSON.parse(docs);

      const domains = localStorage.getItem('fox_confirmed_domains');
      if (domains) this.confirmedDomains = JSON.parse(domains);

      const imageDomains = localStorage.getItem('fox_trusted_image_domains');
      if (imageDomains) this.trustedImageDomains = JSON.parse(imageDomains);

      const savedActions = localStorage.getItem('fox_prompt_actions');
      if (savedActions) {
        this.promptActions = JSON.parse(savedActions);
      } else {
        this.promptActions = [...DEFAULT_PROMPT_ACTIONS];
      }
    } catch (e) {
      console.warn('[StorageService] Error during initial sync hydration:', e);
    }
  }
}

const memory = new MemoryCache();

// Initialize async storage in background and hydrate IndexedDB
let isInitialized = false;
const initPromise = (async () => {
  try {
    await idbAdapter.init();
    currentAdapter = idbAdapter;

    // Background sync: If IndexedDB is empty but localStorage has data, migrate it!
    const idbConfigs = await idbAdapter.getProviderConfigs();
    if (idbConfigs.length === 0 && memory.providerConfigs.length > 0) {
      await idbAdapter.saveProviderConfigs(memory.providerConfigs);
    }
    const idbDocs = await idbAdapter.getRecentDocs();
    if (idbDocs.length === 0 && memory.recentDocs.length > 0) {
      for (const doc of memory.recentDocs) {
        const content = localStorage.getItem(`fox_doc_content_${doc.id}`) || undefined;
        await idbAdapter.saveRecentDoc(doc, content);
      }
    }
    isInitialized = true;
  } catch (err) {
    console.warn('[StorageService] Falling back to LocalStorageAdapter:', err);
    currentAdapter = localFallback;
  }
})();

export class StorageService {
  public static isReady(): boolean {
    return isInitialized;
  }

  public static async waitForInit(): Promise<void> {
    await initPromise;
  }

  public static getTheme(): ThemeMode {
    return memory.theme;
  }

  public static saveTheme(theme: ThemeMode): void {
    memory.theme = theme;
    localFallback.saveTheme(theme);
    currentAdapter.saveTheme(theme).catch(() => {});
  }

  public static getTocOpen(): boolean {
    return memory.tocOpen;
  }

  public static saveTocOpen(open: boolean): void {
    memory.tocOpen = open;
    localFallback.saveTocOpen(open);
    currentAdapter.saveTocOpen(open).catch(() => {});
  }

  public static getReduceMotion(): boolean {
    return memory.reduceMotion;
  }

  public static saveReduceMotion(reduce: boolean): void {
    memory.reduceMotion = reduce;
    localFallback.saveReduceMotion(reduce);
    currentAdapter.saveReduceMotion(reduce).catch(() => {});
  }

  public static getProviderConfigs(): ProviderConfig[] {
    return memory.providerConfigs;
  }

  public static saveProviderConfigs(configs: ProviderConfig[]): void {
    memory.providerConfigs = configs;
    localFallback.saveProviderConfigs(configs);
    currentAdapter.saveProviderConfigs(configs).catch(() => {});
  }

  public static getActiveConfigId(): string | null {
    return memory.activeConfigId;
  }

  public static setActiveConfigId(id: string): void {
    memory.activeConfigId = id;
    localFallback.saveActiveConfigId(id);
    currentAdapter.saveActiveConfigId(id).catch(() => {});
  }

  public static getConfirmedDomains(): string[] {
    return memory.confirmedDomains;
  }

  public static saveConfirmedDomain(domain: string): void {
    if (!memory.confirmedDomains.includes(domain)) {
      memory.confirmedDomains.push(domain);
      try {
        localStorage.setItem('fox_confirmed_domains', JSON.stringify(memory.confirmedDomains));
      } catch {}
    }
  }

  public static getTrustedImageDomains(): string[] {
    return memory.trustedImageDomains;
  }

  public static saveTrustedImageDomain(domain: string): void {
    const clean = domain.toLowerCase().trim();
    if (clean && !memory.trustedImageDomains.includes(clean)) {
      memory.trustedImageDomains.push(clean);
      try {
        localStorage.setItem('fox_trusted_image_domains', JSON.stringify(memory.trustedImageDomains));
      } catch {}
    }
  }

  public static removeTrustedImageDomain(domain: string): void {
    const clean = domain.toLowerCase().trim();
    memory.trustedImageDomains = memory.trustedImageDomains.filter((d) => d !== clean);
    try {
      localStorage.setItem('fox_trusted_image_domains', JSON.stringify(memory.trustedImageDomains));
    } catch {}
  }

  public static clearTrustedImageDomains(): void {
    memory.trustedImageDomains = [];
    try {
      localStorage.removeItem('fox_trusted_image_domains');
    } catch {}
  }

  public static getPromptActions(): PromptAction[] {
    return memory.promptActions;
  }

  public static savePromptActions(actions: PromptAction[]): void {
    memory.promptActions = actions;
    try {
      localStorage.setItem('fox_prompt_actions', JSON.stringify(actions));
    } catch {}
  }

  public static resetPromptActions(): PromptAction[] {
    memory.promptActions = [...DEFAULT_PROMPT_ACTIONS];
    try {
      localStorage.removeItem('fox_prompt_actions');
    } catch {}
    return memory.promptActions;
  }

  public static getMessages(documentId: string): ChatMessage[] {
    const cached = memory.chatMessages.get(documentId);
    if (cached) return cached;
    try {
      const data = localStorage.getItem(`fox_chat_messages_${documentId}`);
      if (data) {
        const parsed = JSON.parse(data);
        memory.chatMessages.set(documentId, parsed);
        return parsed;
      }
    } catch {}
    return [];
  }

  public static saveMessages(documentId: string, messages: ChatMessage[]): void {
    memory.chatMessages.set(documentId, messages);
    localFallback.saveMessages(documentId, messages);
    currentAdapter.saveMessages(documentId, messages).catch(() => {});
  }

  public static getReadingProgress(documentId: string): number {
    const pos = memory.readingPositions.get(documentId);
    if (pos) return pos.progress;
    try {
      const val = localStorage.getItem(`fox_reading_progress_${documentId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static getReadingScrollTop(documentId: string): number {
    const pos = memory.readingPositions.get(documentId);
    if (pos) return pos.scrollTop;
    try {
      const val = localStorage.getItem(`fox_reading_scroll_top_${documentId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static saveReadingPosition(documentId: string, progress: number, scrollTop: number): void {
    memory.readingPositions.set(documentId, { progress, scrollTop });
    localFallback.saveReadingPosition(documentId, progress, scrollTop);
    currentAdapter.saveReadingPosition(documentId, progress, scrollTop).catch(() => {});
  }

  public static getDocHash(documentId: string): string | null {
    if (memory.docHashes.has(documentId)) {
      return memory.docHashes.get(documentId)!;
    }
    try {
      const hash = localStorage.getItem(`fox_doc_hash_${documentId}`);
      if (hash) {
        memory.docHashes.set(documentId, hash);
        return hash;
      }
    } catch {}
    return null;
  }

  public static saveDocHash(documentId: string, hash: string): void {
    memory.docHashes.set(documentId, hash);
    localFallback.saveDocHash(documentId, hash);
    currentAdapter.saveDocHash(documentId, hash).catch(() => {});
  }

  public static getRecentDocs(): RecentDocumentMeta[] {
    return memory.recentDocs;
  }

  public static saveRecentDoc(meta: RecentDocumentMeta, content?: string): void {
    const existing = memory.recentDocs.filter((d) => d.id !== meta.id);
    existing.unshift(meta);
    memory.recentDocs = existing.slice(0, 20);

    if (content !== undefined) {
      memory.docContents.set(meta.id, content);
    }
    if (meta.contentHash) {
      memory.docHashes.set(meta.id, meta.contentHash);
    }

    localFallback.saveRecentDoc(meta, content);
    currentAdapter.saveRecentDoc(meta, content).catch(() => {});
  }

  public static getDocContent(documentId: string): string | null {
    if (memory.docContents.has(documentId)) {
      return memory.docContents.get(documentId)!;
    }
    try {
      const content = localStorage.getItem(`fox_doc_content_${documentId}`);
      if (content) {
        memory.docContents.set(documentId, content);
        return content;
      }
    } catch {}
    return null;
  }

  public static removeRecentDoc(documentId: string): void {
    memory.recentDocs = memory.recentDocs.filter((d) => d.id !== documentId);
    memory.docContents.delete(documentId);
    memory.chatMessages.delete(documentId);
    memory.readingPositions.delete(documentId);
    memory.docHashes.delete(documentId);

    localFallback.removeRecentDoc(documentId);
    currentAdapter.removeRecentDoc(documentId).catch(() => {});
  }
}
