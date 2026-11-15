import { ProviderConfig, ChatMessage, RecentDocumentMeta } from '../types';

const STORAGE_KEYS = {
  PROVIDER_CONFIGS: 'fox_provider_configs',
  ACTIVE_CONFIG_ID: 'fox_active_config_id',
  CHAT_MESSAGES: 'fox_chat_messages_',
  READING_PROGRESS: 'fox_reading_progress_',
  READING_SCROLL_TOP: 'fox_reading_scroll_top_',
  RECENT_DOCS: 'fox_recent_docs',
  DOC_CONTENT: 'fox_doc_content_',
};

export class StorageService {
  public static getProviderConfigs(): ProviderConfig[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROVIDER_CONFIGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveProviderConfigs(configs: ProviderConfig[]): void {
    localStorage.setItem(STORAGE_KEYS.PROVIDER_CONFIGS, JSON.stringify(configs));
  }

  public static getActiveConfigId(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONFIG_ID);
  }

  public static setActiveConfigId(id: string): void {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CONFIG_ID, id);
  }

  public static getMessages(documentId: string): ChatMessage[] {
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveMessages(documentId: string, messages: ChatMessage[]): void {
    localStorage.setItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`, JSON.stringify(messages));
  }

  public static getReadingProgress(documentId: string): number {
    try {
      const val = localStorage.getItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static getReadingScrollTop(documentId: string): number {
    try {
      const val = localStorage.getItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static saveReadingPosition(documentId: string, progress: number, scrollTop: number): void {
    localStorage.setItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`, progress.toString());
    localStorage.setItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`, scrollTop.toString());
  }

  // Recent documents list
  public static getRecentDocs(): RecentDocumentMeta[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECENT_DOCS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  public static saveRecentDoc(meta: RecentDocumentMeta, content?: string): void {
    try {
      const list = this.getRecentDocs().filter((d) => d.id !== meta.id);
      list.unshift(meta);
      // Keep up to 12 recent documents
      const trimmed = list.slice(0, 12);
      localStorage.setItem(STORAGE_KEYS.RECENT_DOCS, JSON.stringify(trimmed));

      if (content !== undefined) {
        localStorage.setItem(`${STORAGE_KEYS.DOC_CONTENT}${meta.id}`, content);
      }
    } catch {
      // Storage quota safety
    }
  }

  public static getDocContent(documentId: string): string | null {
    return localStorage.getItem(`${STORAGE_KEYS.DOC_CONTENT}${documentId}`);
  }

  public static removeRecentDoc(documentId: string): void {
    try {
      const list = this.getRecentDocs().filter((d) => d.id !== documentId);
      localStorage.setItem(STORAGE_KEYS.RECENT_DOCS, JSON.stringify(list));
      localStorage.removeItem(`${STORAGE_KEYS.DOC_CONTENT}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.CHAT_MESSAGES}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.READING_PROGRESS}${documentId}`);
      localStorage.removeItem(`${STORAGE_KEYS.READING_SCROLL_TOP}${documentId}`);
    } catch {
      // Ignore
    }
  }
}
