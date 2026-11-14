import { create } from 'zustand';
import { ActiveDocument, SelectionContext, ChatMessage, ProviderConfig, FoxEarState } from '../types';
import { StorageService } from '../services/storageService';

interface AppState {
  // Document state
  activeDocument: ActiveDocument | null;
  setActiveDocument: (doc: ActiveDocument | null) => void;
  setScrollProgress: (progress: number) => void;

  // Selection quote state
  activeQuote: SelectionContext | null;
  setActiveQuote: (quote: SelectionContext | null) => void;

  // Chat conversation
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  appendStreamChunk: (chunk: string) => void;
  setLastMessageStatus: (status: 'idle' | 'streaming' | 'done' | 'error', errorMessage?: string) => void;
  clearMessages: () => void;

  // AI Provider settings
  providerConfigs: ProviderConfig[];
  activeConfigId: string | null;
  setProviderConfigs: (configs: ProviderConfig[]) => void;
  setActiveConfigId: (id: string) => void;
  getActiveConfig: () => ProviderConfig | undefined;

  // Fox Mascot states
  foxEarState: FoxEarState;
  setFoxEarState: (state: FoxEarState) => void;
  focusInputSignal: number;
  triggerFocusInput: () => void;

  // UI state
  splitRatio: number; // 0.2 to 0.8
  setSplitRatio: (ratio: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => {
  const initialConfigs = StorageService.getProviderConfigs();
  const initialActiveId = StorageService.getActiveConfigId() || initialConfigs[0]?.id || null;

  return {
    activeDocument: null,
    setActiveDocument: (doc) => {
      set({ activeDocument: doc });
      if (doc) {
        const msgs = StorageService.getMessages(doc.id);
        const progress = StorageService.getReadingProgress(doc.id);
        set({
          messages: msgs,
          activeDocument: { ...doc, scrollProgress: progress },
        });
      } else {
        set({ messages: [] });
      }
    },
    setScrollProgress: (progress) => {
      const { activeDocument } = get();
      if (activeDocument) {
        StorageService.saveReadingProgress(activeDocument.id, progress);
        set({
          activeDocument: { ...activeDocument, scrollProgress: progress },
        });
      }
    },

    activeQuote: null,
    setActiveQuote: (quote) => set({ activeQuote: quote }),

    messages: [],
    addMessage: (msg) => {
      const next = [...get().messages, msg];
      set({ messages: next });
      const doc = get().activeDocument;
      if (doc) StorageService.saveMessages(doc.id, next);
    },
    appendStreamChunk: (chunk) => {
      const { messages, activeDocument } = get();
      if (!messages.length) return;
      const lastIndex = messages.length - 1;
      const lastMsg = { ...messages[lastIndex] };
      lastMsg.content += chunk;
      lastMsg.status = 'streaming';
      const next = [...messages.slice(0, lastIndex), lastMsg];
      set({ messages: next });
      if (activeDocument) StorageService.saveMessages(activeDocument.id, next);
    },
    setLastMessageStatus: (status, errorMessage) => {
      const { messages, activeDocument } = get();
      if (!messages.length) return;
      const lastIndex = messages.length - 1;
      const lastMsg = { ...messages[lastIndex], status, errorMessage };
      const next = [...messages.slice(0, lastIndex), lastMsg];
      set({ messages: next });
      if (activeDocument) StorageService.saveMessages(activeDocument.id, next);
    },
    clearMessages: () => {
      set({ messages: [] });
      const doc = get().activeDocument;
      if (doc) StorageService.saveMessages(doc.id, []);
    },

    providerConfigs: initialConfigs,
    activeConfigId: initialActiveId,
    setProviderConfigs: (configs) => {
      StorageService.saveProviderConfigs(configs);
      set({ providerConfigs: configs });
      if (!get().activeConfigId && configs.length > 0) {
        get().setActiveConfigId(configs[0].id);
      }
    },
    setActiveConfigId: (id) => {
      StorageService.setActiveConfigId(id);
      set({ activeConfigId: id });
    },
    getActiveConfig: () => {
      const { providerConfigs, activeConfigId } = get();
      return providerConfigs.find((c) => c.id === activeConfigId);
    },

    foxEarState: initialConfigs.length > 0 ? 'ready' : 'unconfigured',
    setFoxEarState: (state) => set({ foxEarState: state }),
    focusInputSignal: 0,
    triggerFocusInput: () => set((s) => ({ focusInputSignal: s.focusInputSignal + 1 })),

    splitRatio: 0.38,
    setSplitRatio: (ratio) => set({ splitRatio: ratio }),
    isSettingsOpen: false,
    setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),
  };
});
