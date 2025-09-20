import { AbstractProviderAdapter } from './abstract-provider';
import { ProviderType, SupportedFeatures } from '@/models/AIProvider';
import { ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, ProviderHealth } from './base-provider';

export class OpenAIProviderAdapter extends AbstractProviderAdapter {
  readonly type: ProviderType = 'openai';
  readonly supportedFeatures: SupportedFeatures[] = ['chat', 'embeddings', 'image-generation', 'vision', 'function-calling', 'streaming'];

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const openaiRequest = {
      model: request.model,
      messages: this.transformMessages(request.messages),
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens,
      stream: false,
      functions: request.functions,
      function_call: request.function_call,
    };

    const response = await this.makeRequest<any>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(openaiRequest),
    });

    return this.transformChatResponse(response);
  }

  async *chatStream(request: ChatRequest): AsyncGenerator<ChatResponse> {
    const openaiRequest = {
      model: request.model,
      messages: this.transformMessages(request.messages),
      temperature: request.temperature || 0.7,
      max_tokens: request.max_tokens,
      stream: true,
      functions: request.functions,
      function_call: request.function_call,
    };

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(openaiRequest),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
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
    const openaiRequest = {
      model: request.model,
      input: request.input,
      user: request.user,
    };

    const response = await this.makeRequest<any>('/embeddings', {
      method: 'POST',
      body: JSON.stringify(openaiRequest),
    });

    return this.transformEmbeddingResponse(response);
  }

  async healthCheck(): Promise<ProviderHealth> {
    const startTime = Date.now();

    try {
      const response = await this.makeRequest<any>('/models', {
        method: 'GET',
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
    try {
      const response = await this.makeRequest<any>('/models', {
        method: 'GET',
      });

      return response.data
        .filter((model: any) => model.id.includes('gpt'))
        .map((model: any) => model.id);
    } catch (error) {
      console.error('Error fetching OpenAI models:', error);
      return ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'];
    }
  }

  protected transformMessages(messages: ChatRequest['messages']): any[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
      function_call: msg.function_call,
    }));
  }

  protected transformChatResponse(response: any): ChatResponse {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices.map((choice: any) => ({
        index: choice.index,
        message: {
          role: choice.message.role,
          content: choice.message.content,
          function_call: choice.message.function_call,
        },
        finish_reason: choice.finish_reason,
      })),
      usage: response.usage,
    };
  }

  protected transformEmbeddingResponse(response: any): EmbeddingResponse {
    return {
      object: response.object,
      data: response.data.map((item: any, index: number) => ({
        object: item.object,
        embedding: item.embedding,
        index,
      })),
      model: response.model,
      usage: response.usage,
    };
  }
}