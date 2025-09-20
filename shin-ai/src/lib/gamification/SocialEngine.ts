import mongoose from 'mongoose';
import Team, { ITeam } from '../../models/gamification/Team';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import Challenge, { IChallenge } from '../../models/gamification/Challenge';
import { gamificationService } from './GamificationService';

export interface TeamMatchingCriteria {
  skillFocus: string[];
  activityLevel: 'low' | 'medium' | 'high' | 'competitive';
  timeZone: string;
  preferredPlayTimes: string[];
  competitiveLevel: 'casual' | 'competitive' | 'professional';
  teamSize: number;
  maxDistance?: number; // For location-based matching
}

export interface PeerChallengeRequest {
  challengerId: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId;
  challengeType: 'direct' | 'random' | 'skill_based';
  skillCategory?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  wager?: {
    currency: 'primary' | 'secondary' | 'premium';
    amount: number;
  };
  customRules?: Record<string, any>;
}

export interface SocialShare {
  userId: mongoose.Types.ObjectId;
  contentType: 'achievement' | 'challenge' | 'tournament' | 'level_up' | 'team_victory';
  contentId: mongoose.Types.ObjectId;
  platform: 'twitter' | 'discord' | 'facebook' | 'linkedin' | 'internal';
  message: string;
  metadata: Record<string, any>;
  viralMetrics: {
    shares: number;
    likes: number;
    comments: number;
    reach: number;
  };
}

export interface MentorshipMatch {
  mentorId: mongoose.Types.ObjectId;
  menteeId: mongoose.Types.ObjectId;
  skillFocus: string[];
  matchScore: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  metadata: Record<string, any>;
}

export class SocialEngine {
  private static instance: SocialEngine;

  private constructor() {}

  public static getInstance(): SocialEngine {
    if (!SocialEngine.instance) {
      SocialEngine.instance = new SocialEngine();
    }
    return SocialEngine.instance;
  }

  // Team Formation with Matching Algorithms
  async findTeamMatches(
    userId: mongoose.Types.ObjectId,
    criteria: TeamMatchingCriteria,
    limit: number = 10
  ): Promise<ITeam[]> {
    try {
      const userProfile = await gamificationService.getUserProfile(userId);
      if (!userProfile) {
        return [];
      }

      // Build matching query
      const matchQuery: any = {
        isPublic: true,
        'social.isRecruiting': true,
        'members.userId': { $ne: userId }, // Not already a member
      };

      // Skill focus matching
      if (criteria.skillFocus.length > 0) {
        matchQuery['preferences.skillFocus'] = {
          $in: criteria.skillFocus
        };
      }

      // Activity level matching
      if (criteria.activityLevel) {
        matchQuery['preferences.activityLevel'] = criteria.activityLevel;
      }

      // Competitive level matching
      if (criteria.competitiveLevel) {
        matchQuery['preferences.competitiveLevel'] = criteria.competitiveLevel;
      }

      // Team size constraints
      if (criteria.teamSize) {
        matchQuery.maxMembers = { $gte: criteria.teamSize };
        matchQuery['stats.totalMembers'] = { $lt: criteria.teamSize };
      }

      const teams = await Team.find(matchQuery)
        .sort({ 'stats.totalMembers': -1, createdAt: -1 })
        .limit(limit);

      // Calculate match scores
      const teamsWithScores = teams.map(team => ({
        team,
        matchScore: this.calculateTeamMatchScore(userProfile, team, criteria),
      }));

      // Sort by match score and return teams
      return teamsWithScores
        .sort((a, b) => b.matchScore - a.matchScore)
        .map(item => item.team);
    } catch (error) {
      throw new Error(`Failed to find team matches: ${error}`);
    }
  }

  private calculateTeamMatchScore(
    userProfile: IUserGamificationProfile,
    team: ITeam,
    criteria: TeamMatchingCriteria
  ): number {
    let score = 0;

    // Skill focus match (40% weight)
    const skillMatches = criteria.skillFocus.filter(skill =>
      team.preferences.skillFocus.includes(skill)
    ).length;
    score += (skillMatches / criteria.skillFocus.length) * 40;

    // Activity level match (20% weight)
    if (userProfile.stats.sessionsCompleted > 100 && team.preferences.activityLevel === 'competitive') {
      score += 20;
    } else if (userProfile.stats.sessionsCompleted > 50 && team.preferences.activityLevel === 'high') {
      score += 15;
    } else if (userProfile.stats.sessionsCompleted > 20 && team.preferences.activityLevel === 'medium') {
      score += 10;
    } else if (team.preferences.activityLevel === 'low') {
      score += 5;
    }

    // Competitive level match (20% weight)
    if (userProfile.level > 25 && team.preferences.competitiveLevel === 'professional') {
      score += 20;
    } else if (userProfile.level > 15 && team.preferences.competitiveLevel === 'competitive') {
      score += 15;
    } else if (userProfile.level > 5 && team.preferences.competitiveLevel === 'casual') {
      score += 10;
    }

    // Team size compatibility (10% weight)
    const availableSlots = team.maxMembers - team.stats.totalMembers;
    if (availableSlots >= criteria.teamSize) {
      score += 10;
    } else if (availableSlots > 0) {
      score += 5;
    }

    // Team activity and engagement (10% weight)
    const recentActivity = team.activity.lastActivity.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;
    if (recentActivity) {
      score += 10;
    }

    return Math.min(score, 100);
  }

  // Peer Challenges with Skill-based Pairing
  async createPeerChallenge(request: PeerChallengeRequest): Promise<IChallenge | null> {
    try {
      const challengerProfile = await gamificationService.getUserProfile(request.challengerId);
      const targetProfile = await gamificationService.getUserProfile(request.targetId);

      if (!challengerProfile || !targetProfile) {
        return null;
      }

      // Validate wager if provided
      if (request.wager) {
        const balance = challengerProfile.virtualCurrency[request.wager.currency as keyof typeof challengerProfile.virtualCurrency];
        if (balance < request.wager.amount) {
          return null;
        }
      }

      // Generate skill-based challenge
      const challengeData = await this.generatePeerChallenge(request, challengerProfile, targetProfile);

      const challenge = new Challenge({
        ...challengeData,
        participants: [request.challengerId, request.targetId],
        schedule: {
          startDate: new Date(),
          endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          timezone: 'UTC',
          isRecurring: false,
        },
        statistics: {
          totalParticipants: 2,
          completionRate: 0,
          averageScore: 0,
          averageDuration: 0,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await challenge.save();
    } catch (error) {
      throw new Error(`Failed to create peer challenge: ${error}`);
    }
  }

  private async generatePeerChallenge(
    request: PeerChallengeRequest,
    challengerProfile: IUserGamificationProfile,
    targetProfile: IUserGamificationProfile
  ): Promise<Partial<IChallenge>> {
    // Calculate appropriate difficulty based on both players
    const averageLevel = (challengerProfile.level + targetProfile.level) / 2;
    const difficulty = this.calculateChallengeDifficulty(averageLevel);

    // Generate challenge based on skill category
    const skillCategory = request.skillCategory || this.selectRandomSkillCategory();

    return {
      title: `Peer Challenge: ${skillCategory}`,
      description: `A skill-based challenge between ${challengerProfile.userId} and ${targetProfile.userId}`,
      type: 'special',
      category: 'competitive',
      difficulty,
      estimatedDuration: 45,
      generationRules: [{
        type: 'skill_based_generation',
        parameters: { skillCategory, balanced: true },
        constraints: { fairness: 0.9 },
      }],
      rewards: {
        experiencePoints: 200,
        virtualCurrency: {
          primary: 100,
          secondary: 5,
          premium: 0,
        },
        achievements: [],
        unlockContent: [],
        multipliers: { experience: 1.5, currency: 1.2 },
      },
      requirements: {
        minLevel: Math.min(challengerProfile.level, targetProfile.level),
      },
      antiCheat: {
        maxActionsPerMinute: 45,
        suspiciousPatterns: ['pattern_recognition', 'speed_hacking'],
        verificationRequired: true,
        monitoringLevel: 'high',
      },
      tags: ['peer_challenge', 'competitive', skillCategory],
      isActive: true,
      featured: false,
    };
  }

  private calculateChallengeDifficulty(averageLevel: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
    if (averageLevel < 5) return 'beginner';
    if (averageLevel < 15) return 'intermediate';
    if (averageLevel < 25) return 'advanced';
    return 'expert';
  }

  private selectRandomSkillCategory(): string {
    const categories = ['logic', 'memory', 'analysis', 'creativity', 'strategy', 'reflexes'];
    return categories[Math.floor(Math.random() * categories.length)];
  }

  // Social Sharing with Viral Mechanics
  async createSocialShare(share: SocialShare): Promise<SocialShare> {
    try {
      // This would integrate with social media APIs
      // For now, simulate viral mechanics

      const enhancedShare: SocialShare = {
        ...share,
        viralMetrics: {
          shares: 0,
          likes: 0,
          comments: 0,
          reach: 1, // Starting with the sharer
        },
      };

      // Apply viral bonuses based on content type
      await this.applyViralBonuses(share.userId, share.contentType);

      return enhancedShare;
    } catch (error) {
      throw new Error(`Failed to create social share: ${error}`);
    }
  }

  private async applyViralBonuses(userId: mongoose.Types.ObjectId, contentType: SocialShare['contentType']): Promise<void> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return;
      }

      // Grant viral sharing rewards
      let bonusXP = 25;
      let bonusCurrency = 10;

      switch (contentType) {
        case 'achievement':
          bonusXP = 50;
          bonusCurrency = 25;
          break;
        case 'tournament':
          bonusXP = 100;
          bonusCurrency = 50;
          break;
        case 'team_victory':
          bonusXP = 75;
          bonusCurrency = 30;
          break;
      }

      await gamificationService.addExperience(userId, bonusXP, 'viral_sharing');
      await gamificationService.addCurrency(userId, 'primary', bonusCurrency, 'viral_sharing');

      // Update social interaction stats
      profile.stats.socialInteractions += 1;
      profile.stats.contentShared += 1;
      await profile.save();
    } catch (error) {
      console.error('Failed to apply viral bonuses:', error);
    }
  }

  // Mentorship Programs with Pairing
  async findMentorshipMatches(
    userId: mongoose.Types.ObjectId,
    isMentor: boolean,
    skillFocus?: string[]
  ): Promise<MentorshipMatch[]> {
    try {
      const userProfile = await gamificationService.getUserProfile(userId);
      if (!userProfile) {
        return [];
      }

      const searchCriteria = isMentor ? {
        level: { $lt: userProfile.level },
        'stats.sessionsCompleted': { $lt: userProfile.stats.sessionsCompleted },
      } : {
        level: { $gt: userProfile.level },
        'stats.sessionsCompleted': { $gt: userProfile.stats.sessionsCompleted },
      };

      const potentialMatches = await UserGamificationProfile.find(searchCriteria)
        .limit(20);

      const matches: MentorshipMatch[] = [];

      for (const match of potentialMatches) {
        const matchScore = this.calculateMentorshipMatchScore(
          userProfile,
          match,
          skillFocus || []
        );

        if (matchScore > 60) { // Minimum match threshold
          matches.push({
            mentorId: isMentor ? userId : match.userId,
            menteeId: isMentor ? match.userId : userId,
            skillFocus: skillFocus || [],
            matchScore,
            status: 'pending',
            createdAt: new Date(),
            metadata: {
              compatibility: matchScore,
              sharedInterests: this.findSharedInterests(userProfile, match),
            },
          });
        }
      }

      return matches.sort((a, b) => b.matchScore - a.matchScore);
    } catch (error) {
      throw new Error(`Failed to find mentorship matches: ${error}`);
    }
  }

  private calculateMentorshipMatchScore(
    user1: IUserGamificationProfile,
    user2: IUserGamificationProfile,
    skillFocus: string[]
  ): number {
    let score = 0;

    // Level difference (30% weight)
    const levelDiff = Math.abs(user1.level - user2.level);
    if (levelDiff >= 5 && levelDiff <= 15) {
      score += 30;
    } else if (levelDiff >= 3 && levelDiff <= 20) {
      score += 20;
    } else if (levelDiff >= 2) {
      score += 10;
    }

    // Activity compatibility (25% weight)
    const activityDiff = Math.abs(user1.stats.sessionsCompleted - user2.stats.sessionsCompleted);
    if (activityDiff < 50) {
      score += 25;
    } else if (activityDiff < 100) {
      score += 15;
    } else if (activityDiff < 200) {
      score += 10;
    }

    // Achievement compatibility (25% weight)
    const achievementDiff = Math.abs(user1.achievements.length - user2.achievements.length);
    if (achievementDiff < 5) {
      score += 25;
    } else if (achievementDiff < 10) {
      score += 15;
    } else if (achievementDiff < 20) {
      score += 10;
    }

    // Skill focus alignment (20% weight)
    if (skillFocus.length > 0) {
      // This would check skill alignment based on user data
      score += 15; // Placeholder
    }

    return Math.min(score, 100);
  }

  private findSharedInterests(
    user1: IUserGamificationProfile,
    user2: IUserGamificationProfile
  ): string[] {
    // This would analyze user activity and preferences to find shared interests
    // For now, return placeholder
    return ['learning', 'challenges'];
  }

  // Community Events with Live Streaming
  async createCommunityEvent(
    organizerId: mongoose.Types.ObjectId,
    eventData: {
      name: string;
      description: string;
      type: 'tournament' | 'workshop' | 'social' | 'competition';
      maxParticipants: number;
      scheduledTime: Date;
      duration: number;
      isStreamed: boolean;
      requirements?: Record<string, any>;
    }
  ): Promise<any> {
    try {
      const organizer = await gamificationService.getUserProfile(organizerId);
      if (!organizer) {
        throw new Error('Organizer not found');
      }

      // This would create a community event
      // For now, return event structure
      const event = {
        id: new mongoose.Types.ObjectId(),
        ...eventData,
        organizerId,
        participants: [],
        status: 'planned',
        createdAt: new Date(),
        liveStream: eventData.isStreamed ? {
          isActive: false,
          viewerCount: 0,
          chatEnabled: true,
          recordingEnabled: true,
        } : null,
      };

      return event;
    } catch (error) {
      throw new Error(`Failed to create community event: ${error}`);
    }
  }

  // Social Analytics
  async getSocialAnalytics(userId: mongoose.Types.ObjectId): Promise<{
    socialScore: number;
    influence: number;
    engagement: number;
    networkSize: number;
    viralImpact: number;
    recommendations: string[];
  }> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        throw new Error('User profile not found');
      }

      // Calculate social metrics
      const socialScore = this.calculateSocialScore(profile);
      const influence = this.calculateInfluence(profile);
      const engagement = this.calculateEngagement(profile);
      const networkSize = profile.teams.length + profile.mentorships.asMentor.length + profile.mentorships.asMentee.length;
      const viralImpact = profile.stats.socialInteractions * 0.1 + profile.stats.contentShared * 0.5;

      return {
        socialScore,
        influence,
        engagement,
        networkSize,
        viralImpact,
        recommendations: this.generateSocialRecommendations(profile),
      };
    } catch (error) {
      throw new Error(`Failed to get social analytics: ${error}`);
    }
  }

  private calculateSocialScore(profile: IUserGamificationProfile): number {
    const baseScore = profile.level * 2;
    const activityBonus = Math.min(profile.stats.sessionsCompleted * 0.1, 20);
    const achievementBonus = profile.achievements.length * 5;
    const socialBonus = profile.stats.socialInteractions * 2;

    return Math.min(baseScore + activityBonus + achievementBonus + socialBonus, 1000);
  }

  private calculateInfluence(profile: IUserGamificationProfile): number {
    const teamInfluence = profile.teams.length * 10;
    const mentorshipInfluence = (profile.mentorships.asMentor.length + profile.mentorships.asMentee.length) * 15;
    const achievementInfluence = profile.achievements.length * 3;

    return Math.min(teamInfluence + mentorshipInfluence + achievementInfluence, 500);
  }

  private calculateEngagement(profile: IUserGamificationProfile): number {
    const dailyEngagement = profile.stats.sessionsCompleted / Math.max(profile.stats.totalPlayTime / 60, 1);
    const socialEngagement = profile.stats.socialInteractions / Math.max(profile.stats.sessionsCompleted, 1);

    return Math.min((dailyEngagement + socialEngagement) * 50, 100);
  }

  private generateSocialRecommendations(profile: IUserGamificationProfile): string[] {
    const recommendations: string[] = [];

    if (profile.teams.length === 0) {
      recommendations.push('Join a team to increase social engagement');
    }

    if (profile.mentorships.asMentor.length === 0 && profile.level > 10) {
      recommendations.push('Consider becoming a mentor to help other users');
    }

    if (profile.stats.socialInteractions < profile.stats.sessionsCompleted * 0.5) {
      recommendations.push('Share more achievements to increase social presence');
    }

    if (profile.achievements.length > 5 && profile.stats.contentShared < 3) {
      recommendations.push('Share your achievements on social media for bonus rewards');
    }

    return recommendations;
  }

  // Batch Social Operations
  async processSocialRewards(): Promise<void> {
    try {
      // This would process daily/weekly social rewards
      // For now, it's a placeholder
      console.log('Processing social rewards...');
    } catch (error) {
      throw new Error(`Failed to process social rewards: ${error}`);
    }
  }

  async updateSocialMetrics(): Promise<void> {
    try {
      // This would update social metrics for all users
      // For now, it's a placeholder
      console.log('Updating social metrics...');
    } catch (error) {
      throw new Error(`Failed to update social metrics: ${error}`);
    }
  }
}

// Export singleton instance
export const socialEngine = SocialEngine.getInstance();
export default SocialEngine;