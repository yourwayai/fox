import { IStorageAdapter } from './types';
import { ProviderConfig, ChatMessage, RecentDocumentMeta, ThemeMode } from '../../types';

const DB_NAME = 'FoxStorageDB';
const DB_VERSION = 1;

const STORES = {
  PREFERENCES: 'preferences',
  DOCUMENTS: 'documents',
  MESSAGES: 'messages',
  POSITIONS: 'positions',
  CONFIGS: 'configs',
};

export class IndexedDBAdapter implements IStorageAdapter {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  public async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve();
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORES.PREFERENCES)) {
          db.createObjectStore(STORES.PREFERENCES);
        }
        if (!db.objectStoreNames.contains(STORES.DOCUMENTS)) {
          db.createObjectStore(STORES.DOCUMENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
          db.createObjectStore(STORES.MESSAGES);
        }
        if (!db.objectStoreNames.contains(STORES.POSITIONS)) {
          db.createObjectStore(STORES.POSITIONS);
        }
        if (!db.objectStoreNames.contains(STORES.CONFIGS)) {
          db.createObjectStore(STORES.CONFIGS);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => {
        console.warn('[IndexedDBAdapter] Failed to open IndexedDB, falling back:', request.error);
        resolve(); // resolve so app continues with fallback
      };
    });

    return this.initPromise;
  }

  private async getStoreValue<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  private async setStoreValue<T>(storeName: string, key: IDBValidKey, value: T): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async getTheme(): Promise<ThemeMode> {
    const val = await this.getStoreValue<ThemeMode>(STORES.PREFERENCES, 'theme');
    if (val === 'light' || val === 'dark' || val === 'system') return val;
    return 'system';
  }

  public async saveTheme(theme: ThemeMode): Promise<void> {
    await this.setStoreValue(STORES.PREFERENCES, 'theme', theme);
  }

  public async getTocOpen(): Promise<boolean> {
    const val = await this.getStoreValue<boolean>(STORES.PREFERENCES, 'tocOpen');
    return Boolean(val);
  }

  public async saveTocOpen(open: boolean): Promise<void> {
    await this.setStoreValue(STORES.PREFERENCES, 'tocOpen', open);
  }

  public async getReduceMotion(): Promise<boolean> {
    const val = await this.getStoreValue<boolean>(STORES.PREFERENCES, 'reduceMotion');
    if (val !== null) return val;
    return (
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    );
  }

  public async saveReduceMotion(reduce: boolean): Promise<void> {
    await this.setStoreValue(STORES.PREFERENCES, 'reduceMotion', reduce);
  }

  public async getProviderConfigs(): Promise<ProviderConfig[]> {
    const configs = await this.getStoreValue<ProviderConfig[]>(STORES.CONFIGS, 'providerConfigs');
    return configs || [];
  }

  public async saveProviderConfigs(configs: ProviderConfig[]): Promise<void> {
    await this.setStoreValue(STORES.CONFIGS, 'providerConfigs', configs);
  }

  public async getActiveConfigId(): Promise<string | null> {
    return this.getStoreValue<string>(STORES.CONFIGS, 'activeConfigId');
  }

  public async saveActiveConfigId(id: string | null): Promise<void> {
    await this.setStoreValue(STORES.CONFIGS, 'activeConfigId', id);
  }

  public async getMessages(documentId: string): Promise<ChatMessage[]> {
    const messages = await this.getStoreValue<ChatMessage[]>(STORES.MESSAGES, documentId);
    return messages || [];
  }

  public async saveMessages(documentId: string, messages: ChatMessage[]): Promise<void> {
    await this.setStoreValue(STORES.MESSAGES, documentId, messages);
  }

  public async getReadingPosition(documentId: string): Promise<{ progress: number; scrollTop: number }> {
    const pos = await this.getStoreValue<{ progress: number; scrollTop: number }>(STORES.POSITIONS, documentId);
    return pos || { progress: 0, scrollTop: 0 };
  }

  public async saveReadingPosition(documentId: string, progress: number, scrollTop: number): Promise<void> {
    await this.setStoreValue(STORES.POSITIONS, documentId, { progress, scrollTop });
  }

  public async getDocHash(documentId: string): Promise<string | null> {
    return this.getStoreValue<string>(STORES.PREFERENCES, `hash_${documentId}`);
  }

  public async saveDocHash(documentId: string, hash: string): Promise<void> {
    await this.setStoreValue(STORES.PREFERENCES, `hash_${documentId}`, hash);
  }

  public async getRecentDocs(): Promise<RecentDocumentMeta[]> {
    const docs = await this.getStoreValue<RecentDocumentMeta[]>(STORES.DOCUMENTS, 'all_recent');
    return docs || [];
  }

  public async saveRecentDoc(meta: RecentDocumentMeta, content?: string): Promise<void> {
    const existing = await this.getRecentDocs();
    const filtered = existing.filter((d) => d.id !== meta.id);
    filtered.unshift(meta);
    const trimmed = filtered.slice(0, 30);

    await this.setStoreValue(STORES.DOCUMENTS, 'all_recent', trimmed);
    if (content !== undefined) {
      await this.setStoreValue(STORES.DOCUMENTS, `content_${meta.id}`, content);
    }
  }

  public async getDocContent(documentId: string): Promise<string | null> {
    return this.getStoreValue<string>(STORES.DOCUMENTS, `content_${documentId}`);
  }

  public async removeRecentDoc(documentId: string): Promise<void> {
    const existing = await this.getRecentDocs();
    const filtered = existing.filter((d) => d.id !== documentId);
    await this.setStoreValue(STORES.DOCUMENTS, 'all_recent', filtered);
  }
}
