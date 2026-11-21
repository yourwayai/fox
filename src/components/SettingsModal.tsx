import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  AlertCircle,
  Loader2,
  KeyRound,
  Sparkles,
  Plus,
  Trash2,
  Sun,
  Moon,
  Monitor,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
  Edit3,
  Languages,
  CheckSquare,
  Wand2,
  Cpu,
  Code2,
  Lightbulb,
  FileText,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ProviderConfig, PromptAction } from '../types';
import { AIService } from '../services/aiService';
import { isKeychainSupported, KEYCHAIN_PLACEHOLDER } from '../utils/tauriBridge';

function formatMaskedApiKey(key: string): string {
  if (!key) return '';
  if (key === KEYCHAIN_PLACEHOLDER) {
    return '•••••••• [钥匙串托管]';
  }
  const trimmed = key.trim();
  if (trimmed.length <= 8) {
    return '••••••••';
  }
  if (trimmed.startsWith('sk-')) {
    return `sk-••••••••${trimmed.slice(-4)}`;
  }
  return `${trimmed.slice(0, 3)}••••••••${trimmed.slice(-4)}`;
}

function createBlankConfig(index: number): ProviderConfig {
  return {
    id: `cfg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: `AI 服务 #${index}`,
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    contextBudget: 8192,
  };
}

const AVAILABLE_ACTION_ICONS = [
  { name: 'Sparkles', label: '火花' },
  { name: 'Lightbulb', label: '类比' },
  { name: 'Cpu', label: '推导' },
  { name: 'Code2', label: '代码' },
  { name: 'Languages', label: '翻译' },
  { name: 'CheckSquare', label: '要点' },
  { name: 'Wand2', label: '润色' },
  { name: 'FileText', label: '文档' },
];

const QUICK_ACTION_PRESETS = [
  {
    label: '翻译',
    icon: 'Languages',
    prompt: '请将选中的内容翻译为地道流畅的中文，并对关键技术词汇给出注释与上下文说明。',
  },
  {
    label: '要点',
    icon: 'CheckSquare',
    prompt: '请精炼提炼选中内容的核心要点，以清晰的 3~5 条要点列表呈现其关键论据与结论。',
  },
  {
    label: '润色',
    icon: 'Wand2',
    prompt: '请对选中的段落进行文字润色与表达优化，提升专业性与可读性，并说明改进理由。',
  },
];

function renderActionIcon(iconName?: string, className = 'w-4 h-4') {
  switch (iconName) {
    case 'Sparkles':
      return <Sparkles className={`${className} text-fox-orange`} />;
    case 'Lightbulb':
      return <Lightbulb className={`${className} text-amber-500`} />;
    case 'Cpu':
      return <Cpu className={`${className} text-cyan-500`} />;
    case 'Code2':
      return <Code2 className={`${className} text-emerald-500`} />;
    case 'Languages':
      return <Languages className={`${className} text-blue-500`} />;
    case 'FileText':
      return <FileText className={`${className} text-indigo-500`} />;
    case 'CheckSquare':
      return <CheckSquare className={`${className} text-teal-500`} />;
    case 'Wand2':
      return <Wand2 className={`${className} text-fuchsia-500`} />;
    default:
      return <Sparkles className={`${className} text-fox-orange`} />;
  }
}

export const SettingsModal: React.FC = () => {
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const setIsSettingsOpen = useAppStore((s) => s.setIsSettingsOpen);
  const providerConfigs = useAppStore((s) => s.providerConfigs);
  const activeConfigId = useAppStore((s) => s.activeConfigId);
  const setProviderConfigs = useAppStore((s) => s.setProviderConfigs);
  const setActiveConfigId = useAppStore((s) => s.setActiveConfigId);
  const setFoxEarState = useAppStore((s) => s.setFoxEarState);
  const reduceMotion = useAppStore((s) => s.reduceMotion);
  const setReduceMotion = useAppStore((s) => s.setReduceMotion);
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const trustedImageDomains = useAppStore((s) => s.trustedImageDomains);
  const untrustImageDomain = useAppStore((s) => s.untrustImageDomain);
  const clearTrustedImageDomains = useAppStore((s) => s.clearTrustedImageDomains);

  // Custom Prompt Actions Store
  const promptActions = useAppStore((s) => s.promptActions);
  const addPromptAction = useAppStore((s) => s.addPromptAction);
  const updatePromptAction = useAppStore((s) => s.updatePromptAction);
  const deletePromptAction = useAppStore((s) => s.deletePromptAction);
  const resetPromptActions = useAppStore((s) => s.resetPromptActions);

  // Tab State
  const [activeTab, setActiveTab] = useState<'model' | 'actions' | 'general'>('model');

  // Model Form State
  const [currentConfig, setCurrentConfig] = useState<ProviderConfig>(() => createBlankConfig(1));
  const [showApiKey, setShowApiKey] = useState(false);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isKeychainSupportedState, setIsKeychainSupportedState] = useState(false);

  useEffect(() => {
    isKeychainSupported().then((supported) => {
      setIsKeychainSupportedState(supported);
    });
  }, []);

  // Custom Action Form State
  const [isActionFormOpen, setIsActionFormOpen] = useState(false);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState('');
  const [actionPrompt, setActionPrompt] = useState('');
  const [actionIcon, setActionIcon] = useState('Sparkles');

  useEffect(() => {
    if (isSettingsOpen) {
      const active = providerConfigs.find((c) => c.id === activeConfigId);
      if (active) {
        setCurrentConfig({ ...active });
        setIsEditingKey(!active.apiKey || active.apiKey.trim().length === 0);
      } else if (providerConfigs.length > 0) {
        setCurrentConfig({ ...providerConfigs[0] });
        setIsEditingKey(!providerConfigs[0].apiKey || providerConfigs[0].apiKey.trim().length === 0);
      } else {
        setCurrentConfig(createBlankConfig(1));
        setIsEditingKey(true);
      }
      setShowApiKey(false);
      setTestResult(null);
      setIsActionFormOpen(false);
      setEditingActionId(null);
    }
  }, [isSettingsOpen, activeConfigId, providerConfigs]);

  if (!isSettingsOpen) return null;

  const handleSelectSavedConfig = (cfg: ProviderConfig) => {
    setCurrentConfig({ ...cfg });
    setActiveConfigId(cfg.id);
    setIsEditingKey(!cfg.apiKey || cfg.apiKey.trim().length === 0);
    setShowApiKey(false);
    setTestResult(null);
  };

  const handleAddNewConfig = () => {
    const fresh = createBlankConfig(providerConfigs.length + 1);
    setCurrentConfig(fresh);
    setIsEditingKey(true);
    setShowApiKey(false);
    setTestResult(null);
  };

  const handleDeleteCurrentConfig = () => {
    const next = providerConfigs.filter((c) => c.id !== currentConfig.id);
    setProviderConfigs(next);
    if (next.length > 0) {
      setCurrentConfig({ ...next[0] });
      setActiveConfigId(next[0].id);
      setIsEditingKey(!next[0].apiKey || next[0].apiKey.trim().length === 0);
    } else {
      setCurrentConfig(createBlankConfig(1));
      setIsEditingKey(true);
    }
    setShowApiKey(false);
    setTestResult(null);
  };

  // Preset templates for providers
  const applyPreset = (preset: 'deepseek' | 'openai' | 'ollama') => {
    if (preset === 'deepseek') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      }));
      if (!currentConfig.apiKey) setIsEditingKey(true);
    } else if (preset === 'openai') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      }));
      if (!currentConfig.apiKey) setIsEditingKey(true);
    } else if (preset === 'ollama') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: '本地 Ollama',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: '',
        model: 'qwen2.5:7b',
      }));
      setIsEditingKey(false);
    }
    setTestResult(null);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await AIService.testConnection(currentConfig);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    if (!currentConfig.baseUrl.trim() || !currentConfig.model.trim()) {
      alert('请填写完整的 Base URL 和模型名称');
      return;
    }

    const existingIndex = providerConfigs.findIndex((c) => c.id === currentConfig.id);
    const nextConfigs = [...providerConfigs];
    if (existingIndex >= 0) {
      nextConfigs[existingIndex] = currentConfig;
    } else {
      nextConfigs.push(currentConfig);
    }

    setProviderConfigs(nextConfigs);
    setActiveConfigId(currentConfig.id);
    setFoxEarState('ready');
    setIsSettingsOpen(false);
  };

  // Custom Prompt Action Form Handlers
  const handleOpenAddAction = () => {
    setEditingActionId(null);
    setActionLabel('');
    setActionPrompt('');
    setActionIcon('Sparkles');
    setIsActionFormOpen(true);
  };

  const handleEditAction = (action: PromptAction) => {
    setEditingActionId(action.id);
    setActionLabel(action.label);
    setActionPrompt(action.prompt);
    setActionIcon(action.icon || 'Sparkles');
    setIsActionFormOpen(true);
  };

  const handleSaveActionForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanLabel = actionLabel.trim();
    const cleanPrompt = actionPrompt.trim();
    if (!cleanLabel || !cleanPrompt) return;

    if (editingActionId) {
      updatePromptAction(editingActionId, {
        label: cleanLabel,
        prompt: cleanPrompt,
        icon: actionIcon,
      });
    } else {
      addPromptAction({
        label: cleanLabel,
        prompt: cleanPrompt,
        icon: actionIcon,
        enabled: true,
      });
    }

    setIsActionFormOpen(false);
    setEditingActionId(null);
    setActionLabel('');
    setActionPrompt('');
  };

  const handleAddQuickPreset = (preset: { label: string; icon: string; prompt: string }) => {
    addPromptAction({
      label: preset.label,
      icon: preset.icon,
      prompt: preset.prompt,
      enabled: true,
    });
  };

  const isSavedConfig = providerConfigs.some((c) => c.id === currentConfig.id);
  const hasSavedKey = Boolean(currentConfig.apiKey && currentConfig.apiKey.trim().length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none p-4">
      <div className="bg-white dark:bg-[#1C1C20] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden fox-pop-in">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              Fox 偏好设置
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-neutral-100 dark:border-neutral-800 px-5 bg-neutral-50/60 dark:bg-neutral-900/30 text-xs flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'model'
                ? 'border-fox-orange text-fox-darkOrange dark:text-fox-orange font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>AI 模型与服务</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actions')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'border-fox-orange text-fox-darkOrange dark:text-fox-orange font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>划选指令预设 ({promptActions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'general'
                ? 'border-fox-orange text-fox-darkOrange dark:text-fox-orange font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>外观与隐私</span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="p-5 space-y-4 text-xs text-neutral-700 dark:text-neutral-300 overflow-y-auto flex-1">
          {/* TAB 1: AI MODEL & ENDPOINT CONFIG */}
          {activeTab === 'model' && (
            <div className="space-y-4">
              {/* Saved configs selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                    已保存的模型配置：
                  </span>
                  <button
                    type="button"
                    onClick={handleAddNewConfig}
                    className="flex items-center gap-1 text-[11px] text-fox-darkOrange dark:text-fox-orange hover:underline font-medium"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新建配置</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {providerConfigs.map((cfg) => {
                    const isSelected = cfg.id === currentConfig.id;
                    const isActive = cfg.id === activeConfigId;
                    return (
                      <button
                        key={cfg.id}
                        type="button"
                        onClick={() => handleSelectSavedConfig(cfg)}
                        className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border-transparent shadow-sm'
                            : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span>{cfg.name || '未命名'}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="当前活跃" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* One-click quick presets */}
              <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">
                  一键填入常用提供商预设：
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('deepseek')}
                    className="flex-1 py-1.5 px-2 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    DeepSeek
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('openai')}
                    className="flex-1 py-1.5 px-2 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    OpenAI
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('ollama')}
                    className="flex-1 py-1.5 px-2 bg-neutral-50 dark:bg-neutral-800/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium transition-colors"
                  >
                    本地 Ollama (免 Key)
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    配置显示名称
                  </label>
                  <input
                    type="text"
                    value={currentConfig.name}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                    placeholder="例如：DeepSeek 默认"
                    className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-fox-orange dark:focus:border-fox-orange"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    API Base URL (OpenAI 兼容端点)
                  </label>
                  <input
                    type="text"
                    value={currentConfig.baseUrl}
                    onChange={(e) => setCurrentConfig({ ...currentConfig, baseUrl: e.target.value })}
                    placeholder="https://api.deepseek.com/v1"
                    className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono focus:outline-none focus:border-fox-orange dark:focus:border-fox-orange"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                        API Key
                      </label>
                      {isKeychainSupportedState ? (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                          title="在桌面端由 macOS Keychain / 系统凭据库加密安全托管"
                        >
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span>钥匙串保护</span>
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700"
                          title="Web 模式下保存在浏览器本地隔离沙箱"
                        >
                          <Lock className="w-3 h-3" />
                          <span>本地沙箱</span>
                        </span>
                      )}
                    </div>
                    {hasSavedKey && !isEditingKey && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" />
                        <span>已安全就绪</span>
                      </span>
                    )}
                  </div>

                  {!isEditingKey && hasSavedKey ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-1.5 bg-neutral-100/80 dark:bg-neutral-800/70 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono text-neutral-600 dark:text-neutral-300 flex items-center justify-between">
                        <span>{formatMaskedApiKey(currentConfig.apiKey)}</span>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 select-none">
                          脱敏占位
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingKey(true);
                          setCurrentConfig({ ...currentConfig, apiKey: '' });
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-fox-darkOrange dark:text-fox-orange hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-lg border border-orange-200 dark:border-orange-800/60 transition-colors font-medium"
                        title="清空并重新输入新的 API Key"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>更换密钥</span>
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={currentConfig.apiKey}
                          onChange={(e) => setCurrentConfig({ ...currentConfig, apiKey: e.target.value })}
                          placeholder="sk-..."
                          className="w-full pl-3 pr-8 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono focus:outline-none focus:border-fox-orange dark:focus:border-fox-orange"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                        >
                          {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {hasSavedKey && (
                        <div className="mt-1 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const original = providerConfigs.find((c) => c.id === currentConfig.id);
                              if (original) {
                                setCurrentConfig({ ...currentConfig, apiKey: original.apiKey });
                                setIsEditingKey(false);
                              }
                            }}
                            className="text-[10px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 underline"
                          >
                            取消更换（保留原密钥）
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      模型名称 (Model)
                    </label>
                    <input
                      type="text"
                      value={currentConfig.model}
                      onChange={(e) => setCurrentConfig({ ...currentConfig, model: e.target.value })}
                      placeholder="deepseek-chat"
                      className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono focus:outline-none focus:border-fox-orange dark:focus:border-fox-orange"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      上下文预算 (Tokens)
                    </label>
                    <input
                      type="number"
                      step={1024}
                      min={2048}
                      max={128000}
                      value={currentConfig.contextBudget}
                      onChange={(e) =>
                        setCurrentConfig({
                          ...currentConfig,
                          contextBudget: Number(e.target.value) || 8192,
                        })
                      }
                      className="w-full px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-mono focus:outline-none focus:border-fox-orange dark:focus:border-fox-orange"
                    />
                  </div>
                </div>

                {isSavedConfig && (
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleDeleteCurrentConfig}
                      className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 hover:underline"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>删除此配置</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Test feedback banner */}
              {testResult && (
                <div
                  className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                  }`}
                >
                  {testResult.success ? (
                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500 dark:text-red-400" />
                  )}
                  <div className="flex-1 break-all">{testResult.message}</div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROMPT ACTIONS PRESETS (TASK 6) */}
          {activeTab === 'actions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-100 block">
                    划选伴读工具条指令
                  </span>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    选中正文时浮现的伴读指令。支持自由增删、修改提示词与控制显示开关。
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={resetPromptActions}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] rounded text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                    title="恢复内置默认 4 套伴读指令"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>恢复默认</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAddAction}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-fox-orange text-white hover:bg-fox-darkOrange transition-colors shadow-sm"
                  >
                    <Plus className="w-3 h-3" />
                    <span>新建指令</span>
                  </button>
                </div>
              </div>

              {/* Quick Preset Recommendations */}
              <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-200/60 dark:border-orange-900/40">
                <span className="text-[10px] font-semibold text-fox-darkOrange dark:text-fox-orange mb-1.5 block">
                  💡 常用指令灵感推荐（点击一键添加）：
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_ACTION_PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleAddQuickPreset(p)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white dark:bg-neutral-800 border border-orange-200 dark:border-orange-800/80 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-orange-100/60 dark:hover:bg-orange-900/40 transition-colors"
                      title={p.prompt}
                    >
                      {renderActionIcon(p.icon, 'w-3 h-3')}
                      <span>+ {p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Add / Edit Form Card */}
              {isActionFormOpen && (
                <form
                  onSubmit={handleSaveActionForm}
                  className="p-3.5 rounded-xl border border-fox-orange/80 bg-neutral-50 dark:bg-neutral-800/80 space-y-3 fox-pop-in shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-neutral-800 dark:text-neutral-100">
                      {editingActionId ? '编辑伴读指令' : '新建伴读指令'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsActionFormOpen(false)}
                      className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        指令名称 (Button Label)
                      </label>
                      <input
                        type="text"
                        value={actionLabel}
                        onChange={(e) => setActionLabel(e.target.value)}
                        placeholder="例如：翻译 / 总结"
                        maxLength={8}
                        required
                        className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-fox-orange"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        图标选择
                      </label>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {AVAILABLE_ACTION_ICONS.map((ic) => (
                          <button
                            key={ic.name}
                            type="button"
                            onClick={() => setActionIcon(ic.name)}
                            className={`p-1.5 rounded-md border transition-colors ${
                              actionIcon === ic.name
                                ? 'bg-orange-100 dark:bg-orange-950/80 border-fox-orange'
                                : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                            title={ic.label}
                          >
                            {renderActionIcon(ic.name, 'w-3.5 h-3.5')}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      发送给 AI 的指令模板 (Prompt)
                    </label>
                    <textarea
                      value={actionPrompt}
                      onChange={(e) => setActionPrompt(e.target.value)}
                      rows={3}
                      placeholder="例如：请将选中的内容翻译为地道流利的中文，并附带专业术语对照。"
                      required
                      className="w-full px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs focus:outline-none focus:border-fox-orange leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsActionFormOpen(false)}
                      className="px-3 py-1 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      className="px-3.5 py-1 text-xs font-medium bg-fox-orange hover:bg-fox-darkOrange text-white rounded-lg transition-colors"
                    >
                      保存指令
                    </button>
                  </div>
                </form>
              )}

              {/* Action List */}
              <div className="space-y-2">
                {promptActions.map((action) => {
                  const isEnabled = action.enabled !== false;
                  return (
                    <div
                      key={action.id}
                      className={`p-2.5 rounded-xl border transition-colors flex items-center justify-between gap-3 ${
                        isEnabled
                          ? 'bg-neutral-50/80 dark:bg-neutral-800/40 border-neutral-200 dark:border-neutral-700'
                          : 'bg-neutral-100/50 dark:bg-neutral-900/30 border-neutral-200/50 dark:border-neutral-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-neutral-200/60 dark:bg-neutral-700/60 shrink-0">
                          {renderActionIcon(action.icon, 'w-4 h-4')}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                              {action.label}
                            </span>
                            {action.builtin ? (
                              <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1 rounded">
                                内置
                              </span>
                            ) : (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-1 rounded">
                                自定义
                              </span>
                            )}
                          </div>
                          <p
                            className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 truncate max-w-[280px]"
                            title={action.prompt}
                          >
                            {action.prompt}
                          </p>
                        </div>
                      </div>

                      {/* Right controls: Switch, Edit, Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          onClick={() => updatePromptAction(action.id, { enabled: !isEnabled })}
                          className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isEnabled ? 'bg-fox-orange' : 'bg-neutral-300 dark:bg-neutral-700'
                          }`}
                          title={isEnabled ? '已在划选工具栏显示（点击隐藏）' : '已隐藏（点击显示）'}
                        >
                          <span
                            className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              isEnabled ? 'translate-x-3' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditAction(action)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                          title="编辑提示词或名称"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {!action.builtin && (
                          <button
                            type="button"
                            onClick={() => deletePromptAction(action.id)}
                            className="p-1 text-neutral-400 hover:text-red-500 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                            title="删除自定义指令"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: APPEARANCE & PRIVACY */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Theme Mode Selector */}
              <div>
                <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">
                  外观主题模式：
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      theme === 'system'
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-fox-orange text-fox-darkOrange dark:text-fox-orange font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>跟随系统</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      theme === 'light'
                        ? 'bg-orange-50 border-fox-orange text-fox-darkOrange font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>浅色模式</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition-colors ${
                      theme === 'dark'
                        ? 'bg-orange-950/40 border-fox-orange text-fox-orange font-semibold'
                        : 'bg-neutral-50 dark:bg-neutral-800/60 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-orange-400" />
                    <span>深色模式</span>
                  </button>
                </div>
              </div>

              {/* Reduce motion toggle */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
                    <span>减少动画与动态干扰 (Reduce Motion)</span>
                  </label>
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                    开启后停用狐狸呼吸动效，并禁用文档平滑滚动过渡。
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={reduceMotion}
                  onClick={() => setReduceMotion(!reduceMotion)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    reduceMotion ? 'bg-fox-orange' : 'bg-neutral-300 dark:bg-neutral-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      reduceMotion ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Remote image privacy & trusted domains (Planning Sec 4.2 & 7.2) */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                    受信任的外链图片域名
                  </span>
                  {trustedImageDomains.length > 0 && (
                    <button
                      type="button"
                      onClick={clearTrustedImageDomains}
                      className="text-[10px] text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      清空列表
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-2 leading-relaxed">
                  为防范图片信标（Image Beacon）隐式探测 IP 与阅读行为，未信任域名的远程图片默认需手动确认加载。
                </p>
                {trustedImageDomains.length === 0 ? (
                  <div className="text-[11px] text-neutral-400 dark:text-neutral-500 italic bg-neutral-50 dark:bg-neutral-800/40 p-2 rounded-md">
                    当前无信任域名。在阅读文档时点击拦截占位条上的“信任域名”即可添加。
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {trustedImageDomains.map((domain) => (
                      <span
                        key={domain}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                      >
                        <span>{domain}</span>
                        <button
                          type="button"
                          onClick={() => untrustImageDomain(domain)}
                          className="text-neutral-400 hover:text-red-500 transition-colors ml-0.5"
                          title={`取消信任 ${domain}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Security transparency note (Planning Sec 7.2) */}
        <div className="px-5 py-2.5 bg-neutral-100/70 dark:bg-neutral-900/50 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400 leading-relaxed flex items-center gap-1.5 flex-shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>
            {isKeychainSupportedState ? (
              <>
                <strong>安全保障</strong>：桌面模式已启用<strong>系统原生钥匙串托管（macOS Keychain / OS Vault）</strong>，API Key 真正脱离网页存储层；请求直连指定服务端点。
              </>
            ) : (
              <>
                <strong>隐私说明</strong>：当前处于网页/沙箱环境，API Key 存放于本地浏览器隔离沙箱；桌面端可使用独立安装包以享受系统钥匙串硬件级安全托管。
              </>
            )}
          </span>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-[#151518] border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
          {activeTab === 'model' ? (
            <>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {testing ? '正在测试…' : '测试连接'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-3.5 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs font-medium bg-fox-orange hover:bg-fox-darkOrange text-white rounded-lg transition-colors"
                >
                  保存并使用
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-1.5 text-xs font-medium bg-fox-orange hover:bg-fox-darkOrange text-white rounded-lg transition-colors"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
