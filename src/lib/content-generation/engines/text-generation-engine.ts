import { BaseGenerationEngine, BaseEngineConfig } from '../base-engine';
import { ContentGenerationRequest, ContentGenerationResponse } from '../content-factory';
import { IContent } from '@/models/Content';
import Content from '@/models/Content';

// Text generation specific configuration
interface TextEngineConfig extends BaseEngineConfig {
  styleTransferEnabled: boolean;
  toneAdjustmentEnabled: boolean;
  plagiarismDetectionEnabled: boolean;
  factCheckingEnabled: boolean;
  seoOptimizationEnabled: boolean;
  multilingualEnabled: boolean;
  maxLength: number;
  minLength: number;
  supportedLanguages: string[];
  supportedStyles: string[];
  supportedTones: string[];
}

// Text generation result interface
interface TextGenerationResult {
  content: string;
  metadata: {
    wordCount: number;
    readingTime: number;
    language: string;
    style: string;
    tone: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    keywords: string[];
    seoScore: number;
    plagiarismScore: number;
    factCheckStatus: 'verified' | 'questionable' | 'unverified';
    processingTime: number;
    tokensUsed: number;
  };
}

export class TextGenerationEngine extends BaseGenerationEngine {
  readonly type = 'text';
  readonly supportedFormats = ['plain', 'markdown', 'html', 'json'];

  private config: TextEngineConfig;

  constructor() {
    const defaultConfig: TextEngineConfig = {
      defaultModel: 'gpt-4',
      supportedModels: ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'claude-3-sonnet'],
      providerType: 'openai',
      timeout: 60000,
      maxRetries: 3,
      enableCaching: true,
      cacheTTL: 3600000,
      rateLimits: {
        requestsPerMinute: 60,
        tokensPerMinute: 100000
      },
      styleTransferEnabled: true,
      toneAdjustmentEnabled: true,
      plagiarismDetectionEnabled: true,
      factCheckingEnabled: true,
      seoOptimizationEnabled: true,
      multilingualEnabled: true,
      maxLength: 10000,
      minLength: 10,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      supportedStyles: ['formal', 'casual', 'academic', 'business', 'creative', 'technical'],
      supportedTones: ['professional', 'friendly', 'authoritative', 'empathetic', 'persuasive', 'informative']
    };

    super('text', defaultConfig);

    this.config = defaultConfig;
  }

  async generate(request: ContentGenerationRequest): Promise<ContentGenerationResponse> {
    try {
      // Validate request
      const validation = await this.validateRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          status: 'failed',
          error: validation.error
        };
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimit(request.userId);
      if (!rateLimitCheck.allowed) {
        return {
          success: false,
          status: 'failed',
          error: 'Rate limit exceeded'
        };
      }

      // Generate content
      const result = await this.withRetry(async () => {
        return await this.performGeneration(request);
      });

      // Apply post-processing
      const processedResult = await this.postProcessContent(result, request);

      // Store in database
      const contentId = await this.storeContent(processedResult, request);

      // Record metrics
      await this.recordMetric('text_generation_success', 1, {
        userId: request.userId,
        model: request.parameters?.model || this.config.defaultModel,
        style: processedResult.metadata.style,
        tone: processedResult.metadata.tone
      });

      return {
        success: true,
        status: 'completed',
        contentId,
        result: processedResult.content,
        usage: {
          tokensUsed: processedResult.metadata.tokensUsed,
          cost: this.calculateCost(processedResult.metadata.tokensUsed),
          processingTime: processedResult.metadata.processingTime
        }
      };

    } catch (error) {
      await this.recordMetric('text_generation_error', 1, {
        userId: request.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.handleError(error);
    }
  }

  async validateRequest(request: ContentGenerationRequest): Promise<{ valid: boolean; error?: string }> {
    // Basic validation
    const basicValidation = this.validateBasicRequest(request);
    if (!basicValidation.valid) {
      return basicValidation;
    }

    // Text-specific validation
    if (request.prompt.length < this.config.minLength) {
      return { valid: false, error: `Prompt must be at least ${this.config.minLength} characters long` };
    }

    if (request.prompt.length > this.config.maxLength) {
      return { valid: false, error: `Prompt must be at most ${this.config.maxLength} characters long` };
    }

    // Validate style if provided
    if (request.parameters?.style && !this.config.supportedStyles.includes(request.parameters.style)) {
      return { valid: false, error: `Unsupported style: ${request.parameters.style}` };
    }

    // Validate tone if provided
    if (request.parameters?.tone && !this.config.supportedTones.includes(request.parameters.tone)) {
      return { valid: false, error: `Unsupported tone: ${request.parameters.tone}` };
    }

    // Validate language if provided
    if (request.parameters?.language && !this.config.supportedLanguages.includes(request.parameters.language)) {
      return { valid: false, error: `Unsupported language: ${request.parameters.language}` };
    }

    return { valid: true };
  }

  async estimateCost(request: ContentGenerationRequest): Promise<{ cost: number; tokens: number }> {
    const basicCost = this.estimateBasicCost(request);

    // Add cost for additional features
    let featureMultiplier = 1.0;

    if (this.config.styleTransferEnabled && request.parameters?.style) {
      featureMultiplier += 0.2;
    }

    if (this.config.toneAdjustmentEnabled && request.parameters?.tone) {
      featureMultiplier += 0.1;
    }

    if (this.config.plagiarismDetectionEnabled) {
      featureMultiplier += 0.1;
    }

    if (this.config.factCheckingEnabled) {
      featureMultiplier += 0.15;
    }

    if (this.config.seoOptimizationEnabled) {
      featureMultiplier += 0.1;
    }

    return {
      cost: basicCost.cost * featureMultiplier,
      tokens: basicCost.tokens
    };
  }

  private async performGeneration(request: ContentGenerationRequest): Promise<TextGenerationResult> {
    const startTime = Date.now();

    // Build system message based on requirements
    const systemMessage = await this.buildSystemMessage(request);

    // Build user prompt
    const userPrompt = await this.buildUserPrompt(request);

    // Call provider
    const response = await this.providerAdapter.chat({
      model: request.parameters?.model || (this.config as any).defaultModel,
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: userPrompt }
      ],
      temperature: request.parameters?.temperature || 0.7,
      max_tokens: request.parameters?.maxTokens || 2000,
      top_p: request.parameters?.topP || 1,
      frequency_penalty: request.parameters?.frequencyPenalty || 0,
      presence_penalty: request.parameters?.presencePenalty || 0
    });

    const processingTime = Date.now() - startTime;
    const tokensUsed = response.usage?.total_tokens || 0;

    // Extract generated content
    const generatedContent = response.choices[0]?.message?.content || '';

    // Analyze content
    const metadata = await this.analyzeContent(generatedContent, request);

    return {
      content: generatedContent,
      metadata: {
        ...metadata,
        processingTime,
        tokensUsed
      }
    };
  }

  private async buildSystemMessage(request: ContentGenerationRequest): Promise<string> {
    let systemMessage = 'You are an advanced AI content generation system capable of creating high-quality, original content.';

    // Add style instructions
    if (this.config.styleTransferEnabled && request.parameters?.style) {
      systemMessage += ` Write in a ${request.parameters.style} style.`;
    }

    // Add tone instructions
    if (this.config.toneAdjustmentEnabled && request.parameters?.tone) {
      systemMessage += ` Use a ${request.parameters.tone} tone throughout the content.`;
    }

    // Add quality instructions
    const quality = request.options?.quality || 'standard';
    switch (quality) {
      case 'draft':
        systemMessage += ' Create a draft version that can be refined later.';
        break;
      case 'premium':
        systemMessage += ' Create premium quality content with exceptional writing and structure.';
        break;
      case 'enterprise':
        systemMessage += ' Create enterprise-grade content with professional polish and attention to detail.';
        break;
    }

    // Add SEO instructions
    if (this.config.seoOptimizationEnabled && request.options?.enableSEOOptimization) {
      systemMessage += ' Optimize the content for search engines with relevant keywords and proper structure.';
    }

    // Add originality instructions
    systemMessage += ' Ensure the content is original and not copied from other sources.';

    return systemMessage;
  }

  private async buildUserPrompt(request: ContentGenerationRequest): Promise<string> {
    let prompt = request.prompt;

    // Add language specification
    if (this.config.multilingualEnabled && request.parameters?.language) {
      prompt = `Write in ${request.parameters.language}: ${prompt}`;
    }

    // Add format specification
    const format = request.parameters?.format || 'plain';
    switch (format) {
      case 'markdown':
        prompt += '\n\nFormat the response using Markdown syntax.';
        break;
      case 'html':
        prompt += '\n\nFormat the response using HTML tags.';
        break;
      case 'json':
        prompt += '\n\nReturn the response as a JSON object with a "content" field.';
        break;
    }

    return prompt;
  }

  private async analyzeContent(content: string, request: ContentGenerationRequest): Promise<any> {
    const metadata: any = {
      wordCount: content.split(/\s+/).filter(word => word.length > 0).length,
      readingTime: Math.ceil(content.split(/\s+/).length / 200), // Average reading speed
      language: request.parameters?.language || 'en',
      style: request.parameters?.style || 'standard',
      tone: request.parameters?.tone || 'informative',
      sentiment: await this.detectSentiment(content),
      keywords: await this.extractKeywords(content),
      seoScore: this.config.seoOptimizationEnabled ? await this.calculateSEOScore(content) : 0,
      plagiarismScore: this.config.plagiarismDetectionEnabled ? await this.checkPlagiarism(content) : 0,
      factCheckStatus: this.config.factCheckingEnabled ? await this.factCheck(content) : 'unverified'
    };

    return metadata;
  }

  private async postProcessContent(result: TextGenerationResult, request: ContentGenerationRequest): Promise<TextGenerationResult> {
    let content = result.content;

    // Apply style transfer if enabled
    if (this.config.styleTransferEnabled && request.parameters?.style) {
      content = await this.applyStyleTransfer(content, request.parameters.style);
    }

    // Apply tone adjustment if enabled
    if (this.config.toneAdjustmentEnabled && request.parameters?.tone) {
      content = await this.adjustTone(content, request.parameters.tone);
    }

    // Apply SEO optimization if enabled
    if (this.config.seoOptimizationEnabled && request.options?.enableSEOOptimization) {
      content = await this.optimizeSEO(content);
    }

    // Update metadata
    const updatedMetadata = await this.analyzeContent(content, request);

    return {
      content,
      metadata: {
        ...result.metadata,
        ...updatedMetadata
      }
    };
  }

  private async storeContent(result: TextGenerationResult, request: ContentGenerationRequest): Promise<string> {
    const contentDoc = new Content({
      userId: request.userId,
      organization: request.organizationId,
      title: request.title,
      description: request.description,
      type: 'text',
      subtype: request.parameters?.format || 'plain',
      content: result.content,
      textMetadata: {
        style: result.metadata.style,
        tone: result.metadata.tone,
        language: result.metadata.language,
        wordCount: result.metadata.wordCount,
        readingTime: result.metadata.readingTime,
        sentiment: result.metadata.sentiment,
        keywords: result.metadata.keywords,
        seoScore: result.metadata.seoScore,
        plagiarismScore: result.metadata.plagiarismScore,
        factCheckStatus: result.metadata.factCheckStatus
      },
      generationParameters: request.parameters,
      status: 'completed',
      quality: request.options?.quality || 'standard',
      privacy: request.options?.privacy || 'private',
      usage: {
        tokensUsed: result.metadata.tokensUsed,
        cost: this.calculateCost(result.metadata.tokensUsed),
        processingTime: result.metadata.processingTime,
        providerUsed: (this.config as any).providerType,
        modelUsed: request.parameters?.model || (this.config as any).defaultModel
      },
      tags: request.parameters?.tags || [],
      categories: request.parameters?.categories || []
    });

    const savedContent = await contentDoc.save();
    return savedContent._id.toString();
  }

  // Helper methods for advanced features
  private async detectSentiment(content: string): Promise<'positive' | 'negative' | 'neutral'> {
    // Implementation would use sentiment analysis
    // This is a placeholder
    return 'neutral';
  }

  private async extractKeywords(content: string): Promise<string[]> {
    // Implementation would use keyword extraction
    // This is a placeholder
    return [];
  }

  private async calculateSEOScore(content: string): Promise<number> {
    // Implementation would calculate SEO score
    // This is a placeholder
    return 75;
  }

  private async checkPlagiarism(content: string): Promise<number> {
    // Implementation would check for plagiarism
    // This is a placeholder
    return 0;
  }

  private async factCheck(content: string): Promise<'verified' | 'questionable' | 'unverified'> {
    // Implementation would perform fact checking
    // This is a placeholder
    return 'unverified';
  }

  private async applyStyleTransfer(content: string, style: string): Promise<string> {
    // Implementation would apply style transfer
    // This is a placeholder
    return content;
  }

  private async adjustTone(content: string, tone: string): Promise<string> {
    // Implementation would adjust tone
    // This is a placeholder
    return content;
  }

  private async optimizeSEO(content: string): Promise<string> {
    // Implementation would optimize for SEO
    // This is a placeholder
    return content;
  }

  private calculateCost(tokensUsed: number): number {
    // Cost calculation based on provider and model
    const costPerThousandTokens = 0.002; // $0.002 per 1K tokens
    return (tokensUsed / 1000) * costPerThousandTokens;
  }

  protected getSupportedFeatures(): string[] {
    return [
      'chat',
      'streaming',
      'style-transfer',
      'tone-adjustment',
      'plagiarism-detection',
      'fact-checking',
      'seo-optimization',
      'multilingual'
    ];
  }
}