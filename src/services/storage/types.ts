import { ProviderConfig, ChatMessage, RecentDocumentMeta, ThemeMode } from '../../types';

export interface StorageSchema {
  theme: ThemeMode;
  tocOpen: boolean;
  reduceMotion: boolean;
  activeConfigId: string | null;
  providerConfigs: ProviderConfig[];
  recentDocs: RecentDocumentMeta[];
}

export interface IStorageAdapter {
  init(): Promise<void>;

  // Theme & Preferences
  getTheme(): Promise<ThemeMode>;
  saveTheme(theme: ThemeMode): Promise<void>;

  getTocOpen(): Promise<boolean>;
  saveTocOpen(open: boolean): Promise<void>;

  getReduceMotion(): Promise<boolean>;
  saveReduceMotion(reduce: boolean): Promise<void>;

  // Provider Configurations
  getProviderConfigs(): Promise<ProviderConfig[]>;
  saveProviderConfigs(configs: ProviderConfig[]): Promise<void>;

  getActiveConfigId(): Promise<string | null>;
  saveActiveConfigId(id: string | null): Promise<void>;

  // Document chat history
  getMessages(documentId: string): Promise<ChatMessage[]>;
  saveMessages(documentId: string, messages: ChatMessage[]): Promise<void>;

  // Reading position
  getReadingPosition(documentId: string): Promise<{ progress: number; scrollTop: number }>;
  saveReadingPosition(documentId: string, progress: number, scrollTop: number): Promise<void>;

  // Document metadata & content
  getRecentDocs(): Promise<RecentDocumentMeta[]>;
  saveRecentDoc(meta: RecentDocumentMeta, content?: string): Promise<void>;
  getDocContent(documentId: string): Promise<string | null>;
  removeRecentDoc(documentId: string): Promise<void>;

  getDocHash(documentId: string): Promise<string | null>;
  saveDocHash(documentId: string, hash: string): Promise<void>;
}
