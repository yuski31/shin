import { BasePersonalizationService, AnalysisResult } from './BasePersonalizationService';
import { UserPreferences, UserItemInteraction, UserBehavior } from '@/models/personalization';

export interface UserPreferenceProfile {
  userId: string;
  contentPreferences: {
    types: Record<string, number>; // Content type -> preference score (0-1)
    topics: Record<string, number>; // Topic -> preference score (0-1)
    difficulty: Record<string, number>; // Difficulty level -> preference score (0-1)
    format: Record<string, number>; // Format -> preference score (0-1)
  };
  interactionPatterns: {
    avgSessionTime: number;
    preferredTimeOfDay: number[];
    completionRate: number;
    bookmarkRate: number;
    skipRate: number;
  };
  learningPreferences: {
    pace: 'slow' | 'moderate' | 'fast';
    style: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
    depth: 'overview' | 'detailed' | 'comprehensive';
    structure: 'linear' | 'non-linear' | 'adaptive';
  };
  engagementPreferences: {
    notificationTypes: string[];
    communicationChannels: string[];
    feedbackStyle: 'immediate' | 'periodic' | 'on-demand';
    socialFeatures: boolean;
  };
  updatedAt: Date;
}

export interface CollaborativeFilteringResult {
  userId: string;
  similarUsers: Array<{
    userId: string;
    similarityScore: number;
    sharedInteractions: number;
  }>;
  recommendedItems: Array<{
    itemId: string;
    itemType: string;
    predictedScore: number;
    confidence: number;
    reason: string;
  }>;
  preferenceClusters: Array<{
    clusterId: string;
    preferenceVector: number[];
    userCount: number;
    avgSimilarity: number;
  }>;
}

export class PreferenceLearningService extends BasePersonalizationService {
  private readonly MIN_INTERACTIONS = 5;
  private readonly SIMILARITY_THRESHOLD = 0.3;
  private readonly PREFERENCE_WEIGHTS = {
    interaction: 0.4,
    behavior: 0.3,
    context: 0.2,
    feedback: 0.1,
  };

  async analyzeBehavior(userId: string, behaviors: any[]): Promise<AnalysisResult> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      // Get user interactions and behaviors
      const interactions = await UserItemInteraction.find({ userId })
        .sort({ timestamp: -1 })
        .limit(1000);

      const userBehaviors = behaviors.length > 0
        ? behaviors
        : await UserBehavior.find({ userId })
            .sort({ timestamp: -1 })
            .limit(1000);

      // Build preference profile
      const preferenceProfile = await this.buildPreferenceProfile(userId, interactions, userBehaviors);

      // Calculate collaborative filtering
      const cfResult = await this.calculateCollaborativeFiltering(userId, interactions);

      // Update user preferences
      await this.updateUserPreferences(userId, preferenceProfile, cfResult);

      // Calculate overall score and confidence
      const score = this.calculatePreferenceScore(preferenceProfile, cfResult);
      const confidence = this.calculateConfidence(
        interactions.length + userBehaviors.length,
        this.calculateConsistency(preferenceProfile),
        this.calculateRecency([...interactions, ...userBehaviors])
      );

      // Generate insights and recommendations
      const insights = await this.generatePreferenceInsights(preferenceProfile, cfResult);
      const recommendations = await this.generatePreferenceRecommendations(preferenceProfile, cfResult);

      return {
        score,
        confidence,
        insights,
        recommendations,
        metadata: {
          interactionsCount: interactions.length,
          behaviorsCount: userBehaviors.length,
          preferenceProfile,
          collaborativeFiltering: cfResult,
        },
      };
    } catch (error) {
      console.error('Error analyzing preferences:', error);
      throw error;
    }
  }

  private async buildPreferenceProfile(
    userId: string,
    interactions: any[],
    behaviors: any[]
  ): Promise<UserPreferenceProfile> {
    const profile: UserPreferenceProfile = {
      userId,
      contentPreferences: {
        types: {},
        topics: {},
        difficulty: {},
        format: {},
      },
      interactionPatterns: {
        avgSessionTime: 0,
        preferredTimeOfDay: [],
        completionRate: 0,
        bookmarkRate: 0,
        skipRate: 0,
      },
      learningPreferences: {
        pace: 'moderate',
        style: 'visual',
        depth: 'detailed',
        structure: 'adaptive',
      },
      engagementPreferences: {
        notificationTypes: [],
        communicationChannels: [],
        feedbackStyle: 'periodic',
        socialFeatures: true,
      },
      updatedAt: new Date(),
    };

    if (interactions.length === 0 && behaviors.length === 0) {
      return profile;
    }

    // Analyze content type preferences
    const typeCounts = this.countByProperty(interactions, 'itemType');
    const totalInteractions = interactions.length;
    for (const [type, count] of Object.entries(typeCounts)) {
      profile.contentPreferences.types[type] = count / totalInteractions;
    }

    // Analyze topic preferences
    const topicCounts = this.extractTopicsFromInteractions(interactions);
    for (const [topic, count] of Object.entries(topicCounts)) {
      profile.contentPreferences.topics[topic] = count / totalInteractions;
    }

    // Analyze difficulty preferences
    const difficultyCounts = this.countByProperty(interactions, 'difficulty');
    for (const [difficulty, count] of Object.entries(difficultyCounts)) {
      profile.contentPreferences.difficulty[difficulty] = count / totalInteractions;
    }

    // Analyze interaction patterns
    profile.interactionPatterns = this.analyzeInteractionPatterns(interactions, behaviors);

    // Analyze learning preferences
    profile.learningPreferences = this.inferLearningPreferences(interactions, behaviors);

    // Analyze engagement preferences
    profile.engagementPreferences = this.inferEngagementPreferences(interactions, behaviors);

    return profile;
  }

  private countByProperty(items: any[], property: string): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const item of items) {
      const value = item[property] || item.context?.[property] || 'unknown';
      counts[value] = (counts[value] || 0) + 1;
    }

    return counts;
  }

  private extractTopicsFromInteractions(interactions: any[]): Record<string, number> {
    const topicCounts: Record<string, number> = {};

    for (const interaction of interactions) {
      const topics = interaction.context?.topics || interaction.metadata?.topics || [];
      for (const topic of topics) {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      }
    }

    return topicCounts;
  }

  private analyzeInteractionPatterns(interactions: any[], behaviors: any[]): any {
    if (interactions.length === 0) {
      return {
        avgSessionTime: 0,
        preferredTimeOfDay: [],
        completionRate: 0,
        bookmarkRate: 0,
        skipRate: 0,
      };
    }

    // Calculate completion rate
    const completed = interactions.filter(i => i.interactionType === 'complete').length;
    const skipped = interactions.filter(i => i.interactionType === 'skip').length;
    const bookmarked = interactions.filter(i => i.interactionType === 'bookmark').length;

    const completionRate = completed / interactions.length;
    const skipRate = skipped / interactions.length;
    const bookmarkRate = bookmarked / interactions.length;

    // Calculate average session time
    const sessionTimes = this.calculateSessionTimes(behaviors);
    const avgSessionTime = sessionTimes.length > 0
      ? sessionTimes.reduce((sum, time) => sum + time, 0) / sessionTimes.length
      : 0;

    // Find preferred time of day
    const preferredTimeOfDay = this.findPreferredTimeOfDay(interactions);

    return {
      avgSessionTime,
      preferredTimeOfDay,
      completionRate,
      bookmarkRate,
      skipRate,
    };
  }

  private calculateSessionTimes(behaviors: any[]): number[] {
    const sessionTimes: number[] = [];

    // Group behaviors by session (30-minute window)
    const sessions = this.groupBehaviorsBySession(behaviors);

    for (const session of sessions) {
      if (session.length > 1) {
        const startTime = new Date(session[0].timestamp);
        const endTime = new Date(session[session.length - 1].timestamp);
        sessionTimes.push((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
      }
    }

    return sessionTimes;
  }

  private groupBehaviorsBySession(behaviors: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];

    for (const behavior of behaviors.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )) {
      if (currentSession.length === 0) {
        currentSession.push(behavior);
      } else {
        const lastTime = new Date(currentSession[currentSession.length - 1].timestamp);
        const currentTime = new Date(behavior.timestamp);
        const timeDiff = (currentTime.getTime() - lastTime.getTime()) / (1000 * 60); // minutes

        if (timeDiff <= 30) { // 30-minute session window
          currentSession.push(behavior);
        } else {
          sessions.push([...currentSession]);
          currentSession = [behavior];
        }
      }
    }

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private findPreferredTimeOfDay(interactions: any[]): number[] {
    const hourlyCounts: Record<number, number> = {};

    for (const interaction of interactions) {
      const hour = new Date(interaction.timestamp).getHours();
      hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    }

    return Object.entries(hourlyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private inferLearningPreferences(interactions: any[], behaviors: any[]): any {
    // Analyze completion patterns to infer pace
    const completionRate = interactions.filter(i => i.interactionType === 'complete').length / interactions.length;
    const avgTimePerInteraction = interactions.reduce((sum, i) => sum + (i.context?.timeSpent || 0), 0) / interactions.length;

    let pace: 'slow' | 'moderate' | 'fast' = 'moderate';
    if (completionRate > 0.8 && avgTimePerInteraction < 300) pace = 'fast';
    else if (completionRate < 0.4 || avgTimePerInteraction > 900) pace = 'slow';

    // Analyze interaction types to infer learning style
    const visualInteractions = interactions.filter(i =>
      i.itemType === 'video' || i.itemType === 'tutorial'
    ).length;
    const audioInteractions = interactions.filter(i =>
      i.itemType === 'podcast' || i.itemType === 'audio'
    ).length;
    const readingInteractions = interactions.filter(i =>
      i.itemType === 'article' || i.itemType === 'book'
    ).length;
    const interactiveInteractions = interactions.filter(i =>
      i.itemType === 'course' || i.itemType === 'interactive'
    ).length;

    const maxInteractions = Math.max(visualInteractions, audioInteractions, readingInteractions, interactiveInteractions);

    let style: 'visual' | 'auditory' | 'kinesthetic' | 'reading' = 'visual';
    if (maxInteractions === audioInteractions) style = 'auditory';
    else if (maxInteractions === readingInteractions) style = 'reading';
    else if (maxInteractions === interactiveInteractions) style = 'kinesthetic';

    // Infer depth and structure preferences
    const depth = completionRate > 0.7 ? 'comprehensive' : completionRate > 0.5 ? 'detailed' : 'overview';
    const structure = this.inferStructurePreference(interactions);

    return { pace, style, depth, structure };
  }

  private inferStructurePreference(interactions: any[]): 'linear' | 'non-linear' | 'adaptive' {
    // Analyze if user follows sequential patterns or jumps around
    const sequentialPatterns = this.detectSequentialPatterns(interactions);

    if (sequentialPatterns > 0.7) return 'linear';
    else if (sequentialPatterns < 0.3) return 'non-linear';
    else return 'adaptive';
  }

  private detectSequentialPatterns(interactions: any[]): number {
    if (interactions.length < 3) return 0.5;

    let sequentialCount = 0;
    let totalComparisons = 0;

    // Sort interactions by timestamp
    const sorted = interactions.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 1; i < sorted.length; i++) {
      totalComparisons++;
      // Check if this interaction logically follows the previous one
      const prev = sorted[i - 1];
      const current = sorted[i];

      // Simple heuristic: if same item type and similar context, likely sequential
      if (prev.itemType === current.itemType &&
          Math.abs(new Date(prev.timestamp).getTime() - new Date(current.timestamp).getTime()) < 3600000) {
        sequentialCount++;
      }
    }

    return totalComparisons > 0 ? sequentialCount / totalComparisons : 0.5;
  }

  private inferEngagementPreferences(interactions: any[], behaviors: any[]): any {
    const notificationTypes: string[] = [];
    const communicationChannels: string[] = [];

    // Analyze notification preferences based on response patterns
    const notificationResponses = interactions.filter(i =>
      i.interactionType === 'click' && i.targetType === 'notification'
    );

    if (notificationResponses.length > 0) {
      notificationTypes.push('push'); // Default assumption
    }

    // Analyze communication preferences
    const communicationInteractions = interactions.filter(i =>
      i.targetType === 'communication' || i.targetType === 'social'
    );

    if (communicationInteractions.length > 0) {
      communicationChannels.push('in-app');
    }

    // Infer feedback style
    const feedbackInteractions = interactions.filter(i =>
      i.interactionType === 'rate' || i.interactionType === 'feedback'
    );

    let feedbackStyle: 'immediate' | 'periodic' | 'on-demand' = 'periodic';
    if (feedbackInteractions.length > interactions.length * 0.1) {
      feedbackStyle = 'immediate';
    }

    // Infer social features preference
    const socialInteractions = interactions.filter(i =>
      i.interactionType === 'share' || i.interactionType === 'comment' || i.interactionType === 'like'
    );

    const socialFeatures = socialInteractions.length > interactions.length * 0.05;

    return {
      notificationTypes,
      communicationChannels,
      feedbackStyle,
      socialFeatures,
    };
  }

  private async calculateCollaborativeFiltering(
    userId: string,
    interactions: any[]
  ): Promise<CollaborativeFilteringResult> {
    if (interactions.length < this.MIN_INTERACTIONS) {
      return {
        userId,
        similarUsers: [],
        recommendedItems: [],
        preferenceClusters: [],
      };
    }

    // Find similar users based on interaction patterns
    const similarUsers = await this.findSimilarUsers(userId, interactions);

    // Generate item recommendations based on similar users
    const recommendedItems = await this.generateItemRecommendations(userId, similarUsers, interactions);

    // Cluster users by preference patterns
    const preferenceClusters = await this.clusterUsersByPreferences(similarUsers);

    return {
      userId,
      similarUsers,
      recommendedItems,
      preferenceClusters,
    };
  }

  private async findSimilarUsers(userId: string, interactions: any[]): Promise<any[]> {
    // Get all users with similar interaction patterns
    const allUsers = await UserItemInteraction.aggregate([
      {
        $match: {
          itemType: { $in: interactions.map(i => i.itemType) },
          timestamp: {
            $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      },
      {
        $group: {
          _id: '$userId',
          interactions: { $push: '$$ROOT' },
          uniqueItems: { $addToSet: '$itemId' },
          avgWeight: { $avg: '$weight' }
        }
      },
      {
        $match: {
          '_id': { $ne: userId },
          'uniqueItems.1': { $exists: true } // At least 2 unique items
        }
      }
    ]);

    const similarUsers = [];

    for (const otherUser of allUsers) {
      const similarity = this.calculateUserSimilarity(interactions, otherUser.interactions);
      const sharedInteractions = this.countSharedInteractions(interactions, otherUser.interactions);

      if (similarity >= this.SIMILARITY_THRESHOLD && sharedInteractions > 0) {
        similarUsers.push({
          userId: otherUser._id,
          similarityScore: similarity,
          sharedInteractions,
        });
      }
    }

    return similarUsers
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .slice(0, 10); // Top 10 similar users
  }

  private calculateUserSimilarity(userInteractions: any[], otherUserInteractions: any[]): number {
    // Simple Jaccard similarity based on item overlap
    const userItems = new Set(userInteractions.map(i => i.itemId));
    const otherItems = new Set(otherUserInteractions.map(i => i.itemId));

    const intersection = new Set([...userItems].filter(x => otherItems.has(x)));
    const union = new Set([...userItems, ...otherItems]);

    return intersection.size / union.size;
  }

  private countSharedInteractions(userInteractions: any[], otherUserInteractions: any[]): number {
    const userItems = new Set(userInteractions.map(i => i.itemId));
    const otherItems = new Set(otherUserInteractions.map(i => i.itemId));

    return new Set([...userItems].filter(x => otherItems.has(x))).size;
  }

  private async generateItemRecommendations(
    userId: string,
    similarUsers: any[],
    userInteractions: any[]
  ): Promise<any[]> {
    const userItemIds = new Set(userInteractions.map(i => i.itemId));
    const recommendations = new Map<string, { score: number; confidence: number; reasons: string[] }>();

    // Aggregate recommendations from similar users
    for (const similarUser of similarUsers) {
      const similarUserInteractions = await UserItemInteraction.find({
        userId: similarUser.userId,
        itemId: { $nin: Array.from(userItemIds) }
      }).limit(50);

      for (const interaction of similarUserInteractions) {
        const weight = interaction.weight * similarUser.similarityScore;

        if (recommendations.has(interaction.itemId)) {
          const existing = recommendations.get(interaction.itemId)!;
          existing.score += weight;
          existing.confidence = Math.min(1, existing.confidence + 0.1);
          existing.reasons.push(`Recommended by similar user (similarity: ${(similarUser.similarityScore * 100).toFixed(1)}%)`);
        } else {
          recommendations.set(interaction.itemId, {
            score: weight,
            confidence: 0.5,
            reasons: [`Recommended by similar user (similarity: ${(similarUser.similarityScore * 100).toFixed(1)}%)`],
          });
        }
      }
    }

    // Convert to array and sort by score
    return Array.from(recommendations.entries())
      .map(([itemId, data]) => ({
        itemId,
        itemType: 'unknown', // Would need to look up from database
        predictedScore: data.score,
        confidence: data.confidence,
        reason: data.reasons[0], // Take first reason
      }))
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, 20);
  }

  private async clusterUsersByPreferences(similarUsers: any[]): Promise<any[]> {
    // Simple clustering based on interaction patterns
    const clusters = new Map<string, { users: any[]; totalSimilarity: number }>();

    for (const user of similarUsers) {
      // Create cluster key based on interaction characteristics
      const clusterKey = this.generateClusterKey(user);

      if (clusters.has(clusterKey)) {
        const cluster = clusters.get(clusterKey)!;
        cluster.users.push(user);
        cluster.totalSimilarity += user.similarityScore;
      } else {
        clusters.set(clusterKey, {
          users: [user],
          totalSimilarity: user.similarityScore,
        });
      }
    }

    return Array.from(clusters.entries()).map(([clusterId, cluster]) => ({
      clusterId,
      preferenceVector: this.generatePreferenceVector(cluster.users),
      userCount: cluster.users.length,
      avgSimilarity: cluster.totalSimilarity / cluster.users.length,
    }));
  }

  private generateClusterKey(user: any): string {
    // Simple clustering based on interaction frequency and types
    return `cluster_${Math.round(user.similarityScore * 10)}`;
  }

  private generatePreferenceVector(users: any[]): number[] {
    // Generate a simple preference vector based on user similarities
    const vector = new Array(10).fill(0);

    for (const user of users) {
      const index = Math.min(9, Math.floor(user.similarityScore * 10));
      vector[index] += 1;
    }

    return vector.map(v => v / users.length);
  }

  private async updateUserPreferences(
    userId: string,
    preferenceProfile: UserPreferenceProfile,
    cfResult: CollaborativeFilteringResult
  ): Promise<void> {
    try {
      const existingPreferences = await UserPreferences.findOne({ userId });

      const updatedPreferences = {
        userId,
        contentTypes: Object.keys(preferenceProfile.contentPreferences.types),
        topics: Object.keys(preferenceProfile.contentPreferences.topics),
        difficulty: this.selectTopPreference(preferenceProfile.contentPreferences.difficulty),
        learningStyle: preferenceProfile.learningPreferences.style,
        timePreference: this.mapHoursToTimeOfDay(preferenceProfile.interactionPatterns.preferredTimeOfDay[0] || 12),
        pace: preferenceProfile.learningPreferences.pace,
        notifications: {
          email: preferenceProfile.engagementPreferences.notificationTypes.includes('email'),
          push: preferenceProfile.engagementPreferences.notificationTypes.includes('push'),
          sms: preferenceProfile.engagementPreferences.notificationTypes.includes('sms'),
          frequency: preferenceProfile.engagementPreferences.feedbackStyle === 'immediate' ? 'immediate' : 'daily',
        },
        privacy: {
          profileVisibility: 'private',
          dataCollection: true,
          analytics: true,
        },
        updatedAt: new Date(),
      };

      if (existingPreferences) {
        await UserPreferences.findOneAndUpdate({ userId }, updatedPreferences);
      } else {
        await UserPreferences.create(updatedPreferences);
      }
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  private selectTopPreference(preferences: Record<string, number>): string {
    const sorted = Object.entries(preferences)
      .sort(([,a], [,b]) => b - a);

    return sorted.length > 0 ? sorted[0][0] : 'intermediate';
  }

  private mapHoursToTimeOfDay(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
    if (hour >= 6 && hour < 12) return 'morning';
    else if (hour >= 12 && hour < 18) return 'afternoon';
    else if (hour >= 18 && hour < 22) return 'evening';
    else return 'night';
  }

  private calculatePreferenceScore(
    preferenceProfile: UserPreferenceProfile,
    cfResult: CollaborativeFilteringResult
  ): number {
    // Calculate score based on preference clarity and collaborative filtering strength
    const preferenceClarity = this.calculatePreferenceClarity(preferenceProfile);
    const cfStrength = cfResult.similarUsers.length > 0 ? Math.min(cfResult.similarUsers.length * 10, 50) : 0;

    return Math.min(100, preferenceClarity + cfStrength);
  }

  private calculatePreferenceClarity(preferenceProfile: UserPreferenceProfile): number {
    let clarity = 0;

    // Content type clarity
    const typeScores = Object.values(preferenceProfile.contentPreferences.types);
    if (typeScores.length > 0) {
      const maxTypeScore = Math.max(...typeScores);
      clarity += maxTypeScore * 25;
    }

    // Topic clarity
    const topicScores = Object.values(preferenceProfile.contentPreferences.topics);
    if (topicScores.length > 0) {
      const maxTopicScore = Math.max(...topicScores);
      clarity += maxTopicScore * 25;
    }

    // Interaction pattern clarity
    const interactionClarity = preferenceProfile.interactionPatterns.completionRate > 0.5 ? 25 : 10;
    clarity += interactionClarity;

    // Learning preference clarity
    clarity += 25; // Always give some credit for inferred preferences

    return clarity;
  }

  private calculateConsistency(preferenceProfile: UserPreferenceProfile): number {
    // Calculate how consistent the user's preferences are
    const scores = [
      ...Object.values(preferenceProfile.contentPreferences.types),
      ...Object.values(preferenceProfile.contentPreferences.topics),
      preferenceProfile.interactionPatterns.completionRate,
    ];

    if (scores.length === 0) return 0;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

    return Math.max(0, 1 - variance);
  }

  private calculateRecency(interactions: any[]): number {
    if (interactions.length === 0) return 30;

    const latest = new Date(interactions[0].timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - latest.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private async generatePreferenceInsights(
    preferenceProfile: UserPreferenceProfile,
    cfResult: CollaborativeFilteringResult
  ): Promise<string[]> {
    const insights = [];

    // Content preference insights
    const topType = Object.entries(preferenceProfile.contentPreferences.types)
      .sort(([,a], [,b]) => b - a)[0];

    if (topType) {
      insights.push(`Strong preference for ${topType[0]} content (${(topType[1] * 100).toFixed(1)}%)`);
    }

    // Learning style insights
    const learningPrefs = preferenceProfile.learningPreferences;
    insights.push(`Learning style: ${learningPrefs.style} with ${learningPrefs.pace} pace`);

    // Interaction pattern insights
    const patterns = preferenceProfile.interactionPatterns;
    if (patterns.completionRate > 0.8) {
      insights.push('High completion rate indicates strong engagement');
    } else if (patterns.completionRate < 0.4) {
      insights.push('Low completion rate suggests content may be too difficult or uninteresting');
    }

    // Collaborative filtering insights
    if (cfResult.similarUsers.length > 0) {
      insights.push(`Found ${cfResult.similarUsers.length} users with similar preferences`);
    }

    return insights;
  }

  private async generatePreferenceRecommendations(
    preferenceProfile: UserPreferenceProfile,
    cfResult: CollaborativeFilteringResult
  ): Promise<string[]> {
    const recommendations = [];

    // Based on learning preferences
    const learningPrefs = preferenceProfile.learningPreferences;
    if (learningPrefs.pace === 'slow') {
      recommendations.push('Consider starting with beginner-level content to build confidence');
    } else if (learningPrefs.pace === 'fast') {
      recommendations.push('Advanced content may be suitable based on your quick learning pace');
    }

    // Based on interaction patterns
    const patterns = preferenceProfile.interactionPatterns;
    if (patterns.completionRate < 0.5) {
      recommendations.push('Try shorter content pieces to improve completion rates');
    }

    if (patterns.avgSessionTime > 60) {
      recommendations.push('Your long session times suggest you prefer in-depth content');
    }

    // Based on collaborative filtering
    if (cfResult.recommendedItems.length > 0) {
      recommendations.push(`Found ${cfResult.recommendedItems.length} items that similar users enjoyed`);
    }

    return recommendations;
  }

  // Required abstract method implementations
  async updatePreferences(userId: string, interactions: any[]): Promise<UserPreferences> {
    // This is implemented above in updateUserPreferences
    const preferenceProfile = await this.buildPreferenceProfile(userId, interactions, []);
    const cfResult = await this.calculateCollaborativeFiltering(userId, interactions);
    await this.updateUserPreferences(userId, preferenceProfile, cfResult);

    return await UserPreferences.findOne({ userId }) || await UserPreferences.create({
      userId,
      contentTypes: ['article', 'tutorial'],
      topics: ['general'],
      difficulty: 'intermediate',
      learningStyle: 'visual',
      timePreference: 'afternoon',
      pace: 'moderate',
      notifications: {
        email: true,
        push: true,
        sms: false,
        frequency: 'daily',
      },
      privacy: {
        profileVisibility: 'private',
        dataCollection: true,
        analytics: true,
      },
    });
  }

  async analyzePsychographics(userId: string, data: any): Promise<AnalysisResult> {
    // This would be implemented by a psychographics analysis service
    return {
      score: 75,
      confidence: 0.6,
      insights: ['Balanced personality profile detected'],
      recommendations: ['Continue current engagement patterns'],
      metadata: {
        analysisType: 'psychographics',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async updateContext(userId: string, contextData: any): Promise<any> {
    // This would be implemented by a context awareness service
    return {
      userId,
      currentSession: {
        id: `session_${Date.now()}`,
        startTime: new Date(),
        lastActivity: new Date(),
        device: {
          type: 'desktop',
          os: 'unknown',
          browser: 'unknown',
        },
      },
      circadianRhythm: {
        peakHours: [9, 10, 11, 14, 15, 16],
        preferredTimes: {
          content: [9, 10, 11, 14, 15, 16],
          communication: [9, 10, 11, 14, 15, 16],
          learning: [9, 10, 11, 14, 15, 16],
        },
      },
      fatigueLevel: 0.2,
      stressLevel: 0.3,
      focusState: 'medium',
      environment: {
        noiseLevel: 'moderate',
        lighting: 'bright',
        setting: 'home',
      },
    };
  }
}