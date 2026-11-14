import { ProviderConfig, SelectionContext, ChatMessage } from '../types';

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

  public static async streamChat({
    config,
    messages,
    quote,
    onChunk,
    onFinish,
    onError,
  }: {
    config: ProviderConfig;
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

      // Assemble system & user prompts with context
      const apiMessages: Array<{ role: string; content: string }> = [
        {
          role: 'system',
          content: '你是 Fox，一位安静、友好且洞察深刻的 Markdown 伴读助手。你的任务是基于读者选中的文档内容提供清晰、简明、有针对性的解释或回答。',
        },
      ];

      // Convert chat history
      for (const m of messages) {
        if (m.status === 'error') continue;
        if (m.role === 'user' && m.quote) {
          apiMessages.push({
            role: 'user',
            content: `【参考文档选区】:\n"""\n${m.quote.text}\n"""\n\n【读者提问】:\n${m.content}`,
          });
        } else {
          apiMessages.push({
            role: m.role,
            content: m.content,
          });
        }
      }

      // If there is an active new quote for the last question not yet formatted
      const lastMsg = messages[messages.length - 1];
      if (quote && lastMsg && lastMsg.role === 'user' && !lastMsg.quote) {
        apiMessages[apiMessages.length - 1].content = `【参考文档选区】:\n"""\n${quote.text}\n"""\n\n【读者提问】:\n${lastMsg.content}`;
      }

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
        // User voluntarily stopped generation
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
