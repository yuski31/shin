import mongoose from 'mongoose';
import Challenge, { IChallenge } from '../../models/gamification/Challenge';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import { gamificationService } from './GamificationService';

export interface ChallengeTemplate {
  title: string;
  description: string;
  type: 'daily' | 'weekly' | 'monthly' | 'special' | 'seasonal' | 'custom';
  category: 'learning' | 'social' | 'competitive' | 'creative' | 'exploration';
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimatedDuration: number;
  generationRules: {
    type: string;
    parameters: Record<string, any>;
    constraints: Record<string, any>;
  }[];
  rewards: {
    experiencePoints: number;
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    achievements: mongoose.Types.ObjectId[];
    unlockContent: mongoose.Types.ObjectId[];
    multipliers: {
      experience: number;
      currency: number;
    };
  };
  requirements: {
    minLevel?: number;
    requiredAchievements?: mongoose.Types.ObjectId[];
    skillRequirements?: {
      skill: string;
      minLevel: number;
    }[];
  };
  antiCheat: {
    maxActionsPerMinute: number;
    suspiciousPatterns: string[];
    verificationRequired: boolean;
    monitoringLevel: 'low' | 'medium' | 'high';
  };
  tags: string[];
  isActive: boolean;
  featured: boolean;
}

export interface ChallengeGenerationContext {
  userId: mongoose.Types.ObjectId;
  userLevel: number;
  userSkills: string[];
  recentActivity: string[];
  preferences: Record<string, any>;
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  timeAvailable: number; // in minutes
}

export interface ChallengeAttempt {
  userId: mongoose.Types.ObjectId;
  challengeId: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date;
  score: number;
  progress: number; // percentage
  status: 'in_progress' | 'completed' | 'failed' | 'abandoned';
  metadata: Record<string, any>;
}

export class ChallengeEngine {
  private static instance: ChallengeEngine;
  private challengeTemplates: Map<string, ChallengeTemplate> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): ChallengeEngine {
    if (!ChallengeEngine.instance) {
      ChallengeEngine.instance = new ChallengeEngine();
    }
    return ChallengeEngine.instance;
  }

  // Template Management
  private initializeDefaultTemplates(): void {
    // Daily learning challenges
    this.challengeTemplates.set('daily_learning', {
      title: 'Daily Knowledge Quest',
      description: 'Complete a series of learning activities to expand your knowledge',
      type: 'daily',
      category: 'learning',
      difficulty: 'intermediate',
      estimatedDuration: 30,
      generationRules: [{
        type: 'topic_rotation',
        parameters: { topics: ['ai', 'programming', 'science', 'math', 'language'] },
        constraints: { minDifficulty: 0.3, maxDifficulty: 0.7 },
      }],
      rewards: {
        experiencePoints: 100,
        virtualCurrency: { primary: 50, secondary: 0, premium: 0 },
        achievements: [],
        unlockContent: [],
        multipliers: { experience: 1, currency: 1 },
      },
      requirements: {
        minLevel: 1,
      },
      antiCheat: {
        maxActionsPerMinute: 30,
        suspiciousPatterns: ['rapid_clicking', 'copy_paste_abuse'],
        verificationRequired: false,
        monitoringLevel: 'medium',
      },
      tags: ['learning', 'daily', 'knowledge'],
      isActive: true,
      featured: false,
    });

    // Weekly competitive challenges
    this.challengeTemplates.set('weekly_competition', {
      title: 'Weekly Showdown',
      description: 'Compete against other users in skill-based challenges',
      type: 'weekly',
      category: 'competitive',
      difficulty: 'advanced',
      estimatedDuration: 120,
      generationRules: [{
        type: 'skill_based_generation',
        parameters: { skillTypes: ['logic', 'memory', 'analysis', 'creativity'] },
        constraints: { competitiveBalance: true, fairness: 0.9 },
      }],
      rewards: {
        experiencePoints: 500,
        virtualCurrency: { primary: 250, secondary: 10, premium: 1 },
        achievements: [],
        unlockContent: [],
        multipliers: { experience: 1.5, currency: 1.2 },
      },
      requirements: {
        minLevel: 5,
      },
      antiCheat: {
        maxActionsPerMinute: 45,
        suspiciousPatterns: ['pattern_recognition', 'bot_behavior', 'speed_hacking'],
        verificationRequired: true,
        monitoringLevel: 'high',
      },
      tags: ['competitive', 'weekly', 'skill-based'],
      isActive: true,
      featured: true,
    });

    // Social collaboration challenges
    this.challengeTemplates.set('team_collaboration', {
      title: 'Team Synergy Challenge',
      description: 'Work together with your team to solve complex problems',
      type: 'special',
      category: 'social',
      difficulty: 'expert',
      estimatedDuration: 180,
      generationRules: [{
        type: 'collaborative_generation',
        parameters: { teamSize: { min: 2, max: 6 }, collaboration: true },
        constraints: { requiresCommunication: true, individualContribution: false },
      }],
      rewards: {
        experiencePoints: 1000,
        virtualCurrency: { primary: 500, secondary: 25, premium: 3 },
        achievements: [],
        unlockContent: [],
        multipliers: { experience: 2, currency: 1.5 },
      },
      requirements: {
        minLevel: 10,
      },
      antiCheat: {
        maxActionsPerMinute: 60,
        suspiciousPatterns: ['solo_completion', 'communication_avoidance'],
        verificationRequired: true,
        monitoringLevel: 'high',
      },
      tags: ['social', 'teamwork', 'collaboration'],
      isActive: true,
      featured: true,
    });
  }

  // Dynamic Challenge Generation
  async generateChallenge(context: ChallengeGenerationContext): Promise<IChallenge> {
    try {
      // Select appropriate template based on context
      const template = this.selectTemplate(context);
      if (!template) {
        throw new Error('No suitable challenge template found');
      }

      // Generate challenge instance
      const challengeData = await this.generateChallengeInstance(template, context);

      const challenge = new Challenge({
        ...challengeData,
        schedule: {
          startDate: new Date(),
          endDate: this.calculateEndDate(template.type),
          timezone: 'UTC',
          isRecurring: template.type === 'daily' || template.type === 'weekly',
          recurrencePattern: this.getRecurrencePattern(template.type),
        },
        statistics: {
          totalParticipants: 0,
          completionRate: 0,
          averageScore: 0,
          averageDuration: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await challenge.save();
    } catch (error) {
      throw new Error(`Failed to generate challenge: ${error}`);
    }
  }

  private selectTemplate(context: ChallengeGenerationContext): ChallengeTemplate | null {
    // Filter templates based on user context and preferences
    const suitableTemplates: ChallengeTemplate[] = [];

    for (const template of this.challengeTemplates.values()) {
      if (!this.isTemplateSuitable(template, context)) {
        continue;
      }

      suitableTemplates.push(template);
    }

    if (suitableTemplates.length === 0) {
      return null;
    }

    // Return template that best matches user preferences
    return suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
  }

  private isTemplateSuitable(template: ChallengeTemplate, context: ChallengeGenerationContext): boolean {
    // Check level requirements
    if (template.requirements.minLevel && context.userLevel < template.requirements.minLevel) {
      return false;
    }

    // Check difficulty preference
    if (template.difficulty !== context.difficultyPreference) {
      return false;
    }

    // Check time availability
    if (template.estimatedDuration > context.timeAvailable) {
      return false;
    }

    return true;
  }

  private async generateChallengeInstance(
    template: ChallengeTemplate,
    context: ChallengeGenerationContext
  ): Promise<Partial<IChallenge>> {
    // Apply generation rules to create specific challenge instance
    const challengeData: Partial<IChallenge> = {
      title: template.title,
      description: template.description,
      type: template.type,
      category: template.category,
      difficulty: template.difficulty,
      estimatedDuration: template.estimatedDuration,
      generationRules: template.generationRules,
      rewards: template.rewards,
      requirements: template.requirements,
      antiCheat: template.antiCheat,
      tags: template.tags,
      isActive: template.isActive,
      featured: template.featured,
      participants: [],
      maxAttempts: 3,
      attemptsPerUser: 1,
      scoring: {
        type: 'points',
        formula: 'base_score + time_bonus',
        maxScore: 1000,
      },
    };

    // Apply dynamic adjustments based on user context
    challengeData.rewards = this.adjustRewardsForUser(challengeData.rewards!, context);

    return challengeData;
  }

  private adjustRewardsForUser(
    baseRewards: ChallengeTemplate['rewards'],
    context: ChallengeGenerationContext
  ): ChallengeTemplate['rewards'] {
    const adjustedRewards = { ...baseRewards };

    // Increase rewards for higher level users
    const levelMultiplier = 1 + (context.userLevel * 0.1);

    adjustedRewards.experiencePoints = Math.floor(adjustedRewards.experiencePoints * levelMultiplier);
    adjustedRewards.virtualCurrency.primary = Math.floor(adjustedRewards.virtualCurrency.primary * levelMultiplier);

    return adjustedRewards;
  }

  private calculateEndDate(type: ChallengeTemplate['type']): Date {
    const now = new Date();

    switch (type) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      default:
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour default
    }
  }

  private getRecurrencePattern(type: ChallengeTemplate['type']): string | undefined {
    switch (type) {
      case 'daily':
        return 'FREQ=DAILY;INTERVAL=1';
      case 'weekly':
        return 'FREQ=WEEKLY;INTERVAL=1';
      case 'monthly':
        return 'FREQ=MONTHLY;INTERVAL=1';
      default:
        return undefined;
    }
  }

  // Challenge Participation
  async startChallenge(
    userId: mongoose.Types.ObjectId,
    challengeId: mongoose.Types.ObjectId
  ): Promise<ChallengeAttempt | null> {
    try {
      const [profile, challenge] = await Promise.all([
        gamificationService.getUserProfile(userId),
        Challenge.findById(challengeId),
      ]);

      if (!profile || !challenge) {
        return null;
      }

      // Check if user can participate
      if (!this.canUserParticipate(profile, challenge)) {
        return null;
      }

      const attempt: ChallengeAttempt = {
        userId,
        challengeId,
        startTime: new Date(),
        score: 0,
        progress: 0,
        status: 'in_progress',
        metadata: {},
      };

      // Add user to challenge participants
      if (!challenge.participants.includes(userId)) {
        challenge.participants.push(userId);
        challenge.statistics.totalParticipants += 1;
        await challenge.save();
      }

      return attempt;
    } catch (error) {
      throw new Error(`Failed to start challenge: ${error}`);
    }
  }

  async completeChallenge(
    userId: mongoose.Types.ObjectId,
    challengeId: mongoose.Types.ObjectId,
    finalScore: number,
    metadata: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const [profile, challenge] = await Promise.all([
        gamificationService.getUserProfile(userId),
        Challenge.findById(challengeId),
      ]);

      if (!profile || !challenge) {
        return false;
      }

      // Calculate rewards
      const rewards = this.calculateChallengeRewards(challenge, finalScore, profile.level);

      // Update user profile
      await gamificationService.addExperience(userId, rewards.experiencePoints, 'challenge_completion');
      await gamificationService.addCurrency(userId, 'primary', rewards.virtualCurrency.primary, 'challenge_completion');

      // Update challenge statistics
      challenge.statistics.averageScore =
        ((challenge.statistics.averageScore * (challenge.statistics.totalParticipants - 1)) + finalScore) /
        challenge.statistics.totalParticipants;

      await challenge.save();

      // Trigger achievement checks
      await gamificationService.checkAchievements(userId);

      return true;
    } catch (error) {
      throw new Error(`Failed to complete challenge: ${error}`);
    }
  }

  private canUserParticipate(profile: IUserGamificationProfile, challenge: IChallenge): boolean {
    // Check level requirements
    if (challenge.requirements.minLevel && profile.level < challenge.requirements.minLevel) {
      return false;
    }

    // Check attempt limits
    const userAttempts = challenge.participants.filter(p => p.toString() === profile.userId.toString()).length;
    if (userAttempts >= challenge.attemptsPerUser) {
      return false;
    }

    return true;
  }

  private calculateChallengeRewards(
    challenge: IChallenge,
    score: number,
    userLevel: number
  ): { experiencePoints: number; virtualCurrency: { primary: number; secondary: number; premium: number } } {
    const baseRewards = challenge.rewards;

    // Apply score multiplier
    const scoreMultiplier = Math.min(score / challenge.scoring.maxScore, 2);

    return {
      experiencePoints: Math.floor(baseRewards.experiencePoints * scoreMultiplier * baseRewards.multipliers.experience),
      virtualCurrency: {
        primary: Math.floor(baseRewards.virtualCurrency.primary * scoreMultiplier * baseRewards.multipliers.currency),
        secondary: Math.floor(baseRewards.virtualCurrency.secondary * scoreMultiplier),
        premium: Math.floor(baseRewards.virtualCurrency.premium * scoreMultiplier),
      },
    };
  }

  // Challenge Management
  async getAvailableChallenges(userId: mongoose.Types.ObjectId): Promise<IChallenge[]> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return [];
      }

      const now = new Date();
      const challenges = await Challenge.find({
        'schedule.startDate': { $lte: now },
        'schedule.endDate': { $gte: now },
        isActive: true,
      });

      return challenges.filter(challenge => this.canUserParticipate(profile, challenge));
    } catch (error) {
      throw new Error(`Failed to get available challenges: ${error}`);
    }
  }

  async getChallengeProgress(
    userId: mongoose.Types.ObjectId,
    challengeId: mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return 0;
      }

      // This would return user's progress in the challenge
      // For now, return 0 as a placeholder
      return 0;
    } catch (error) {
      throw new Error(`Failed to get challenge progress: ${error}`);
    }
  }

  // Analytics and Reporting
  async getChallengeAnalytics(): Promise<{
    totalChallenges: number;
    activeChallenges: number;
    averageCompletionRate: number;
    popularCategories: { category: string; count: number }[];
    difficultyDistribution: { difficulty: string; count: number }[];
  }> {
    try {
      const challenges = await Challenge.find({ isActive: true });

      const totalChallenges = challenges.length;
      const activeChallenges = challenges.filter(c =>
        c.schedule.startDate <= new Date() && c.schedule.endDate >= new Date()
      ).length;

      const completionRates = challenges.map(c =>
        c.statistics.totalParticipants > 0 ? (c.statistics.completionRate || 0) : 0
      );

      const averageCompletionRate = completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
        : 0;

      // Category popularity
      const categoryCount: Record<string, number> = {};
      challenges.forEach(c => {
        categoryCount[c.category] = (categoryCount[c.category] || 0) + 1;
      });

      const popularCategories = Object.entries(categoryCount)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      // Difficulty distribution
      const difficultyCount: Record<string, number> = {};
      challenges.forEach(c => {
        difficultyCount[c.difficulty] = (difficultyCount[c.difficulty] || 0) + 1;
      });

      const difficultyDistribution = Object.entries(difficultyCount)
        .map(([difficulty, count]) => ({ difficulty, count }));

      return {
        totalChallenges,
        activeChallenges,
        averageCompletionRate,
        popularCategories,
        difficultyDistribution,
      };
    } catch (error) {
      throw new Error(`Failed to get challenge analytics: ${error}`);
    }
  }

  // Batch Operations
  async generateDailyChallenges(): Promise<IChallenge[]> {
    try {
      // This would generate daily challenges for all users
      // For now, return empty array as a placeholder
      return [];
    } catch (error) {
      throw new Error(`Failed to generate daily challenges: ${error}`);
    }
  }

  async cleanupExpiredChallenges(): Promise<number> {
    try {
      const now = new Date();
      const result = await Challenge.updateMany(
        { 'schedule.endDate': { $lt: now }, isActive: true },
        { isActive: false }
      );

      return result.modifiedCount;
    } catch (error) {
      throw new Error(`Failed to cleanup expired challenges: ${error}`);
    }
  }
}

// Export singleton instance
export const challengeEngine = ChallengeEngine.getInstance();
export default ChallengeEngine;