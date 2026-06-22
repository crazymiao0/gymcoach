import {
  LlmError,
  type LlmCompletionRequest,
  type LlmCompletionResult,
  type LlmProvider,
} from './types';

const DEFAULT_MODEL = 'deepseek-chat';
const DEFAULT_MAX_TOKENS = 6000;

interface DeepSeekResponse {
  model?: string;
  choices?: Array<{ message?: { role: string; content: string } }>;
  error?: { message: string };
}

export function extractDeepSeekDelta(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('data:')) return null;
  const payload = trimmed.slice(5).trim();
  if (payload === '' || payload === '[DONE]') return null;
  try {
    const json = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    return json.choices?.[0]?.delta?.content ?? null;
  } catch {
    return null;
  }
}

export class DeepSeekProvider implements LlmProvider {
  readonly id = 'deepseek' as const;
  readonly label = 'DeepSeek';
  readonly apiKeyEnvVar = 'DEEPSEEK_API_KEY';
  readonly model: string;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.model = process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_MODEL;
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private buildRequestBody(req: LlmCompletionRequest, stream = false) {
    return {
      model: this.model,
      messages: [
        { role: 'system', content: req.system },
        ...req.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      ...(req.temperature != null ? { temperature: req.temperature } : {}),
      max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
      stream,
    };
  }

  private async post(body: unknown): Promise<Response> {
    try {
      return await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new LlmError(
        502,
        `DeepSeek network error: ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  async complete(req: LlmCompletionRequest): Promise<LlmCompletionResult> {
    if (!this.apiKey) throw new LlmError(503, '请在 .env 中设置 DEEPSEEK_API_KEY');

    const res = await this.post(this.buildRequestBody(req));
    if (!res.ok) {
      const text = await res.text();
      throw new LlmError(res.status, `DeepSeek ${res.status}: ${text.slice(0, 500)}`);
    }

    const json = (await res.json()) as DeepSeekResponse;
    if (json.error) throw new LlmError(502, `DeepSeek: ${json.error.message}`);
    const text = json.choices?.[0]?.message?.content?.trim();
    if (!text) throw new LlmError(502, 'AI 教练返回了空回复');
    return { text, modelUsed: json.model ?? this.model };
  }

  async *stream(req: LlmCompletionRequest): AsyncIterable<string> {
    if (!this.apiKey) throw new LlmError(503, '请在 .env 中设置 DEEPSEEK_API_KEY');

    const res = await this.post(this.buildRequestBody(req, true));
    if (!res.ok) {
      const text = await res.text();
      throw new LlmError(res.status, `DeepSeek ${res.status}: ${text.slice(0, 500)}`);
    }
    if (!res.body) throw new LlmError(502, 'DeepSeek 返回了空响应体');

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const delta = extractDeepSeekDelta(line);
        if (delta) yield delta;
      }
    }
    const tail = extractDeepSeekDelta(buffer);
    if (tail) yield tail;
  }
}
