import { create } from 'zustand';
import {
  ActiveDocument,
  SelectionContext,
  ChatMessage,
  ProviderConfig,
  FoxEarState,
  RecentDocumentMeta,
  DocScopeMode,
  ThemeMode,
  PromptActionType,
} from '../types';
import { StorageService } from '../services/storageService';
import { AIService } from '../services/aiService';
import { computeContentHash, getPresetPrompt, buildDocumentId } from '../utils/contextExtractor';
import { isTauriApp, openMarkdownFileNative, readMarkdownFileFromPath } from '../utils/tauriBridge';

interface SendQuestionOptions {
  quoteOverride?: SelectionContext | null;
  forceOverBudget?: boolean;
  scopeOverride?: DocScopeMode;
}

interface AppState {
  // Document state
  activeDocument: ActiveDocument | null;
  recentDocs: RecentDocumentMeta[];
  readingProgress: number;
  readingScrollTop: number;
  contentUpdatedNotice: boolean;
  dismissContentUpdatedNotice: () => void;
  setActiveDocument: (doc: ActiveDocument | null, saveToRecent?: boolean) => void;
  openRecentDocument: (docId: string) => Promise<void>;
  openNativeFile: () => Promise<void>;
  openFileSignal: number;
  triggerOpenFile: () => void;
  removeRecentDocument: (docId: string) => void;
  setScrollPosition: (progress: number, scrollTop: number) => void;

  // Selection & context scope state
  activeQuote: SelectionContext | null;
  setActiveQuote: (quote: SelectionContext | null) => void;
  docScopeMode: DocScopeMode;
  setDocScopeMode: (mode: DocScopeMode) => void;

  // Draft input & Preview Modal state
  draftQuestion: string;
  setDraftQuestion: (val: string) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;

  // Chat conversation & unified actions
  messages: ChatMessage[];
  clearMessages: () => void;
  sendQuestion: (customPrompt?: string, options?: SendQuestionOptions) => Promise<void>;
  explainSelection: (quote: SelectionContext) => Promise<void>;
  executePromptAction: (quote: SelectionContext, action: PromptActionType) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  regenerateAnswer: (assistantMessageId: string, targetConfigId?: string) => Promise<void>;
  stopGeneration: () => void;

  // Domain Privacy Confirmation (Planning Sec 7.2)
  pendingDomainConfirm: { domain: string; onConfirm: () => void } | null;
  setPendingDomainConfirm: (val: { domain: string; onConfirm: () => void } | null) => void;
  confirmDomain: (domain: string, remember: boolean) => void;

  // Remote Image Privacy Gate (Planning Sec 4.2 & 7.2)
  trustedImageDomains: string[];
  trustImageDomain: (domain: string) => void;
  untrustImageDomain: (domain: string) => void;
  clearTrustedImageDomains: () => void;

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

  // Quote reverse highlight signal
  highlightQuoteText: string | null;
  highlightSignal: number;
  scrollToQuote: (text: string) => void;

  // UI state
  splitRatio: number;
  setSplitRatio: (ratio: number) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  isTocOpen: boolean;
  setIsTocOpen: (open: boolean) => void;
}

let scrollPersistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingScrollSave: { docId: string; progress: number; scrollTop: number } | null = null;

function flushPendingScrollSave(get: () => AppState, set: (partial: Partial<AppState>) => void) {
  if (scrollPersistTimer) {
    clearTimeout(scrollPersistTimer);
    scrollPersistTimer = null;
  }
  if (!pendingScrollSave) return;
  const { docId, progress, scrollTop } = pendingScrollSave;
  pendingScrollSave = null;

  StorageService.saveReadingPosition(docId, progress, scrollTop);
  const { recentDocs } = get();
  const idx = recentDocs.findIndex((d) => d.id === docId);
  if (idx >= 0) {
    const updatedMeta: RecentDocumentMeta = {
      ...recentDocs[idx],
      scrollProgress: progress,
      scrollTop,
    };
    StorageService.saveRecentDoc(updatedMeta);
    const nextRecent = [...recentDocs];
    nextRecent[idx] = updatedMeta;
    set({ recentDocs: nextRecent });
  }
}

export function applyThemeToDocument(theme: ThemeMode) {
  if (typeof document === 'undefined') return;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      Boolean(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const initialConfigs = StorageService.getProviderConfigs();
  const initialActiveId = StorageService.getActiveConfigId() || initialConfigs[0]?.id || null;
  const initialRecentDocs = StorageService.getRecentDocs();
  const initialReduceMotion = StorageService.getReduceMotion();
  const initialTheme = StorageService.getTheme();
  const initialTocOpen = StorageService.getTocOpen();

  // Apply initial theme immediately to prevent flashing
  applyThemeToDocument(initialTheme);

  if (typeof window !== 'undefined' && window.matchMedia) {
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (get().theme === 'system') {
          applyThemeToDocument('system');
        }
      });
    } catch {
      // Ignore older browser event listener error
    }
  }

  return {
    activeDocument: null,
    recentDocs: initialRecentDocs,
    readingProgress: 0,
    readingScrollTop: 0,
    contentUpdatedNotice: false,
    dismissContentUpdatedNotice: () => set({ contentUpdatedNotice: false }),

    reduceMotion: initialReduceMotion,
    setReduceMotion: (reduce) => {
      StorageService.saveReduceMotion(reduce);
      set({ reduceMotion: reduce });
    },

    setActiveDocument: (doc, saveToRecent = true) => {
      // Flush any unsaved scroll position of the previous document first
      flushPendingScrollSave(get, set);

      if (!doc) {
        set({
          activeDocument: null,
          messages: [],
          readingProgress: 0,
          readingScrollTop: 0,
          contentUpdatedNotice: false,
          activeQuote: null,
          docScopeMode: 'full_doc',
        });
        return;
      }

      const contentHash = doc.contentHash || computeContentHash(doc.content);
      const previousHash = StorageService.getDocHash(doc.id);
      const msgs = StorageService.getMessages(doc.id);
      const progress = StorageService.getReadingProgress(doc.id);
      const scrollTop = StorageService.getReadingScrollTop(doc.id);

      const hasVersionChanged = Boolean(
        previousHash && previousHash !== contentHash && msgs.length > 0
      );

      const restoredProgress = progress || doc.scrollProgress || 0;
      const restoredScrollTop = scrollTop || doc.scrollTop || 0;

      const updatedDoc: ActiveDocument = {
        ...doc,
        contentHash,
        scrollProgress: restoredProgress,
        scrollTop: restoredScrollTop,
      };

      set({
        activeDocument: updatedDoc,
        messages: msgs,
        readingProgress: restoredProgress,
        readingScrollTop: restoredScrollTop,
        contentUpdatedNotice: hasVersionChanged,
        activeQuote: null,
        docScopeMode: 'full_doc',
      });

      if (saveToRecent) {
        const meta: RecentDocumentMeta = {
          id: doc.id,
          name: doc.name,
          filePath: doc.filePath,
          contentHash,
          lastOpenedAt: Date.now(),
          scrollProgress: restoredProgress,
          scrollTop: restoredScrollTop,
          contentPreview: doc.content.slice(0, 100),
        };
        StorageService.saveRecentDoc(meta, doc.content);
        set({ recentDocs: StorageService.getRecentDocs() });
      }
    },

    openRecentDocument: async (docId: string) => {
      flushPendingScrollSave(get, set);
      const recent = get().recentDocs.find((d) => d.id === docId);
      if (!recent) return;

      let content = StorageService.getDocContent(docId);
      if (recent.filePath && isTauriApp()) {
        try {
          const fresh = await readMarkdownFileFromPath(recent.filePath);
          if (fresh && fresh.content) {
            content = fresh.content;
          }
        } catch {
          // Fall back to cached content
        }
      }

      if (content !== null) {
        const contentHash = computeContentHash(content);
        get().setActiveDocument(
          {
            id: recent.id,
            name: recent.name,
            filePath: recent.filePath,
            content,
            contentHash,
            scrollProgress: recent.scrollProgress,
            scrollTop: recent.scrollTop,
          },
          true
        );
      }
    },

    openNativeFile: async () => {
      if (!isTauriApp()) return;
      const file = await openMarkdownFileNative();
      if (!file) return;

      const contentHash = computeContentHash(file.content);
      const docId = buildDocumentId(file.name, file.content);
      get().setActiveDocument(
        {
          id: docId,
          name: file.name,
          filePath: file.path,
          content: file.content,
          contentHash,
          scrollProgress: 0,
          scrollTop: 0,
        },
        true
      );
    },

    openFileSignal: 0,
    triggerOpenFile: () => {
      if (isTauriApp()) {
        void get().openNativeFile();
      } else {
        set((s) => ({ openFileSignal: s.openFileSignal + 1 }));
      }
    },

    removeRecentDocument: (docId: string) => {
      if (pendingScrollSave?.docId === docId) {
        pendingScrollSave = null;
        if (scrollPersistTimer) {
          clearTimeout(scrollPersistTimer);
          scrollPersistTimer = null;
        }
      }
      StorageService.removeRecentDoc(docId);
      const nextRecent = StorageService.getRecentDocs();
      set({ recentDocs: nextRecent });

      if (get().activeDocument?.id === docId) {
        if (nextRecent.length > 0) {
          get().openRecentDocument(nextRecent[0].id);
        } else {
          set({
            activeDocument: null,
            messages: [],
            readingProgress: 0,
            readingScrollTop: 0,
            contentUpdatedNotice: false,
          });
        }
      }
    },

    setScrollPosition: (progress: number, scrollTop: number) => {
      const { activeDocument, readingProgress } = get();
      if (!activeDocument) return;

      // Only notify React subscribers when percentage changes meaningfully (>= 0.5%) or hits boundaries
      const roundedDiff = Math.abs(progress - readingProgress);
      if (
        roundedDiff >= 0.5 ||
        (progress === 0 && readingProgress !== 0) ||
        (progress >= 99.8 && readingProgress < 99.8)
      ) {
        set({ readingProgress: progress, readingScrollTop: scrollTop });
      }

      // Debounce localStorage persistence so scrolling is 100% non-blocking
      pendingScrollSave = {
        docId: activeDocument.id,
        progress,
        scrollTop,
      };

      if (scrollPersistTimer) clearTimeout(scrollPersistTimer);
      scrollPersistTimer = setTimeout(() => {
        flushPendingScrollSave(get, set);
      }, 250);
    },

    activeQuote: null,
    setActiveQuote: (quote) => set({ activeQuote: quote }),
    docScopeMode: 'full_doc',
    setDocScopeMode: (mode) => set({ docScopeMode: mode }),

    draftQuestion: '',
    setDraftQuestion: (val) => set({ draftQuestion: val }),
    isPreviewOpen: false,
    setIsPreviewOpen: (open) => set({ isPreviewOpen: open }),

    messages: [],
    clearMessages: () => {
      AIService.stopGenerating();
      set({ messages: [], foxEarState: get().getActiveConfig() ? 'ready' : 'unconfigured' });
      const doc = get().activeDocument;
      if (doc) StorageService.saveMessages(doc.id, []);
    },

    stopGeneration: () => {
      AIService.stopGenerating();
      const { messages, activeDocument } = get();
      if (messages.length > 0) {
        const lastIdx = messages.length - 1;
        const last = messages[lastIdx];
        if (last.role === 'assistant' && last.status === 'streaming') {
          const updated: ChatMessage = {
            ...last,
            content: last.content || '（已手动停止回答）',
            status: 'done',
          };
          const next = [...messages.slice(0, lastIdx), updated];
          set({ messages: next, foxEarState: 'ready' });
          if (activeDocument) StorageService.saveMessages(activeDocument.id, next);
          return;
        }
      }
      set({ foxEarState: 'ready' });
    },

    sendQuestion: async (customPrompt?: string, options?: SendQuestionOptions) => {
      const state = get();
      const isGenerating = state.foxEarState === 'generating' || state.foxEarState === 'waiting';
      if (isGenerating) return;

      const effectiveQuote =
        options?.quoteOverride !== undefined ? options.quoteOverride : state.activeQuote;
      const effectiveScope = options?.scopeOverride || state.docScopeMode;
      const rawQuestion = (customPrompt !== undefined ? customPrompt : state.draftQuestion).trim();

      if (!rawQuestion && !effectiveQuote) return;

      const config = state.getActiveConfig();
      if (!config || !config.baseUrl.trim() || !config.model.trim()) {
        if (effectiveQuote) {
          set({ activeQuote: effectiveQuote });
        }
        if (customPrompt && !state.draftQuestion) {
          set({ draftQuestion: customPrompt });
        }
        set({ isSettingsOpen: true });
        return;
      }

      // Domain privacy check (Planning Doc Section 7.2)
      try {
        const urlObj = new URL(config.baseUrl);
        const hostname = urlObj.hostname;
        const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
        const confirmed = StorageService.getConfirmedDomains();
        if (!isLocal && !confirmed.includes(hostname)) {
          set({
            pendingDomainConfirm: {
              domain: hostname,
              onConfirm: () => {
                set({ pendingDomainConfirm: null });
                void get().sendQuestion(customPrompt, options);
              },
            },
          });
          return;
        }
      } catch {
        // Proceed on malformed URL, let AIService report network error
      }

      const finalQuestion =
        rawQuestion ||
        (effectiveQuote ? '请解释这段内容的核心含义及背景。' : '请总结这篇文档的核心内容。');

      const docName = state.activeDocument?.name || '当前文档';
      const docContent = state.activeDocument?.content || '';
      const targetDocId = state.activeDocument?.id || 'ephemeral_doc';

      // Assemble single-source-of-truth payload & verify budget
      const preview = AIService.assemblePromptPreview({
        documentName: docName,
        documentContent: docContent,
        scrollProgress: state.readingProgress,
        docScopeMode: effectiveScope,
        quote: effectiveQuote,
        userQuestion: finalQuestion,
        history: state.messages,
        budget: config.contextBudget || 4096,
      });

      if (preview.isOverBudget && !options?.forceOverBudget) {
        set({
          activeQuote: effectiveQuote || null,
          draftQuestion: customPrompt !== undefined ? finalQuestion : state.draftQuestion,
          docScopeMode: effectiveScope,
          isPreviewOpen: true,
        });
        return;
      }

      const now = Date.now();
      const userMsg: ChatMessage = {
        id: `msg_usr_${now}`,
        role: 'user',
        content: finalQuestion,
        createdAt: now,
        status: 'done',
        quote: effectiveQuote || undefined,
        scopeLabel: preview.scopeLabel,
      };

      const assistantMsgId = `msg_asst_${now + 1}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        createdAt: now + 1,
        status: 'streaming',
        modelName: config.model,
      };

      // Authoritative message list scoped to `targetDocId` so document switching never cross-contaminates!
      let sessionMessages: ChatMessage[] = [...state.messages, userMsg, assistantMsg];

      set({
        messages: sessionMessages,
        draftQuestion: customPrompt !== undefined ? state.draftQuestion : '',
        activeQuote: null,
        docScopeMode: 'full_doc',
        isPreviewOpen: false,
        foxEarState: 'waiting',
      });

      if (state.activeDocument) {
        StorageService.saveMessages(targetDocId, sessionMessages);
      }

      let streamSaveTimer: ReturnType<typeof setTimeout> | null = null;
      const scheduleStreamSave = () => {
        if (streamSaveTimer || !state.activeDocument) return;
        streamSaveTimer = setTimeout(() => {
          streamSaveTimer = null;
          StorageService.saveMessages(targetDocId, sessionMessages);
        }, 400);
      };

      const flushStreamSave = () => {
        if (streamSaveTimer) {
          clearTimeout(streamSaveTimer);
          streamSaveTimer = null;
        }
        if (state.activeDocument) {
          StorageService.saveMessages(targetDocId, sessionMessages);
        }
      };

      await AIService.streamChat({
        config,
        apiMessages: preview.apiMessages,
        onChunk: (delta) => {
          const lastIdx = sessionMessages.length - 1;
          const prevAsst = sessionMessages[lastIdx];
          if (!prevAsst || prevAsst.id !== assistantMsgId) return;

          const updatedAsst: ChatMessage = {
            ...prevAsst,
            content: prevAsst.content + delta,
            status: 'streaming',
          };
          sessionMessages = [...sessionMessages.slice(0, lastIdx), updatedAsst];

          if (get().activeDocument?.id === targetDocId) {
            set({ messages: sessionMessages, foxEarState: 'generating' });
          } else {
            set({ foxEarState: 'generating' });
          }
          scheduleStreamSave();
        },
        onFinish: () => {
          const lastIdx = sessionMessages.length - 1;
          const prevAsst = sessionMessages[lastIdx];
          if (prevAsst && prevAsst.id === assistantMsgId) {
            const updatedAsst: ChatMessage = {
              ...prevAsst,
              content: prevAsst.content || '（未返回内容）',
              status: 'done',
            };
            sessionMessages = [...sessionMessages.slice(0, lastIdx), updatedAsst];
          }
          flushStreamSave();

          if (get().activeDocument?.id === targetDocId) {
            set({ messages: sessionMessages, foxEarState: 'ready' });
          } else {
            set({ foxEarState: 'ready' });
          }
        },
        onError: (errMsg) => {
          const lastIdx = sessionMessages.length - 1;
          const prevAsst = sessionMessages[lastIdx];
          if (prevAsst && prevAsst.id === assistantMsgId) {
            const updatedAsst: ChatMessage = {
              ...prevAsst,
              status: 'error',
              errorMessage: errMsg,
            };
            sessionMessages = [...sessionMessages.slice(0, lastIdx), updatedAsst];
          }
          flushStreamSave();

          if (get().activeDocument?.id === targetDocId) {
            set({ messages: sessionMessages, foxEarState: 'error' });
          } else {
            set({ foxEarState: 'error' });
          }
        },
      });
    },

    explainSelection: async (quote: SelectionContext) => {
      await get().sendQuestion('请解释这段内容的核心含义及背景。', {
        quoteOverride: quote,
      });
    },

    executePromptAction: async (quote: SelectionContext, action: PromptActionType) => {
      const prompt = getPresetPrompt(action);
      await get().sendQuestion(prompt, {
        quoteOverride: quote,
      });
    },

    regenerateAnswer: async (assistantMessageId: string, targetConfigId?: string) => {
      const state = get();
      const isGenerating = state.foxEarState === 'generating' || state.foxEarState === 'waiting';
      if (isGenerating || state.messages.length === 0) return;

      if (targetConfigId && targetConfigId !== state.activeConfigId) {
        get().setActiveConfigId(targetConfigId);
      }

      const asstIdx = state.messages.findIndex((m) => m.id === assistantMessageId);
      if (asstIdx < 0) return;

      let userIdx = -1;
      for (let i = asstIdx - 1; i >= 0; i--) {
        if (state.messages[i].role === 'user') {
          userIdx = i;
          break;
        }
      }
      if (userIdx < 0) return;

      const userToRetry = state.messages[userIdx];
      const priorMessages = state.messages.slice(0, userIdx);

      set({ messages: priorMessages });
      if (state.activeDocument) {
        StorageService.saveMessages(state.activeDocument.id, priorMessages);
      }

      await get().sendQuestion(userToRetry.content, {
        quoteOverride: userToRetry.quote || null,
        forceOverBudget: true,
      });
    },

    retryLastMessage: async () => {
      const state = get();
      const lastAsst = [...state.messages].reverse().find((m) => m.role === 'assistant');
      if (lastAsst) {
        await get().regenerateAnswer(lastAsst.id);
      }
    },

    pendingDomainConfirm: null,
    setPendingDomainConfirm: (val) => set({ pendingDomainConfirm: val }),
    confirmDomain: (domain: string, remember: boolean) => {
      if (remember) {
        StorageService.saveConfirmedDomain(domain);
      }
      const pending = get().pendingDomainConfirm;
      if (pending && pending.domain === domain) {
        const cb = pending.onConfirm;
        set({ pendingDomainConfirm: null });
        cb();
      }
    },

    // Remote Image Privacy Gate
    trustedImageDomains: StorageService.getTrustedImageDomains(),
    trustImageDomain: (domain: string) => {
      StorageService.saveTrustedImageDomain(domain);
      set({ trustedImageDomains: StorageService.getTrustedImageDomains() });
    },
    untrustImageDomain: (domain: string) => {
      StorageService.removeTrustedImageDomain(domain);
      set({ trustedImageDomains: StorageService.getTrustedImageDomains() });
    },
    clearTrustedImageDomains: () => {
      StorageService.clearTrustedImageDomains();
      set({ trustedImageDomains: [] });
    },

    providerConfigs: initialConfigs,
    activeConfigId: initialActiveId,
    setProviderConfigs: (configs) => {
      StorageService.saveProviderConfigs(configs);
      set({ providerConfigs: configs });
      const currentActive = get().activeConfigId;
      if ((!currentActive || !configs.some((c) => c.id === currentActive)) && configs.length > 0) {
        get().setActiveConfigId(configs[0].id);
      } else if (configs.length === 0) {
        set({ activeConfigId: null, foxEarState: 'unconfigured' });
      }
    },
    setActiveConfigId: (id) => {
      StorageService.setActiveConfigId(id);
      set({ activeConfigId: id, foxEarState: 'ready' });
    },
    getActiveConfig: () => {
      const { providerConfigs, activeConfigId } = get();
      return providerConfigs.find((c) => c.id === activeConfigId) || providerConfigs[0];
    },

    foxEarState: initialConfigs.length > 0 ? 'ready' : 'unconfigured',
    setFoxEarState: (state) => set({ foxEarState: state }),
    focusInputSignal: 0,
    triggerFocusInput: () => set((s) => ({ focusInputSignal: s.focusInputSignal + 1 })),

    highlightQuoteText: null,
    highlightSignal: 0,
    scrollToQuote: (text: string) =>
      set((s) => ({ highlightQuoteText: text, highlightSignal: s.highlightSignal + 1 })),

    splitRatio: 0.38,
    setSplitRatio: (ratio) => set({ splitRatio: ratio }),
    isSettingsOpen: false,
    setIsSettingsOpen: (open) => set({ isSettingsOpen: open }),

    theme: initialTheme,
    setTheme: (theme) => {
      StorageService.saveTheme(theme);
      applyThemeToDocument(theme);
      set({ theme });
    },

    isTocOpen: initialTocOpen,
    setIsTocOpen: (open) => {
      StorageService.saveTocOpen(open);
      set({ isTocOpen: open });
    },
  };
});
