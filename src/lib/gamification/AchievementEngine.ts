import mongoose from 'mongoose';
import Achievement, { IAchievement } from '../../models/gamification/Achievement';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import { gamificationService } from './GamificationService';

export interface AchievementTemplate {
  name: string;
  description: string;
  icon: string;
  category: 'gameplay' | 'social' | 'progression' | 'special' | 'seasonal';
  type: 'progress' | 'completion' | 'social' | 'time_based' | 'score_based';
  requirements: {
    type: string;
    target: number;
    metric: string;
    comparison: 'gte' | 'lte' | 'eq' | 'between';
  }[];
  rewards: {
    experiencePoints: number;
    virtualCurrency: {
      primary: number;
      secondary: number;
      premium: number;
    };
    unlockContent?: mongoose.Types.ObjectId[];
    specialPrivileges?: string[];
  };
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  maxProgress: number;
  season?: string;
  event?: string;
  isRepeatable: boolean;
  cooldownHours?: number;
}

export interface AchievementProgressUpdate {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  progress: number;
  metadata?: Record<string, any>;
}

export class AchievementEngine {
  private static instance: AchievementEngine;
  private achievementTemplates: Map<string, AchievementTemplate> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): AchievementEngine {
    if (!AchievementEngine.instance) {
      AchievementEngine.instance = new AchievementEngine();
    }
    return AchievementEngine.instance;
  }

  // Template Management
  private initializeDefaultTemplates(): void {
    // Level-based achievements
    this.achievementTemplates.set('first_level', {
      name: 'Getting Started',
      description: 'Reach level 2',
      icon: '🎯',
      category: 'progression',
      type: 'progress',
      requirements: [{
        type: 'level',
        target: 2,
        metric: 'level',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 50,
        virtualCurrency: { primary: 25, secondary: 0, premium: 0 },
      },
      rarity: 'common',
      maxProgress: 2,
      isRepeatable: false,
    });

    this.achievementTemplates.set('level_10', {
      name: 'Rising Star',
      description: 'Reach level 10',
      icon: '⭐',
      category: 'progression',
      type: 'progress',
      requirements: [{
        type: 'level',
        target: 10,
        metric: 'level',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 500,
        virtualCurrency: { primary: 250, secondary: 10, premium: 0 },
      },
      rarity: 'uncommon',
      maxProgress: 10,
      isRepeatable: false,
    });

    this.achievementTemplates.set('level_25', {
      name: 'Veteran Explorer',
      description: 'Reach level 25',
      icon: '🏆',
      category: 'progression',
      type: 'progress',
      requirements: [{
        type: 'level',
        target: 25,
        metric: 'level',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 2500,
        virtualCurrency: { primary: 1000, secondary: 50, premium: 5 },
      },
      rarity: 'rare',
      maxProgress: 25,
      isRepeatable: false,
    });

    // Challenge-based achievements
    this.achievementTemplates.set('first_challenge', {
      name: 'Challenge Accepted',
      description: 'Complete your first challenge',
      icon: '⚔️',
      category: 'gameplay',
      type: 'completion',
      requirements: [{
        type: 'challenges_completed',
        target: 1,
        metric: 'challenges_completed',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 100,
        virtualCurrency: { primary: 50, secondary: 0, premium: 0 },
      },
      rarity: 'common',
      maxProgress: 1,
      isRepeatable: false,
    });

    this.achievementTemplates.set('challenge_master', {
      name: 'Challenge Master',
      description: 'Complete 50 challenges',
      icon: '👑',
      category: 'gameplay',
      type: 'progress',
      requirements: [{
        type: 'challenges_completed',
        target: 50,
        metric: 'challenges_completed',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 1000,
        virtualCurrency: { primary: 500, secondary: 25, premium: 2 },
      },
      rarity: 'epic',
      maxProgress: 50,
      isRepeatable: false,
    });

    // Social achievements
    this.achievementTemplates.set('team_player', {
      name: 'Team Player',
      description: 'Join a team',
      icon: '🤝',
      category: 'social',
      type: 'completion',
      requirements: [{
        type: 'team_joined',
        target: 1,
        metric: 'team_joined',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 75,
        virtualCurrency: { primary: 30, secondary: 0, premium: 0 },
      },
      rarity: 'common',
      maxProgress: 1,
      isRepeatable: false,
    });

    this.achievementTemplates.set('mentor', {
      name: 'Wise Mentor',
      description: 'Help 10 users as a mentor',
      icon: '🎓',
      category: 'social',
      type: 'progress',
      requirements: [{
        type: 'mentorships_provided',
        target: 10,
        metric: 'mentorships_provided',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 750,
        virtualCurrency: { primary: 300, secondary: 15, premium: 1 },
      },
      rarity: 'rare',
      maxProgress: 10,
      isRepeatable: false,
    });

    // Time-based achievements
    this.achievementTemplates.set('daily_streak_7', {
      name: 'Week Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      category: 'gameplay',
      type: 'progress',
      requirements: [{
        type: 'daily_streak',
        target: 7,
        metric: 'daily_streak',
        comparison: 'gte',
      }],
      rewards: {
        experiencePoints: 350,
        virtualCurrency: { primary: 150, secondary: 5, premium: 0 },
      },
      rarity: 'uncommon',
      maxProgress: 7,
      isRepeatable: true,
      cooldownHours: 24,
    });

    this.achievementTemplates.set('early_adopter', {
      name: 'Early Adopter',
      description: 'Join during the first season',
      icon: '🌟',
      category: 'special',
      type: 'completion',
      requirements: [{
        type: 'season_participation',
        target: 1,
        metric: 'season_participation',
        comparison: 'eq',
      }],
      rewards: {
        experiencePoints: 200,
        virtualCurrency: { primary: 100, secondary: 0, premium: 3 },
      },
      rarity: 'rare',
      maxProgress: 1,
      season: 'season_1',
      isRepeatable: false,
    });
  }

  // Achievement Creation and Management
  async createAchievement(template: AchievementTemplate): Promise<IAchievement> {
    try {
      const achievement = new Achievement({
        ...template,
        isActive: true,
        isHidden: false,
        currentProgress: 0,
        timesEarned: 0,
        uniqueEarners: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await achievement.save();
    } catch (error) {
      throw new Error(`Failed to create achievement: ${error}`);
    }
  }

  async generateDynamicAchievement(
    userId: mongoose.Types.ObjectId,
    eventType: string,
    metadata: Record<string, any>
  ): Promise<IAchievement | null> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return null;
      }

      // Generate achievement based on user behavior and event type
      const dynamicAchievement = await this.createDynamicAchievementTemplate(eventType, metadata, profile);

      if (dynamicAchievement) {
        return await this.createAchievement(dynamicAchievement);
      }

      return null;
    } catch (error) {
      throw new Error(`Failed to generate dynamic achievement: ${error}`);
    }
  }

  private async createDynamicAchievementTemplate(
    eventType: string,
    metadata: Record<string, any>,
    profile: IUserGamificationProfile
  ): Promise<AchievementTemplate | null> {
    // This would implement dynamic achievement generation logic
    // For now, return null as a placeholder
    return null;
  }

  // Progress Tracking and Updates
  async updateProgress(updates: AchievementProgressUpdate[]): Promise<void> {
    try {
      for (const update of updates) {
        await this.updateUserAchievementProgress(update);
      }
    } catch (error) {
      throw new Error(`Failed to update achievement progress: ${error}`);
    }
  }

  private async updateUserAchievementProgress(update: AchievementProgressUpdate): Promise<void> {
    try {
      const profile = await gamificationService.getUserProfile(update.userId);
      if (!profile) {
        return;
      }

      // Find or create progress entry
      let progressEntry = profile.achievementProgress.find(
        p => p.achievementId.toString() === update.achievementId.toString()
      );

      if (!progressEntry) {
        const achievement = await Achievement.findById(update.achievementId);
        if (!achievement) {
          return;
        }

        progressEntry = {
          achievementId: update.achievementId,
          progress: 0,
          maxProgress: achievement.maxProgress,
          completed: false,
        };
        profile.achievementProgress.push(progressEntry);
      }

      // Update progress
      progressEntry.progress = Math.min(update.progress, progressEntry.maxProgress);

      // Check for completion
      if (progressEntry.progress >= progressEntry.maxProgress && !progressEntry.completed) {
        progressEntry.completed = true;
        progressEntry.completedAt = new Date();

        // Grant achievement rewards
        const achievement = await Achievement.findById(update.achievementId);
        if (achievement) {
          await this.grantAchievement(profile, achievement);
        }
      }

      await profile.save();
    } catch (error) {
      throw new Error(`Failed to update user achievement progress: ${error}`);
    }
  }

  private async grantAchievement(profile: IUserGamificationProfile, achievement: IAchievement): Promise<void> {
    // Add to user's achievements
    if (!profile.achievements.includes(achievement._id)) {
      profile.achievements.push(achievement._id);
    }

    // Grant rewards
    profile.experiencePoints += achievement.rewards.experiencePoints;
    profile.virtualCurrency.primary += achievement.rewards.virtualCurrency.primary;
    profile.virtualCurrency.secondary += achievement.rewards.virtualCurrency.secondary;
    profile.virtualCurrency.premium += achievement.rewards.virtualCurrency.premium;

    // Update achievement statistics
    achievement.timesEarned += 1;
    achievement.currentProgress = Math.min(achievement.currentProgress + 1, achievement.maxProgress);

    // Check if user is new unique earner
    const existingProfiles = await UserGamificationProfile.find({
      achievements: achievement._id,
      _id: { $ne: profile._id }
    });

    if (existingProfiles.length === 0) {
      achievement.uniqueEarners += 1;
    }

    await Promise.all([profile.save(), achievement.save()]);
  }

  // Batch Processing
  async processBatchProgressUpdates(updates: AchievementProgressUpdate[]): Promise<void> {
    try {
      // Group updates by user for efficiency
      const updatesByUser = new Map<mongoose.Types.ObjectId, AchievementProgressUpdate[]>();

      for (const update of updates) {
        if (!updatesByUser.has(update.userId)) {
          updatesByUser.set(update.userId, []);
        }
        updatesByUser.get(update.userId)!.push(update);
      }

      // Process each user's updates
      for (const [userId, userUpdates] of updatesByUser) {
        await this.processUserBatchUpdate(userId, userUpdates);
      }
    } catch (error) {
      throw new Error(`Failed to process batch progress updates: ${error}`);
    }
  }

  private async processUserBatchUpdate(
    userId: mongoose.Types.ObjectId,
    updates: AchievementProgressUpdate[]
  ): Promise<void> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return;
      }

      for (const update of updates) {
        const progressEntry = profile.achievementProgress.find(
          p => p.achievementId.toString() === update.achievementId.toString()
        );

        if (progressEntry) {
          progressEntry.progress = Math.min(update.progress, progressEntry.maxProgress);

          if (progressEntry.progress >= progressEntry.maxProgress && !progressEntry.completed) {
            progressEntry.completed = true;
            progressEntry.completedAt = new Date();
          }
        }
      }

      await profile.save();
    } catch (error) {
      throw new Error(`Failed to process user batch update: ${error}`);
    }
  }

  // Analytics and Reporting
  async getAchievementAnalytics(): Promise<{
    totalAchievements: number;
    activeAchievements: number;
    averageCompletionRate: number;
    popularAchievements: IAchievement[];
    rareAchievements: IAchievement[];
  }> {
    try {
      const achievements = await Achievement.find({ isActive: true });

      const totalAchievements = achievements.length;
      const activeAchievements = achievements.filter(a => a.isActive).length;

      const completionRates = achievements.map(a =>
        a.timesEarned > 0 ? (a.timesEarned / a.uniqueEarners) * 100 : 0
      );

      const averageCompletionRate = completionRates.length > 0
        ? completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
        : 0;

      const popularAchievements = achievements
        .sort((a, b) => b.timesEarned - a.timesEarned)
        .slice(0, 10);

      const rareAchievements = achievements
        .filter(a => a.rarity === 'legendary' || a.rarity === 'epic')
        .sort((a, b) => b.uniqueEarners - a.uniqueEarners);

      return {
        totalAchievements,
        activeAchievements,
        averageCompletionRate,
        popularAchievements,
        rareAchievements,
      };
    } catch (error) {
      throw new Error(`Failed to get achievement analytics: ${error}`);
    }
  }

  // Utility Methods
  async getUserAchievements(userId: mongoose.Types.ObjectId): Promise<IAchievement[]> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return [];
      }

      return await Achievement.find({ _id: { $in: profile.achievements } });
    } catch (error) {
      throw new Error(`Failed to get user achievements: ${error}`);
    }
  }

  async getAchievementProgress(
    userId: mongoose.Types.ObjectId,
    achievementId: mongoose.Types.ObjectId
  ): Promise<number> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return 0;
      }

      const progressEntry = profile.achievementProgress.find(
        p => p.achievementId.toString() === achievementId.toString()
      );

      return progressEntry?.progress || 0;
    } catch (error) {
      throw new Error(`Failed to get achievement progress: ${error}`);
    }
  }
}

// Export singleton instance
export const achievementEngine = AchievementEngine.getInstance();
export default AchievementEngine;