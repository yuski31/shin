// Stub implementation - will be fully implemented in the next step
import { AbstractProviderAdapter } from './abstract-provider';
import { ProviderType, SupportedFeatures } from '@/models/AIProvider';

export class CustomProviderAdapter extends AbstractProviderAdapter {
  readonly type: ProviderType = 'custom';
  readonly supportedFeatures: SupportedFeatures[] = ['chat'];

  async chat(request: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async embeddings(request: any): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async healthCheck(): Promise<any> {
    throw new Error('Not implemented yet');
  }

  async getAvailableModels(): Promise<string[]> {
    throw new Error('Not implemented yet');
  }

  protected transformMessages(messages: any[]): any[] {
    return messages;
  }

  protected transformChatResponse(response: any): any {
    return response;
  }

  protected transformEmbeddingResponse(response: any): any {
    return response;
  }
}