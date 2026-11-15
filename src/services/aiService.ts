import { ProviderConfig, SelectionContext, ChatMessage } from '../types';
import { estimateTokens } from '../utils/contextExtractor';

export interface PromptPreviewInfo {
  systemPrompt: string;
  assembledUserMessage: string;
  historyCount: number;
  estimatedTokens: number;
  documentTitle: string;
  budget: number;
  isOverBudget: boolean;
  budgetPercentage: number;
  systemTokens: number;
  userTokens: number;
  historyTokens: number;
}

export class AIService {
  private static activeAbortController: AbortController | null = null;

  public static formatBaseUrl(baseUrl: string): string {
    let clean = baseUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/chat/completions')) {
      clean = `${clean}/chat/completions`;
    }
    return clean;
  }

  public static stopGenerating(): void {
    if (this.activeAbortController) {
      this.activeAbortController.abort();
      this.activeAbortController = null;
    }
  }

  public static async testConnection(config: ProviderConfig): Promise<{ success: boolean; message: string }> {
    try {
      const url = this.formatBaseUrl(config.baseUrl);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({
          model: config.model.trim(),
          messages: [{ role: 'user', content: 'Hi' }],
          max_tokens: 5,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `HTTP ${res.status}: ${text.slice(0, 200)}` };
      }

      return { success: true, message: '连接成功，服务正常可用！' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { success: false, message: `网络异常: ${message}` };
    }
  }

  /**
   * Generates a preview of the prompt payload and conservative token count with budget breakdown
   */
  public static assemblePromptPreview({
    documentName,
    quote,
    userQuestion,
    history,
    budget = 4096,
  }: {
    documentName: string;
    quote?: SelectionContext | null;
    userQuestion: string;
    history: ChatMessage[];
    budget?: number;
  }): PromptPreviewInfo {
    const systemPrompt =
      '你是 Fox，一位安静、友好且洞察深刻的 Markdown 伴读助手。你的任务是基于读者选中的文档内容提供清晰、简明、有针对性的解释或回答。请优先根据提供的选区及其所属章节回答，对于推论需说明依据。';

    let assembled = '';
    if (quote) {
      assembled += `【参考文档】: 《${documentName}》\n`;
      if (quote.headingPath) {
        assembled += `【章节导航】: ${quote.headingPath}\n`;
      }
      assembled += `【选区原文】:\n"""\n${quote.text}\n"""\n`;
      if (quote.surroundingContext) {
        assembled += `\n【邻近段落上下文】:\n${quote.surroundingContext}\n`;
      }
      assembled += `\n【读者提问】:\n${userQuestion || '请解释这段内容的核心含义及背景。'}`;
    } else {
      assembled = `【参考文档】: 《${documentName}》\n【读者提问】:\n${userQuestion}`;
    }

    const systemTokens = estimateTokens(systemPrompt);
    const userTokens = estimateTokens(assembled);

    let historyTokens = 0;
    history.forEach((m) => {
      historyTokens += estimateTokens(m.content);
    });

    const totalEstimated = systemTokens + userTokens + historyTokens;
    const safeBudget = budget > 0 ? budget : 4096;
    const percentage = Math.min(100, Math.round((totalEstimated / safeBudget) * 100));

    return {
      systemPrompt,
      assembledUserMessage: assembled,
      historyCount: history.length,
      estimatedTokens: totalEstimated,
      documentTitle: documentName,
      budget: safeBudget,
      isOverBudget: totalEstimated > safeBudget,
      budgetPercentage: percentage,
      systemTokens,
      userTokens,
      historyTokens,
    };
  }

  public static async streamChat({
    config,
    documentName = '当前文档',
    messages,
    quote,
    onChunk,
    onFinish,
    onError,
  }: {
    config: ProviderConfig;
    documentName?: string;
    messages: ChatMessage[];
    quote?: SelectionContext;
    onChunk: (delta: string) => void;
    onFinish: () => void;
    onError: (error: string) => void;
  }): Promise<void> {
    this.stopGenerating();
    const controller = new AbortController();
    this.activeAbortController = controller;

    try {
      const url = this.formatBaseUrl(config.baseUrl);

      const systemPrompt =
        '你是 Fox，一位安静、友好且洞察深刻的 Markdown 伴读助手。你的任务是基于读者选中的文档内容提供清晰、简明、有针对性的解释或回答。请优先根据提供的选区及其所属章节回答。';

      const apiMessages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: systemPrompt,
        },
      ];

      // Convert chat history
      for (let i = 0; i < messages.length - 1; i++) {
        const m = messages[i];
        if (m.status === 'error') continue;
        if (m.role === 'user' && m.quote) {
          let content = `【选区原文】:\n"""\n${m.quote.text}\n"""\n`;
          if (m.quote.headingPath) {
            content = `【章节层级】: ${m.quote.headingPath}\n` + content;
          }
          content += `\n【读者提问】:\n${m.content}`;
          apiMessages.push({ role: 'user', content });
        } else {
          apiMessages.push({ role: m.role, content: m.content });
        }
      }

      // Last user question
      const lastMsg = messages[messages.length - 1];
      const activeQuote = quote || lastMsg?.quote;

      let lastContent = '';
      if (activeQuote) {
        lastContent += `【参考文档】: 《${documentName}》\n`;
        if (activeQuote.headingPath) {
          lastContent += `【章节导航】: ${activeQuote.headingPath}\n`;
        }
        lastContent += `【选区原文】:\n"""\n${activeQuote.text}\n"""\n`;
        if (activeQuote.surroundingContext) {
          lastContent += `\n【邻近段落参考】:\n${activeQuote.surroundingContext}\n`;
        }
        lastContent += `\n【读者提问】:\n${lastMsg?.content || '请解释这段内容。'}`;
      } else {
        lastContent = `【参考文档】: 《${documentName}》\n【读者提问】:\n${lastMsg?.content || ''}`;
      }

      apiMessages.push({ role: 'user', content: lastContent });

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({
          model: config.model.trim(),
          messages: apiMessages,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        let errMsg = `服务返回错误 (${res.status})`;
        if (res.status === 401) errMsg = '鉴权失败：API Key 无效或未授权。';
        else if (res.status === 404) errMsg = `模型不存在或地址错误：[${config.model}] 未找到。`;
        else if (res.status === 429) errMsg = '请求受限：触发模型服务调用频率或配额上限。';
        else if (errorText) errMsg += `: ${errorText.slice(0, 150)}`;
        onError(errMsg);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError('未能获取响应数据流。');
        return;
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed === 'data: [DONE]') {
            onFinish();
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta?.content || '';
              if (delta) {
                onChunk(delta);
              }
            } catch {
              // Ignore partial JSON parses
            }
          }
        }
      }

      onFinish();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        onFinish();
        return;
      }
      const message = err instanceof Error ? err.message : String(err);
      onError(`请求中断或网络错误: ${message}`);
    } finally {
      if (this.activeAbortController === controller) {
        this.activeAbortController = null;
      }
    }
  }
}
