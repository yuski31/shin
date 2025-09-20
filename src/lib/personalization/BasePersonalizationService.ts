import { IAIProvider } from '@/models/AIProvider';
import { IProviderAdapter } from '@/lib/providers/base-provider';
import { UserProfile, UserBehavior, UserPreferences, UserPsychographics, UserContext } from '@/models/personalization';

export interface PersonalizationConfig {
  aiProvider: IAIProvider;
  providerAdapter: IProviderAdapter;
  enableRealTime: boolean;
  batchSize: number;
  updateInterval: number; // minutes
  enableCaching: boolean;
  cacheTTL: number; // seconds
}

export interface UserProfileData {
  behavior: any;
  preferences: any;
  psychographics: any;
  context: any;
}

export interface AnalysisResult {
  score: number;
  confidence: number;
  insights: string[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export abstract class BasePersonalizationService {
  protected config: PersonalizationConfig;
  protected provider: IProviderAdapter;

  constructor(config: PersonalizationConfig) {
    this.config = config;
    this.provider = config.providerAdapter;
  }

  // Abstract methods that must be implemented by subclasses
  abstract analyzeBehavior(userId: string, behaviors: any[]): Promise<AnalysisResult>;
  abstract updatePreferences(userId: string, interactions: any[]): Promise<UserPreferences>;
  abstract analyzePsychographics(userId: string, data: any): Promise<AnalysisResult>;
  abstract updateContext(userId: string, contextData: any): Promise<UserContext>;

  // Common utility methods
  protected async getUserProfile(userId: string): Promise<UserProfileData | null> {
    try {
      const [behavior, preferences, psychographics, context] = await Promise.all([
        UserBehavior.find({ userId }).sort({ timestamp: -1 }).limit(1000),
        UserPreferences.findOne({ userId }),
        UserPsychographics.findOne({ userId }),
        UserContext.findOne({ userId }),
      ]);

      if (!preferences || !psychographics || !context) {
        return null;
      }

      return {
        behavior: behavior || [],
        preferences,
        psychographics,
        context,
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  protected async updateUserProfile(userId: string, updates: Partial<UserProfileData>): Promise<void> {
    try {
      const updatePromises = [];

      if (updates.preferences) {
        updatePromises.push(
          UserPreferences.findOneAndUpdate(
            { userId },
            { ...updates.preferences, updatedAt: new Date() },
            { upsert: true, new: true }
          )
        );
      }

      if (updates.psychographics) {
        updatePromises.push(
          UserPsychographics.findOneAndUpdate(
            { userId },
            { ...updates.psychographics, updatedAt: new Date() },
            { upsert: true, new: true }
          )
        );
      }

      if (updates.context) {
        updatePromises.push(
          UserContext.findOneAndUpdate(
            { userId },
            { ...updates.context, updatedAt: new Date() },
            { upsert: true, new: true }
          )
        );
      }

      await Promise.all(updatePromises);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  protected calculateConfidence(dataPoints: number, consistency: number, recency: number): number {
    // Confidence calculation based on data quality
    const volumeScore = Math.min(dataPoints / 100, 1); // Normalize to 0-1
    const consistencyScore = consistency; // Already 0-1
    const recencyScore = Math.max(0, 1 - (recency / 30)); // Days since last update

    return (volumeScore * 0.4 + consistencyScore * 0.4 + recencyScore * 0.2);
  }

  protected async callAIProvider(prompt: string, options: any = {}): Promise<string> {
    try {
      const response = await this.provider.chat({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert data analyst specializing in user behavior analysis and personalization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
        ...options,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling AI provider:', error);
      throw error;
    }
  }

  protected validateUserId(userId: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(userId) || userId.length > 0;
  }

  protected sanitizeData(data: any): any {
    // Remove sensitive information and sanitize inputs
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data };
      delete sanitized.password;
      delete sanitized.email;
      delete sanitized.apiKey;
      return sanitized;
    }
    return data;
  }

  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const providerHealth = await this.provider.healthCheck();

      return {
        status: providerHealth.isHealthy ? 'healthy' : 'unhealthy',
        details: {
          provider: providerHealth,
          config: {
            enableRealTime: this.config.enableRealTime,
            enableCaching: this.config.enableCaching,
          },
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }
}