export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  contextBudget: number; // conservative token budget estimate
}

export type FoxEarState = 'unconfigured' | 'ready' | 'waiting' | 'generating' | 'error';

export type DocScopeMode = 'full_doc' | 'viewport_section';

export type ThemeMode = 'system' | 'light' | 'dark';

export type BuiltinPromptActionType = 'explain' | 'analogy' | 'deep_dive' | 'code_review';

export type PromptActionType = BuiltinPromptActionType | string;

export interface PromptAction {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
  builtin?: boolean;
  enabled?: boolean;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

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
  scopeLabel?: string;
  modelName?: string;
  errorMessage?: string;
}

export interface RecentDocumentMeta {
  id: string;
  name: string;
  filePath?: string;
  contentHash?: string;
  lastOpenedAt: number;
  scrollProgress: number; // 0 - 100
  scrollTop: number;      // precise pixel position
  contentPreview?: string;
}

export interface ActiveDocument {
  id: string;
  name: string;
  filePath?: string;
  content: string;
  contentHash: string;
  scrollProgress: number; // initial / restored 0 - 100
  scrollTop: number;      // initial / restored precise pixel position
}
