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
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ProviderConfig } from '../types';
import { AIService } from '../services/aiService';

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

  const [currentConfig, setCurrentConfig] = useState<ProviderConfig>(() => createBlankConfig(1));
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      const active = providerConfigs.find((c) => c.id === activeConfigId);
      if (active) {
        setCurrentConfig({ ...active });
      } else if (providerConfigs.length > 0) {
        setCurrentConfig({ ...providerConfigs[0] });
      } else {
        setCurrentConfig(createBlankConfig(1));
      }
      setTestResult(null);
    }
  }, [isSettingsOpen, activeConfigId, providerConfigs]);

  if (!isSettingsOpen) return null;

  const handleSelectSavedConfig = (cfg: ProviderConfig) => {
    setCurrentConfig({ ...cfg });
    setActiveConfigId(cfg.id);
    setTestResult(null);
  };

  const handleAddNewConfig = () => {
    const fresh = createBlankConfig(providerConfigs.length + 1);
    setCurrentConfig(fresh);
    setTestResult(null);
  };

  const handleDeleteCurrentConfig = () => {
    const next = providerConfigs.filter((c) => c.id !== currentConfig.id);
    setProviderConfigs(next);
    if (next.length > 0) {
      setCurrentConfig({ ...next[0] });
      setActiveConfigId(next[0].id);
    } else {
      setCurrentConfig(createBlankConfig(1));
    }
    setTestResult(null);
  };

  // Preset templates
  const applyPreset = (preset: 'deepseek' | 'openai' | 'ollama') => {
    if (preset === 'deepseek') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: 'DeepSeek',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
      }));
    } else if (preset === 'openai') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
      }));
    } else if (preset === 'ollama') {
      setCurrentConfig((prev) => ({
        ...prev,
        name: '本地 Ollama',
        baseUrl: 'http://localhost:11434/v1',
        apiKey: '',
        model: 'qwen2.5:7b',
      }));
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

  const isSavedConfig = providerConfigs.some((c) => c.id === currentConfig.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm select-none p-4">
      <div className="bg-white dark:bg-[#1C1C20] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden fox-pop-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
              设置与 AI 模型配置
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-700 dark:text-neutral-300 overflow-y-auto flex-1">
          {/* Theme Mode Selector (Dark / Light / System) */}
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

          <div className="border-t border-neutral-100 dark:border-neutral-800 pt-3">
            {/* Multi-config switcher bar */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                已保存配置列表：
              </span>
              <button
                type="button"
                onClick={handleAddNewConfig}
                className="flex items-center gap-1 text-[11px] text-fox-darkOrange dark:text-fox-orange hover:underline font-medium"
              >
                <Plus className="w-3 h-3" />
                新增配置
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {providerConfigs.map((cfg) => {
                const selected = cfg.id === currentConfig.id;
                return (
                  <button
                    key={cfg.id}
                    type="button"
                    onClick={() => handleSelectSavedConfig(cfg)}
                    className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors flex items-center gap-1 max-w-[160px] truncate ${
                      selected
                        ? 'bg-orange-50 dark:bg-orange-950/40 border-fox-orange text-fox-darkOrange dark:text-fox-orange font-semibold'
                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                    }`}
                  >
                    {cfg.id === activeConfigId && (
                      <Check className="w-3 h-3 text-fox-orange flex-shrink-0" />
                    )}
                    <span className="truncate">{cfg.name || cfg.model}</span>
                  </button>
                );
              })}
              {!isSavedConfig && (
                <span className="px-2.5 py-1 rounded-lg border border-dashed border-fox-orange bg-orange-50/50 dark:bg-orange-950/30 text-fox-darkOrange dark:text-fox-orange text-[11px] font-medium">
                  * 新配置（待保存）
                </span>
              )}
            </div>
          </div>

          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 block">
              快捷填充模板：
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('deepseek')}
                className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
              >
                DeepSeek
              </button>
              <button
                type="button"
                onClick={() => applyPreset('openai')}
                className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ollama')}
                className="px-2.5 py-1 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded text-neutral-700 dark:text-neutral-300 font-medium transition-colors"
              >
                本地 Ollama (免 Key)
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                  配置名称
                </label>
                <input
                  type="text"
                  value={currentConfig.name}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                  placeholder="例如：DeepSeek V3"
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 select-text"
                />
              </div>
              {isSavedConfig && providerConfigs.length > 1 && (
                <button
                  type="button"
                  onClick={handleDeleteCurrentConfig}
                  title="删除当前这套配置"
                  className="p-2 text-neutral-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Base URL
              </label>
              <input
                type="text"
                value={currentConfig.baseUrl}
                onChange={(e) => setCurrentConfig({ ...currentConfig, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 select-text"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  API Key
                </label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                  <ShieldCheck className="w-3 h-3" />
                  本地隔离存储 · 绝不外发
                </span>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={currentConfig.apiKey}
                  onChange={(e) => setCurrentConfig({ ...currentConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                  className="w-full pl-3 pr-9 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 select-text font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors p-0.5 rounded"
                  title={showApiKey ? '隐藏 API Key' : '显示完整 API Key'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 block">
                本地服务（如 Ollama）可留空；直连用户目标服务端点，绝无遥测或中间代理。
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                模型名称
              </label>
              <input
                type="text"
                value={currentConfig.model}
                onChange={(e) => setCurrentConfig({ ...currentConfig, model: e.target.value })}
                placeholder="例如：deepseek-chat 或 gpt-4o-mini"
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 select-text"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  上下文预算 (Tokens)
                </label>
                <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                  {currentConfig.contextBudget || 4096} Tokens
                </span>
              </div>
              <input
                type="number"
                min={1000}
                max={128000}
                step={1024}
                value={currentConfig.contextBudget || 4096}
                onChange={(e) =>
                  setCurrentConfig({
                    ...currentConfig,
                    contextBudget: parseInt(e.target.value, 10) || 4096,
                  })
                }
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100 select-text"
              />
              <span className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 block">
                用于估算单次发送最大规模，超限时主动提醒调整，不静默截断。
              </span>
            </div>
          </div>

          {/* Accessibility / Motion preferences */}
          <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between">
              <div>
                <label
                  className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer"
                  onClick={() => setReduceMotion(!reduceMotion)}
                >
                  <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
                  <span>减少动画与动态干扰 (Reduce Motion)</span>
                </label>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                  开启后停用狐狸呼吸动画，禁用平滑滚动过渡。
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

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-50 dark:bg-[#151518] border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-shrink-0">
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
        </div>
      </div>
    </div>
  );
};
