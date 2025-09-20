import { IAIProvider } from '@/models/AIProvider';
import { IProviderAdapter } from '@/lib/providers/base-provider';
import { BasePersonalizationService, PersonalizationConfig } from './BasePersonalizationService';
import { BehavioralAnalysisService } from './BehavioralAnalysisService';
import { PreferenceLearningService } from './PreferenceLearningService';
import { RecommendationEngine } from './RecommendationEngine';
import {
  UserProfile,
  UserBehavior,
  UserPreferences,
  UserPsychographics,
  UserContext,
  UserItemInteraction
} from '@/models/personalization';

export interface PersonalizationResult {
  userId: string;
  profile: {
    behavioral: any;
    preferences: UserPreferences;
    psychographics: any;
    context: UserContext;
  };
  recommendations: {
    content: any[];
    features: any[];
    workflows: any[];
  };
  insights: string[];
  engagement: {
    optimalTiming: any;
    channelPreferences: any;
    fatigueLevel: number;
  };
  adaptiveUI: {
    theme: string;
    layout: string;
    shortcuts: any[];
  };
  confidence: number;
  lastUpdated: Date;
}

export interface PersonalizationUpdate {
  userId: string;
  behaviors?: any[];
  interactions?: any[];
  context?: any;
  preferences?: Partial<UserPreferences>;
}

export class PersonalizationService extends BasePersonalizationService {
  private behavioralService: BehavioralAnalysisService;
  private preferenceService: PreferenceLearningService;
  private recommendationEngine: RecommendationEngine;

  constructor(config: PersonalizationConfig) {
    super(config);

    // Initialize specialized services
    this.behavioralService = new BehavioralAnalysisService(config);
    this.preferenceService = new PreferenceLearningService(config);
    this.recommendationEngine = new RecommendationEngine(config);
  }

  async analyzeBehavior(userId: string, behaviors: any[]): Promise<any> {
    return await this.behavioralService.analyzeBehavior(userId, behaviors);
  }

  async updatePreferences(userId: string, interactions: any[]): Promise<UserPreferences> {
    return await this.preferenceService.updatePreferences(userId, interactions);
  }

  async analyzePsychographics(userId: string, data: any): Promise<any> {
    return await this.behavioralService.analyzePsychographics(userId, data);
  }

  async updateContext(userId: string, contextData: any): Promise<UserContext> {
    return await this.behavioralService.updateContext(userId, contextData);
  }

  async getPersonalizationProfile(userId: string): Promise<PersonalizationResult | null> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      // Get all user data in parallel
      const [profileData, behaviors, interactions] = await Promise.all([
        this.getUserProfile(userId),
        UserBehavior.find({ userId }).sort({ timestamp: -1 }).limit(100),
        UserItemInteraction.find({ userId }).sort({ timestamp: -1 }).limit(100),
      ]);

      if (!profileData) {
        return null;
      }

      // Run comprehensive analysis
      const [behavioralAnalysis, preferenceAnalysis] = await Promise.all([
        this.behavioralService.analyzeBehavior(userId, behaviors),
        this.preferenceService.analyzeBehavior(userId, interactions),
      ]);

      // Generate recommendations
      const recommendations = await this.generateRecommendations(userId, behavioralAnalysis, preferenceAnalysis);

      // Calculate engagement metrics
      const engagement = await this.calculateEngagementMetrics(userId, behaviors, interactions);

      // Generate adaptive UI settings
      const adaptiveUI = await this.generateAdaptiveUISettings(userId, behavioralAnalysis, preferenceAnalysis);

      // Calculate overall confidence
      const confidence = (behavioralAnalysis.confidence + preferenceAnalysis.confidence) / 2;

      return {
        userId,
        profile: {
          behavioral: behavioralAnalysis,
          preferences: profileData.preferences,
          psychographics: profileData.psychographics,
          context: profileData.context,
        },
        recommendations,
        insights: [
          ...behavioralAnalysis.insights,
          ...preferenceAnalysis.insights,
        ],
        engagement,
        adaptiveUI,
        confidence,
        lastUpdated: new Date(),
      };
    } catch (error) {
      console.error('Error getting personalization profile:', error);
      throw error;
    }
  }

  async updatePersonalization(update: PersonalizationUpdate): Promise<PersonalizationResult> {
    const { userId, behaviors = [], interactions = [], context, preferences } = update;

    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      // Update different aspects in parallel
      const updatePromises = [];

      if (behaviors.length > 0) {
        updatePromises.push(
          this.behavioralService.analyzeBehavior(userId, behaviors)
        );
      }

      if (interactions.length > 0) {
        updatePromises.push(
          this.preferenceService.analyzeBehavior(userId, interactions)
        );
      }

      if (context) {
        updatePromises.push(
          this.behavioralService.updateContext(userId, context)
        );
      }

      if (preferences) {
        updatePromises.push(
          this.preferenceService.updatePreferences(userId, interactions)
        );
      }

      await Promise.all(updatePromises);

      // Return updated profile
      return await this.getPersonalizationProfile(userId) as PersonalizationResult;
    } catch (error) {
      console.error('Error updating personalization:', error);
      throw error;
    }
  }

  async trackUserBehavior(behavior: {
    userId: string;
    action: string;
    targetType: string;
    targetId: string;
    context?: any;
    metadata?: any;
  }): Promise<void> {
    try {
      const behaviorDoc = new UserBehavior({
        userId: behavior.userId,
        sessionId: behavior.context?.sessionId || `session_${Date.now()}`,
        timestamp: new Date(),
        action: behavior.action,
        targetType: behavior.targetType,
        targetId: behavior.targetId,
        context: behavior.context || {},
        metadata: behavior.metadata || {},
      });

      await behaviorDoc.save();

      // Trigger real-time analysis if enabled
      if (this.config.enableRealTime) {
        // Queue for background processing
        this.queueForAnalysis(behavior.userId);
      }
    } catch (error) {
      console.error('Error tracking user behavior:', error);
      throw error;
    }
  }

  async trackUserInteraction(interaction: {
    userId: string;
    itemId: string;
    itemType: string;
    interactionType: string;
    weight?: number;
    context?: any;
    metadata?: any;
  }): Promise<void> {
    try {
      const interactionDoc = new UserItemInteraction({
        userId: interaction.userId,
        itemId: interaction.itemId,
        itemType: interaction.itemType,
        interactionType: interaction.interactionType,
        weight: interaction.weight || 1,
        timestamp: new Date(),
        context: interaction.context || {},
        metadata: interaction.metadata || {},
      });

      await interactionDoc.save();

      // Trigger real-time analysis if enabled
      if (this.config.enableRealTime) {
        this.queueForAnalysis(interaction.userId);
      }
    } catch (error) {
      console.error('Error tracking user interaction:', error);
      throw error;
    }
  }

  private async generateRecommendations(
    userId: string,
    behavioralAnalysis: any,
    preferenceAnalysis: any
  ): Promise<any> {
    const recommendations = {
      content: [],
      features: [],
      workflows: [],
    };

    try {
      // Content recommendations based on preferences
      if (preferenceAnalysis.metadata?.collaborativeFiltering?.recommendedItems) {
        recommendations.content = preferenceAnalysis.metadata.collaborativeFiltering.recommendedItems
          .slice(0, 10)
          .map((item: any) => ({
            id: item.itemId,
            type: item.itemType,
            score: item.predictedScore,
            reason: item.reason,
            confidence: item.confidence,
          }));
      }

      // Feature recommendations based on behavior patterns
      const behavioralPatterns = behavioralAnalysis.metadata?.patterns || [];
      const frequentActions = behavioralPatterns
        .filter((p: any) => p.type === 'frequency' && p.confidence > 0.7)
        .map((p: any) => p.description);

      if (frequentActions.length > 0) {
        recommendations.features = frequentActions.map((action: string, index: number) => ({
          id: `feature_${index}`,
          name: action,
          reason: 'Frequently used pattern',
          priority: 'high',
        }));
      }

      // Workflow recommendations based on sequences
      const successfulSequences = behavioralAnalysis.metadata?.sequences || [];
      recommendations.workflows = successfulSequences
        .filter((s: any) => s.outcome === 'success')
        .slice(0, 5)
        .map((seq: any, index: number) => ({
          id: seq.id,
          name: `Workflow ${index + 1}`,
          steps: seq.actions.length,
          successRate: seq.satisfaction,
          reason: 'Successful behavior pattern',
        }));

    } catch (error) {
      console.error('Error generating recommendations:', error);
    }

    return recommendations;
  }

  private async calculateEngagementMetrics(
    userId: string,
    behaviors: any[],
    interactions: any[]
  ): Promise<any> {
    // Calculate optimal timing based on user activity patterns
    const hourlyDistribution = this.calculateHourlyDistribution(behaviors);
    const optimalHours = Object.entries(hourlyDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Calculate channel preferences based on interaction types
    const channelPreferences = this.calculateChannelPreferences(interactions);

    // Calculate fatigue level based on recent activity
    const fatigueLevel = this.calculateFatigueLevel(behaviors);

    return {
      optimalTiming: {
        hours: optimalHours,
        timezone: 'UTC', // Would be determined from user context
        bestDays: this.calculateBestDays(behaviors),
      },
      channelPreferences,
      fatigueLevel,
    };
  }

  private calculateHourlyDistribution(behaviors: any[]): Record<number, number> {
    const distribution: Record<number, number> = {};

    for (const behavior of behaviors) {
      const hour = new Date(behavior.timestamp).getHours();
      distribution[hour] = (distribution[hour] || 0) + 1;
    }

    return distribution;
  }

  private calculateChannelPreferences(interactions: any[]): any {
    const channelCounts: Record<string, number> = {};

    for (const interaction of interactions) {
      const channel = interaction.context?.channel || interaction.metadata?.channel || 'unknown';
      channelCounts[channel] = (channelCounts[channel] || 0) + 1;
    }

    const total = Object.values(channelCounts).reduce((sum, count) => sum + count, 0);

    return Object.entries(channelCounts)
      .map(([channel, count]) => ({
        channel,
        preference: count / total,
        usage: count,
      }))
      .sort((a, b) => b.preference - a.preference);
  }

  private calculateFatigueLevel(behaviors: any[]): number {
    if (behaviors.length === 0) return 0;

    // Simple fatigue calculation based on recent activity density
    const recentBehaviors = behaviors.slice(0, 20); // Last 20 behaviors
    const timeSpan = recentBehaviors.length > 1
      ? new Date(recentBehaviors[0].timestamp).getTime() - new Date(recentBehaviors[recentBehaviors.length - 1].timestamp).getTime()
      : 3600000; // Default 1 hour

    const behaviorsPerHour = (recentBehaviors.length * 3600000) / timeSpan;

    // Normalize to 0-1 scale (more behaviors = higher fatigue)
    return Math.min(1, behaviorsPerHour / 10);
  }

  private calculateBestDays(behaviors: any[]): number[] {
    const dailyCounts: Record<number, number> = {};

    for (const behavior of behaviors) {
      const day = new Date(behavior.timestamp).getDay();
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    return Object.entries(dailyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));
  }

  private async generateAdaptiveUISettings(
    userId: string,
    behavioralAnalysis: any,
    preferenceAnalysis: any
  ): Promise<any> {
    // Generate UI settings based on user behavior and preferences
    const settings = {
      theme: 'auto',
      layout: 'comfortable',
      shortcuts: [],
      accessibility: {
        fontSize: 'medium',
        animations: true,
        screenReader: false,
      },
    };

    // Theme preference based on activity hours
    const temporalPatterns = behavioralAnalysis.metadata?.temporalPatterns || [];
    const hourlyPattern = temporalPatterns.find((p: any) => p.type === 'hourly_distribution');

    if (hourlyPattern) {
      const peakHours = hourlyPattern.peakHours || [];
      const avgPeakHour = peakHours.reduce((sum: number, hour: number) => sum + hour, 0) / peakHours.length;

      if (avgPeakHour < 12) {
        settings.theme = 'light';
      } else if (avgPeakHour > 18) {
        settings.theme = 'dark';
      }
    }

    // Layout preference based on interaction patterns
    const interactionPatterns = preferenceAnalysis.metadata?.preferenceProfile?.interactionPatterns;
    if (interactionPatterns) {
      if (interactionPatterns.avgSessionTime > 60) {
        settings.layout = 'spacious'; // More space for long sessions
      } else if (interactionPatterns.avgSessionTime < 15) {
        settings.layout = 'compact'; // Compact for quick interactions
      }
    }

    // Generate custom shortcuts based on frequent actions
    const behavioralPatterns = behavioralAnalysis.metadata?.patterns || [];
    const frequentActions = behavioralPatterns
      .filter((p: any) => p.type === 'frequency' && p.confidence > 0.6)
      .slice(0, 5);

    settings.shortcuts = frequentActions.map((pattern: any, index: number) => ({
      id: `shortcut_${index}`,
      action: pattern.description.split(' ')[2], // Extract action from description
      key: `ctrl+${index + 1}`,
      description: pattern.description,
    }));

    return settings;
  }

  private queueForAnalysis(userId: string): void {
    // In a real implementation, this would queue the user for background analysis
    // For now, just log that analysis was triggered
    console.log(`Queued user ${userId} for personalization analysis`);
  }

  async getUserInsights(userId: string): Promise<string[]> {
    const profile = await this.getPersonalizationProfile(userId);

    if (!profile) {
      return ['No personalization data available yet. Continue using the platform to get personalized insights.'];
    }

    return profile.insights;
  }

  async getUserRecommendations(userId: string, type: 'content' | 'features' | 'workflows'): Promise<any[]> {
    const profile = await this.getPersonalizationProfile(userId);

    if (!profile) {
      return [];
    }

    return profile.recommendations[type] || [];
  }

  async getEngagementMetrics(userId: string): Promise<any> {
    const profile = await this.getPersonalizationProfile(userId);

    if (!profile) {
      return {
        optimalTiming: { hours: [9, 10, 11], timezone: 'UTC', bestDays: [1, 2, 3] },
        channelPreferences: [],
        fatigueLevel: 0,
      };
    }

    return profile.engagement;
  }

  async getAdaptiveUISettings(userId: string): Promise<any> {
    const profile = await this.getPersonalizationProfile(userId);

    if (!profile) {
      return {
        theme: 'auto',
        layout: 'comfortable',
        shortcuts: [],
        accessibility: {
          fontSize: 'medium',
          animations: true,
          screenReader: false,
        },
      };
    }

    return profile.adaptiveUI;
  }

  // Recommendation engine methods
  async getRecommendations(request: {
    userId: string;
    type: 'content' | 'feature' | 'workflow' | 'social' | 'learning_path';
    context?: any;
    filters?: any;
    algorithms?: any;
  }): Promise<any[]> {
    const recommendationRequest = {
      userId: request.userId,
      type: request.type,
      context: request.context,
      filters: request.filters,
      algorithms: request.algorithms,
    };

    const result = await this.recommendationEngine.getRecommendations(recommendationRequest);
    return result.items;
  }

  async getContentRecommendations(userId: string, filters?: any): Promise<any[]> {
    return await this.getRecommendations({
      userId,
      type: 'content',
      filters: {
        maxItems: 20,
        diversity: 0.7,
        ...filters,
      },
      algorithms: {
        collaborative: true,
        contentBased: true,
        hybrid: true,
        exploration: true,
      },
    });
  }

  async getFeatureRecommendations(userId: string): Promise<any[]> {
    return await this.getRecommendations({
      userId,
      type: 'feature',
      filters: {
        maxItems: 10,
      },
      algorithms: {
        collaborative: true,
        contentBased: false,
        hybrid: false,
        exploration: true,
      },
    });
  }

  async getWorkflowRecommendations(userId: string): Promise<any[]> {
    return await this.getRecommendations({
      userId,
      type: 'workflow',
      filters: {
        maxItems: 5,
      },
      algorithms: {
        collaborative: true,
        contentBased: false,
        hybrid: false,
        exploration: false,
      },
    });
  }

  async trainRecommendationModel(): Promise<void> {
    await this.recommendationEngine.trainMatrixFactorization();
  }

  async getRecommendationInsights(userId: string): Promise<string[]> {
    const recommendations = await this.getContentRecommendations(userId, { maxItems: 5 });
    const insights = [];

    if (recommendations.length > 0) {
      insights.push(`Found ${recommendations.length} personalized recommendations`);
      insights.push(`Recommendations include: ${recommendations.slice(0, 3).map(r => r.metadata?.itemType || 'content').join(', ')}`);
    } else {
      insights.push('No recommendations available yet. Continue using the platform to get personalized suggestions.');
    }

    return insights;
  }
}