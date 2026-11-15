import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, Loader2, KeyRound, Sparkles } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { ProviderConfig } from '../types';
import { AIService } from '../services/aiService';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    providerConfigs,
    activeConfigId,
    setProviderConfigs,
    setActiveConfigId,
    setFoxEarState,
    reduceMotion,
    setReduceMotion,
  } = useAppStore();

  const [currentConfig, setCurrentConfig] = useState<ProviderConfig>({
    id: `cfg_${Date.now()}`,
    name: '我的 AI 服务',
    baseUrl: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    contextBudget: 8192,
  });

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isSettingsOpen) {
      const active = providerConfigs.find((c) => c.id === activeConfigId);
      if (active) {
        setCurrentConfig({ ...active });
      } else if (providerConfigs.length > 0) {
        setCurrentConfig({ ...providerConfigs[0] });
      }
      setTestResult(null);
    }
  }, [isSettingsOpen, activeConfigId, providerConfigs]);

  if (!isSettingsOpen) return null;

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
    let nextConfigs = [...providerConfigs];
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs select-none p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-fox-orange" />
            <h3 className="text-sm font-semibold text-neutral-800">配置自定义 AI 服务</h3>
          </div>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-neutral-700">
          {/* Quick presets */}
          <div>
            <span className="text-[11px] font-medium text-neutral-500 mb-1.5 block">快捷填充预设：</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => applyPreset('deepseek')}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 font-medium transition-colors"
              >
                DeepSeek
              </button>
              <button
                type="button"
                onClick={() => applyPreset('openai')}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 font-medium transition-colors"
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => applyPreset('ollama')}
                className="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 rounded text-neutral-700 font-medium transition-colors"
              >
                本地 Ollama (免 Key)
              </button>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                配置名称
              </label>
              <input
                type="text"
                value={currentConfig.name}
                onChange={(e) => setCurrentConfig({ ...currentConfig, name: e.target.value })}
                placeholder="例如：DeepSeek V3"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                Base URL
              </label>
              <input
                type="text"
                value={currentConfig.baseUrl}
                onChange={(e) => setCurrentConfig({ ...currentConfig, baseUrl: e.target.value })}
                placeholder="https://api.example.com/v1"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={currentConfig.apiKey}
                onChange={(e) => setCurrentConfig({ ...currentConfig, apiKey: e.target.value })}
                placeholder="sk-..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                本地服务（如 Ollama）可留空；密钥仅保存在本地设备，直连目标服务。
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 mb-1">
                模型名称
              </label>
              <input
                type="text"
                value={currentConfig.model}
                onChange={(e) => setCurrentConfig({ ...currentConfig, model: e.target.value })}
                placeholder="例如：deepseek-chat 或 gpt-4o-mini"
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-neutral-600">
                  上下文预算 (Tokens)
                </label>
                <span className="text-[10px] text-neutral-400">
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
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-fox-orange text-xs bg-neutral-50"
              />
              <span className="text-[10px] text-neutral-400 mt-1 block">
                用于估算单次发送最大规模，超限时应用主动提醒调整，不静默截断。
              </span>
            </div>
          </div>

          {/* Accessibility / Motion preferences (Planning doc 5.5) */}
          <div className="pt-3 border-t border-neutral-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-[11px] font-medium text-neutral-700 flex items-center gap-1.5 cursor-pointer" onClick={() => setReduceMotion(!reduceMotion)}>
                  <Sparkles className="w-3.5 h-3.5 text-fox-orange" />
                  <span>减少动画与动态干扰 (Reduce Motion)</span>
                </label>
                <p className="text-[10px] text-neutral-400 mt-0.5">
                  开启后停用狐狸呼吸/弹跳动画，禁用长文档滚动过渡，专为注重极简与低能耗设计。
                </p>
              </div>

              {/* iOS style toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={reduceMotion}
                onClick={() => setReduceMotion(!reduceMotion)}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  reduceMotion ? 'bg-fox-orange' : 'bg-neutral-300'
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
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {testResult.success ? (
                <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              )}
              <div className="flex-1 break-all">{testResult.message}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-200 bg-white border border-neutral-300 rounded-lg transition-colors disabled:opacity-50"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            {testing ? '正在测试…' : '测试连接'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-3.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-medium bg-fox-orange hover:bg-fox-darkOrange text-white rounded-lg transition-colors"
            >
              保存配置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
