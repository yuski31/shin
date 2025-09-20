import { IProviderAdapter, IProviderFactory, ProviderConfig } from './base-provider';
import { ProviderType } from '@/models/AIProvider';
import { OpenAIProviderAdapter } from './openai-provider';
import { AnthropicProviderAdapter } from './anthropic-provider';
import { GoogleProviderAdapter } from './google-provider';
import { CohereProviderAdapter } from './cohere-provider';
import { HuggingFaceProviderAdapter } from './huggingface-provider';
import { ReplicateProviderAdapter } from './replicate-provider';
import { TogetherProviderAdapter } from './together-provider';
import { CustomProviderAdapter } from './custom-provider';

export class ProviderFactory implements IProviderFactory {
  private static instance: ProviderFactory;
  private adapters: Map<ProviderType, new (config: ProviderConfig) => IProviderAdapter> = new Map();

  private constructor() {
    this.registerDefaultAdapters();
  }

  static getInstance(): ProviderFactory {
    if (!ProviderFactory.instance) {
      ProviderFactory.instance = new ProviderFactory();
    }
    return ProviderFactory.instance;
  }

  private registerDefaultAdapters(): void {
    this.adapters.set('openai', OpenAIProviderAdapter);
    this.adapters.set('anthropic', AnthropicProviderAdapter);
    this.adapters.set('google', GoogleProviderAdapter);
    this.adapters.set('cohere', CohereProviderAdapter);
    this.adapters.set('huggingface', HuggingFaceProviderAdapter);
    this.adapters.set('replicate', ReplicateProviderAdapter);
    this.adapters.set('together', TogetherProviderAdapter);
    this.adapters.set('custom', CustomProviderAdapter);
  }

  createProvider(config: ProviderConfig, providerDoc: any): IProviderAdapter {
    const AdapterClass = this.adapters.get(providerDoc.type);

    if (!AdapterClass) {
      throw new Error(`No adapter found for provider type: ${providerDoc.type}`);
    }

    return new AdapterClass(config);
  }

  getSupportedTypes(): ProviderType[] {
    return Array.from(this.adapters.keys());
  }

  validateConfig(type: ProviderType, config: Partial<ProviderConfig>): boolean {
    if (!this.adapters.has(type)) {
      return false;
    }

    // Basic validation - can be extended per provider type
    return !!(config.baseUrl && config.apiKey);
  }

  registerAdapter(type: ProviderType, adapterClass: new (config: ProviderConfig) => IProviderAdapter): void {
    this.adapters.set(type, adapterClass);
  }

  unregisterAdapter(type: ProviderType): boolean {
    return this.adapters.delete(type);
  }
}

// Export singleton instance
export const providerFactory = ProviderFactory.getInstance();