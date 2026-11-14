import { ProviderConfig, ChatMessage } from '../types';

const STORAGE_KEYS = {
  PROVIDER_CONFIGS: 'fox_provider_configs',
  ACTIVE_CONFIG_ID: 'fox_active_config_id',
  CHAT_MESSAGES: 'fox_chat_messages_',
  READING_POSITION: 'fox_reading_position_',
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
      const val = localStorage.getItem(`${STORAGE_KEYS.READING_POSITION}${documentId}`);
      return val ? parseFloat(val) : 0;
    } catch {
      return 0;
    }
  }

  public static saveReadingProgress(documentId: string, progress: number): void {
    localStorage.setItem(`${STORAGE_KEYS.READING_POSITION}${documentId}`, progress.toString());
  }
}
