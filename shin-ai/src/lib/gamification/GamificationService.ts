import mongoose from 'mongoose';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import Achievement, { IAchievement } from '../../models/gamification/Achievement';
import Challenge, { IChallenge } from '../../models/gamification/Challenge';
import Tournament, { ITournament } from '../../models/gamification/Tournament';
import Team, { ITeam } from '../../models/gamification/Team';
import { SkillTree, ISkillTree } from '../../models/gamification/SkillTree';
import VirtualCurrency, { IVirtualCurrency } from '../../models/gamification/VirtualCurrency';
import Leaderboard, { ILeaderboard } from '../../models/gamification/Leaderboard';
import TournamentMatch, { ITournamentMatch } from '../../models/gamification/TournamentMatch';

export interface GamificationConfig {
  experienceCurve: {
    baseXP: number;
    growthFactor: number;
    maxLevel: number;
  };
  currencyInflation: {
    dailyInflationRate: number;
    maxInflationRate: number;
    adjustmentInterval: number; // hours
  };
  antiCheat: {
    maxActionsPerMinute: number;
    suspiciousScoreThreshold: number;
    autoModerationEnabled: boolean;
  };
  social: {
    maxTeamSize: number;
    maxMentorships: number;
    socialRewardMultiplier: number;
  };
}

export interface AchievementProgress {
  achievementId: mongoose.Types.ObjectId;
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: Date;
}

export interface LevelProgress {
  currentLevel: number;
  currentXP: number;
  xpToNext: number;
  progressPercentage: number;
}

export interface GamificationStats {
  totalUsers: number;
  activeUsers: number;
  totalAchievements: number;
  totalChallenges: number;
  totalTournaments: number;
  totalTeams: number;
  averageLevel: number;
  totalCurrencyCirculation: number;
}

export class GamificationService {
  private config: GamificationConfig;

  constructor(config: Partial<GamificationConfig> = {}) {
    this.config = {
      experienceCurve: {
        baseXP: 100,
        growthFactor: 1.5,
        maxLevel: 100,
        ...config.experienceCurve,
      },
      currencyInflation: {
        dailyInflationRate: 0.001,
        maxInflationRate: 0.05,
        adjustmentInterval: 24,
        ...config.currencyInflation,
      },
      antiCheat: {
        maxActionsPerMinute: 60,
        suspiciousScoreThreshold: 100,
        autoModerationEnabled: true,
        ...config.antiCheat,
      },
      social: {
        maxTeamSize: 50,
        maxMentorships: 5,
        socialRewardMultiplier: 1.2,
        ...config.social,
      },
    };
  }

  // User Profile Management
  async createUserProfile(userId: mongoose.Types.ObjectId): Promise<IUserGamificationProfile> {
    try {
      const profile = new UserGamificationProfile({
        userId,
        level: 1,
        experiencePoints: 0,
        experiencePointsToNext: this.calculateXPForLevel(2),
        virtualCurrency: {
          primary: 100, // Starting currency
          secondary: 0,
          premium: 0,
        },
        stats: {
          totalPlayTime: 0,
          sessionsCompleted: 0,
          challengesWon: 0,
          challengesLost: 0,
          tournamentsParticipated: 0,
          tournamentsWon: 0,
          socialInteractions: 0,
          contentShared: 0,
        },
        currentSeason: this.getCurrentSeason(),
        seasonPoints: 0,
        prestigeLevel: 0,
        prestigeResets: 0,
        leaderboardPositions: {
          global: 0,
          weekly: 0,
          monthly: 0,
          seasonal: 0,
          category: {},
        },
      });

      return await profile.save();
    } catch (error) {
      throw new Error(`Failed to create user gamification profile: ${error}`);
    }
  }

  async getUserProfile(userId: mongoose.Types.ObjectId): Promise<IUserGamificationProfile | null> {
    try {
      return await UserGamificationProfile.findOne({ userId }).populate('achievements');
    } catch (error) {
      throw new Error(`Failed to get user gamification profile: ${error}`);
    }
  }

  async updateUserProfile(
    userId: mongoose.Types.ObjectId,
    updates: Partial<IUserGamificationProfile>
  ): Promise<IUserGamificationProfile | null> {
    try {
      return await UserGamificationProfile.findOneAndUpdate(
        { userId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to update user gamification profile: ${error}`);
    }
  }

  // Experience and Leveling System
  async addExperience(
    userId: mongoose.Types.ObjectId,
    xpAmount: number,
    source: string = 'unknown'
  ): Promise<LevelProgress> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const oldLevel = profile.level;
      profile.experiencePoints += xpAmount;
      profile.totalExperienceEarned += xpAmount;

      // Check for level ups
      while (profile.experiencePoints >= profile.experiencePointsToNext && profile.level < this.config.experienceCurve.maxLevel) {
        profile.level += 1;
        profile.experiencePoints -= profile.experiencePointsToNext;
        profile.experiencePointsToNext = this.calculateXPForLevel(profile.level + 1);

        // Level up rewards
        await this.grantLevelUpRewards(profile, profile.level);
      }

      await profile.save();

      return {
        currentLevel: profile.level,
        currentXP: profile.experiencePoints,
        xpToNext: profile.experiencePointsToNext,
        progressPercentage: (profile.experiencePoints / profile.experiencePointsToNext) * 100,
      };
    } catch (error) {
      throw new Error(`Failed to add experience: ${error}`);
    }
  }

  private calculateXPForLevel(level: number): number {
    return Math.floor(this.config.experienceCurve.baseXP * Math.pow(this.config.experienceCurve.growthFactor, level - 1));
  }

  private async grantLevelUpRewards(profile: IUserGamificationProfile, newLevel: number): Promise<void> {
    // Grant currency rewards
    const currencyReward = Math.floor(50 * newLevel);
    profile.virtualCurrency.primary += currencyReward;

    // Unlock new content/achievements based on level
    // This would be expanded based on specific game requirements

    await profile.save();
  }

  // Achievement System
  async checkAchievements(userId: mongoose.Types.ObjectId): Promise<IAchievement[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      const achievements = await Achievement.find({ isActive: true });
      const newAchievements: IAchievement[] = [];

      for (const achievement of achievements) {
        if (profile.achievements.includes(achievement._id)) {
          continue; // Already earned
        }

        const progress = this.calculateAchievementProgress(profile, achievement);
        if (progress >= achievement.maxProgress) {
          await this.grantAchievement(profile, achievement);
          newAchievements.push(achievement);
        }
      }

      return newAchievements;
    } catch (error) {
      throw new Error(`Failed to check achievements: ${error}`);
    }
  }

  private calculateAchievementProgress(profile: IUserGamificationProfile, achievement: IAchievement): number {
    // This would implement the specific logic for each achievement type
    // For now, return 0 as a placeholder
    return 0;
  }

  private async grantAchievement(profile: IUserGamificationProfile, achievement: IAchievement): Promise<void> {
    profile.achievements.push(achievement._id);
    profile.experiencePoints += achievement.rewards.experiencePoints;
    profile.virtualCurrency.primary += achievement.rewards.virtualCurrency.primary;
    profile.virtualCurrency.secondary += achievement.rewards.virtualCurrency.secondary;
    profile.virtualCurrency.premium += achievement.rewards.virtualCurrency.premium;

    // Add to achievement progress
    profile.achievementProgress.push({
      achievementId: achievement._id,
      progress: achievement.maxProgress,
      maxProgress: achievement.maxProgress,
      completed: true,
      completedAt: new Date(),
    });

    await profile.save();
  }

  // Virtual Currency Management
  async addCurrency(
    userId: mongoose.Types.ObjectId,
    currencyType: 'primary' | 'secondary' | 'premium',
    amount: number,
    source: string = 'unknown'
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      profile.virtualCurrency[currencyType] += amount;

      // Apply inflation adjustment if needed
      await this.applyInflationAdjustment();

      await profile.save();
    } catch (error) {
      throw new Error(`Failed to add currency: ${error}`);
    }
  }

  async spendCurrency(
    userId: mongoose.Types.ObjectId,
    currencyType: 'primary' | 'secondary' | 'premium',
    amount: number,
    purpose: string = 'unknown'
  ): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      if (profile.virtualCurrency[currencyType] < amount) {
        return false; // Insufficient funds
      }

      profile.virtualCurrency[currencyType] -= amount;
      await profile.save();
      return true;
    } catch (error) {
      throw new Error(`Failed to spend currency: ${error}`);
    }
  }

  private async applyInflationAdjustment(): Promise<void> {
    // This would implement inflation control logic
    // For now, it's a placeholder
  }

  // Social Features
  async createTeam(
    founderId: mongoose.Types.ObjectId,
    teamData: Partial<ITeam>
  ): Promise<ITeam> {
    try {
      const founderProfile = await this.getUserProfile(founderId);
      if (!founderProfile) {
        throw new Error('Founder profile not found');
      }

      const team = new Team({
        ...teamData,
        founder: founderId,
        members: [{
          userId: founderId,
          role: 'founder',
          joinedAt: new Date(),
          permissions: ['all'],
        }],
        stats: {
          totalMembers: 1,
          activeMembers: 1,
          challengesCompleted: 0,
          tournamentsWon: 0,
          totalScore: 0,
          averageLevel: founderProfile.level,
        },
        currentSeason: this.getCurrentSeason(),
      });

      const savedTeam = await team.save();

      // Add team to founder's profile
      founderProfile.teams.push(savedTeam._id);
      await founderProfile.save();

      return savedTeam;
    } catch (error) {
      throw new Error(`Failed to create team: ${error}`);
    }
  }

  async joinTeam(userId: mongoose.Types.ObjectId, teamId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const [profile, team] = await Promise.all([
        this.getUserProfile(userId),
        Team.findById(teamId),
      ]);

      if (!profile || !team) {
        throw new Error('Profile or team not found');
      }

      if (team.members.length >= team.maxMembers) {
        return false; // Team is full
      }

      team.members.push({
        userId,
        role: 'member',
        joinedAt: new Date(),
        permissions: ['basic'],
      });

      team.stats.totalMembers += 1;
      team.stats.activeMembers += 1;
      team.stats.averageLevel = this.calculateTeamAverageLevel(team);

      profile.teams.push(teamId);

      await Promise.all([team.save(), profile.save()]);
      return true;
    } catch (error) {
      throw new Error(`Failed to join team: ${error}`);
    }
  }

  private calculateTeamAverageLevel(team: ITeam): number {
    // This would calculate the average level of team members
    // For now, return 1 as a placeholder
    return 1;
  }

  // Statistics and Analytics
  async getGamificationStats(): Promise<GamificationStats> {
    try {
      const [
        totalUsers,
        activeUsers,
        totalAchievements,
        totalChallenges,
        totalTournaments,
        totalTeams,
        averageLevelResult,
        currencyResult,
      ] = await Promise.all([
        UserGamificationProfile.countDocuments(),
        UserGamificationProfile.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
        Achievement.countDocuments(),
        Challenge.countDocuments(),
        Tournament.countDocuments(),
        Team.countDocuments(),
        UserGamificationProfile.aggregate([{ $group: { _id: null, avgLevel: { $avg: '$level' } } }]),
        VirtualCurrency.aggregate([{ $group: { _id: null, totalSupply: { $sum: '$currentSupply' } } }]),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalAchievements,
        totalChallenges,
        totalTournaments,
        totalTeams,
        averageLevel: averageLevelResult[0]?.avgLevel || 0,
        totalCurrencyCirculation: currencyResult[0]?.totalSupply || 0,
      };
    } catch (error) {
      throw new Error(`Failed to get gamification stats: ${error}`);
    }
  }

  // Utility Methods
  private getCurrentSeason(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const season = Math.floor(month / 3) + 1;
    return `season_${year}_${season}`;
  }

  // Leaderboard Management
  async updateLeaderboard(
    leaderboardId: mongoose.Types.ObjectId,
    rankings: { userId: mongoose.Types.ObjectId; score: number }[]
  ): Promise<void> {
    try {
      const leaderboard = await Leaderboard.findById(leaderboardId);
      if (!leaderboard) {
        throw new Error('Leaderboard not found');
      }

      // Sort rankings by score
      const sortedRankings = rankings
        .sort((a, b) => b.score - a.score)
        .map((item, index) => ({
          rank: index + 1,
          userId: item.userId,
          score: item.score,
          change: 0, // Would calculate change from previous period
          trend: 'stable' as const,
          metadata: {},
        }));

      leaderboard.rankings = sortedRankings;
      leaderboard.statistics.totalParticipants = rankings.length;
      leaderboard.statistics.averageScore = rankings.reduce((sum, item) => sum + item.score, 0) / rankings.length;

      await leaderboard.save();
    } catch (error) {
      throw new Error(`Failed to update leaderboard: ${error}`);
    }
  }

  // Anti-Cheating System
  async reportSuspiciousActivity(
    userId: mongoose.Types.ObjectId,
    activityType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // This would implement anti-cheating logic
      // For now, it's a placeholder

      await profile.save();
    } catch (error) {
      throw new Error(`Failed to report suspicious activity: ${error}`);
    }
  }
}

// Export singleton instance
export const gamificationService = new GamificationService();
export default GamificationService;