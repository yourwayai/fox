import { IStorageAdapter } from './types';
import { ProviderConfig, ChatMessage, RecentDocumentMeta, ThemeMode } from '../../types';

const STORAGE_KEYS = {
  PROVIDER_CONFIGS: 'fox_provider_configs',
  ACTIVE_CONFIG_ID: 'fox_active_config_id',
  CHAT_MESSAGES: 'fox_chat_messages_',
  READING_PROGRESS: 'fox_reading_progress_',
  READING_SCROLL_TOP: 'fox_reading_scroll_top_',
  DOC_HASH: 'fox_doc_hash_',
  RECENT_DOCS: 'fox_recent_docs',
  DOC_CONTENT: 'fox_doc_content_',
  REDUCE_MOTION: 'fox_reduce_motion',
  THEME: 'fox_theme',
  TOC_OPEN: 'fox_toc_open',
};

function safeSetItem(key: string, value: string): boolean {
  try {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`[LocalStorageAdapter] Failed to persist key "${key}" (quota limit):`, err);
    return false;
  }
}

export class LocalStorageAdapter implements IStorageAdapter {
  public async init(): Promise<void> {
    // LocalStorage needs no async initialization
  }

  public async getTheme(): Promise<ThemeMode> {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.THEME);
      if (val === 'light' || val === 'dark' || val === 'system') return val;
      return 'system';
    } catch {
      return 'system';
    }
  }

  public async saveTheme(theme: ThemeMode): Promise<void> {
    safeSetItem(STORAGE_KEYS.THEME, theme);
  }

  public async getTocOpen(): Promise<boolean> {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.TOC_OPEN);
      return val === 'true';
    } catch {
      return false;
    }
  }

  public async saveTocOpen(open: boolean): Promise<void> {
    safeSetItem(STORAGE_KEYS.TOC_OPEN, open ? 'true' : 'false');
  }

  public async getReduceMotion(): Promise<boolean> {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.REDUCE_MOTION);
      if (val !== null) return val === 'true';
      return (
        typeof window !== 'undefined' &&
        Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
      );
    } catch {
      return false;
    }
  }

  public async saveReduceMotion(reduce: boolean): Promise<void> {
    safeSetItem(STORAGE_KEYS.REDUCE_MOTION, reduce ? 'true' : 'false');
  }

  public async getProviderConfigs(): Promise<ProviderConfig[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async saveProviderConfigs(configs: ProviderConfig[]): Promise<void> {
    safeSetItem(STORAGE_KEYS.PROVIDER_CONFIGS, JSON.stringify(configs));
  }

  public async getActiveConfigId(): Promise<string | null> {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONFIG_ID);
    } catch {
      return null;
    }
  }

  public async saveActiveConfigId(id: string | null): Promise<void> {
    if (id === null) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONFIG_ID);
    } else {
      safeSetItem(STORAGE_KEYS.ACTIVE_CONFIG_ID, id);
    }
  }

  public async getMessages(documentId: string): Promise<ChatMessage[]> {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async saveMessages(documentId: string, messages: ChatMessage[]): Promise<void> {
    safeSetItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`, JSON.stringify(messages));
  }

  public async getReadingPosition(documentId: string): Promise<{ progress: number; scrollTop: number }> {
    try {
      const progress = localStorage.getItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`);
      const scrollTop = localStorage.getItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`);
      return {
        progress: progress ? parseFloat(progress) : 0,
        scrollTop: scrollTop ? parseFloat(scrollTop) : 0,
      };
    } catch {
      return { progress: 0, scrollTop: 0 };
    }
  }

  public async saveReadingPosition(documentId: string, progress: number, scrollTop: number): Promise<void> {
    safeSetItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`, progress.toString());
    safeSetItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`, scrollTop.toString());
  }

  public async getDocHash(documentId: string): Promise<string | null> {
    try {
      return localStorage.getItem(`${STORAGE_KEYS.DOC_HASH}${documentId}`);
    } catch {
      return null;
    }
  }

  public async saveDocHash(documentId: string, hash: string): Promise<void> {
    safeSetItem(`${STORAGE_KEYS.DOC_HASH}${documentId}`, hash);
  }

  public async getRecentDocs(): Promise<RecentDocumentMeta[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENT_DOCS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public async saveRecentDoc(meta: RecentDocumentMeta, content?: string): Promise<void> {
    const existing = await this.getRecentDocs();
    const removed = existing.filter((d) => d.id === meta.id);
    const filtered = existing.filter((d) => d.id !== meta.id);
    filtered.unshift(meta);

    // Keep up to 15 recent documents, clean up evicted doc content
    const trimmed = filtered.slice(0, 15);
    const evicted = filtered.slice(15);
    evicted.forEach((oldDoc) => {
      try {
        localStorage.removeItem(`${STORAGE_KEYS.DOC_CONTENT}${oldDoc.id}`);
      } catch {
        // Ignore
      }
    });

    safeSetItem(STORAGE_KEYS.RECENT_DOCS, JSON.stringify(trimmed));

    if (meta.contentHash) {
      await this.saveDocHash(meta.id, meta.contentHash);
    } else if (removed[0]?.contentHash) {
      meta.contentHash = removed[0].contentHash;
    }

    if (content !== undefined) {
      safeSetItem(`${STORAGE_KEYS.DOC_CONTENT}${meta.id}`, content);
    }
  }

  public async getDocContent(documentId: string): Promise<string | null> {
    try {
      return localStorage.getItem(`${STORAGE_KEYS.DOC_CONTENT}${documentId}`);
    } catch {
      return null;
    }
  }

  public async removeRecentDoc(documentId: string): Promise<void> {
    try {
      const list = (await this.getRecentDocs()).filter((d) => d.id !== documentId);
      safeSetItem(STORAGE_KEYS.RECENT_DOCS, JSON.stringify(list));
      localStorage.removeItem(`${STORAGE_KEYS.DOC_CONTENT}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.DOC_HASH}${documentId}`);
    } catch {
      // Ignore
    }
  }
}
