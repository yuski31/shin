import { AbstractProviderAdapter } from './abstract-provider';
import { ProviderType, SupportedFeatures } from '@/models/AIProvider';
import { ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ProviderHealth } from './base-provider';

export class AnthropicProviderAdapter extends AbstractProviderAdapter {
  readonly type: ProviderType = 'anthropic';
  readonly supportedFeatures: SupportedFeatures[] = ['chat', 'streaming'];

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const anthropicRequest = {
      model: request.model,
      messages: this.transformMessages(request.messages),
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature || 0.7,
      stream: false,
      system: this.extractSystemMessage(request.messages),
    };

    const response = await this.makeRequest<any>('/messages', {
      method: 'POST',
      body: JSON.stringify(anthropicRequest),
    });

    return this.transformChatResponse(response);
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    const anthropicRequest = {
      model: request.model,
      messages: this.transformMessages(request.messages),
      max_tokens: request.max_tokens || 4096,
      temperature: request.temperature || 0.7,
      stream: true,
      system: this.extractSystemMessage(request.messages),
    };

    const response = await fetch(`${this.config.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicRequest),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const stream = response.body;
    if (!stream) {
      throw new Error('No response stream available');
    }

    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'message_stop') return;
              yield this.transformChatResponse(parsed);
            } catch (e) {
              // Ignore parsing errors for non-JSON lines
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async embeddings(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    // Anthropic doesn't have embeddings API, throw error
    throw new Error('Anthropic does not support embeddings');
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest<any>('/messages', {
        method: 'POST',
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
          stream: false,
        }),
      });

      const responseTime = Date.now() - startTime;

      return {
        isHealthy: true,
        responseTime,
        timestamp: new Date(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Return known Anthropic models
    return [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
      'claude-instant-1.2'
    ];
  }

  protected transformMessages(messages: ChatRequest['messages']): any[] {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content,
      }));
  }

  protected extractSystemMessage(messages: ChatRequest['messages']): string | undefined {
    const systemMessage = messages.find(msg => msg.role === 'system');
    return systemMessage?.content;
  }

  protected transformChatResponse(response: any): ChatResponse {
    return {
      id: response.id || `anthropic-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content[0]?.text || '',
        },
        finish_reason: response.stop_reason || 'stop',
      }],
      usage: response.usage || {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }

  protected transformEmbeddingResponse(response: any): EmbeddingResponse {
    throw new Error('Anthropic does not support embeddings');
  }
}