export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  contextBudget: number; // in tokens or chars estimate
}

export type FoxEarState = 'unconfigured' | 'ready' | 'waiting' | 'generating' | 'error';

export interface SelectionContext {
  id: string;
  text: string;
  headingPath?: string;
  surroundingContext?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  status: 'idle' | 'streaming' | 'done' | 'error';
  quote?: SelectionContext;
  modelName?: string;
  errorMessage?: string;
}

export interface RecentDocumentMeta {
  id: string;
  name: string;
  lastOpenedAt: number;
  scrollProgress: number; // 0 - 100
  scrollTop: number;      // precise pixel position
  contentPreview?: string;
}

export interface ActiveDocument {
  id: string;
  name: string;
  content: string;
  scrollProgress: number; // 0 - 100
  scrollTop: number;      // precise pixel position
  lastReadPosition?: number;
}
