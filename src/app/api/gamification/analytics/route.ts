import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import { achievementEngine } from '../../../../lib/gamification/AchievementEngine';
import { challengeEngine } from '../../../../lib/gamification/ChallengeEngine';
import { tournamentEngine } from '../../../../lib/gamification/TournamentEngine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const period = searchParams.get('period') || '7d';

    let analytics;

    switch (type) {
      case 'overview':
        analytics = await getOverviewAnalytics();
        break;

      case 'achievements':
        analytics = await achievementEngine.getAchievementAnalytics();
        break;

      case 'challenges':
        analytics = await challengeEngine.getChallengeAnalytics();
        break;

      case 'tournaments':
        analytics = await tournamentEngine.getTournamentAnalytics();
        break;

      case 'leaderboards':
        analytics = await getLeaderboardAnalytics();
        break;

      default:
        analytics = await getOverviewAnalytics();
    }

    return NextResponse.json({
      success: true,
      data: analytics,
      period,
    });
  } catch (error) {
    console.error('Error fetching gamification analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverviewAnalytics() {
  try {
    const [
      gamificationStats,
      achievementAnalytics,
      challengeAnalytics,
      tournamentAnalytics,
    ] = await Promise.all([
      gamificationService.getGamificationStats(),
      achievementEngine.getAchievementAnalytics(),
      challengeEngine.getChallengeAnalytics(),
      tournamentEngine.getTournamentAnalytics(),
    ]);

    return {
      overview: {
        totalUsers: gamificationStats.totalUsers,
        activeUsers: gamificationStats.activeUsers,
        averageLevel: gamificationStats.averageLevel,
        totalCurrencyCirculation: gamificationStats.totalCurrencyCirculation,
      },
      achievements: {
        total: achievementAnalytics.totalAchievements,
        active: achievementAnalytics.activeAchievements,
        averageCompletionRate: achievementAnalytics.averageCompletionRate,
      },
      challenges: {
        total: challengeAnalytics.totalChallenges,
        active: challengeAnalytics.activeChallenges,
        averageCompletionRate: challengeAnalytics.averageCompletionRate,
      },
      tournaments: {
        total: tournamentAnalytics.totalTournaments,
        active: tournamentAnalytics.activeTournaments,
        averageParticipants: tournamentAnalytics.averageParticipants,
        completionRate: tournamentAnalytics.completionRate,
      },
      trends: {
        userGrowth: await getUserGrowthData(),
        engagement: await getEngagementData(),
        popularFeatures: await getPopularFeaturesData(),
      },
    };
  } catch (error) {
    throw new Error(`Failed to get overview analytics: ${error}`);
  }
}

async function getLeaderboardAnalytics() {
  try {
    // This would aggregate data from all leaderboards
    // For now, return placeholder data
    return {
      totalLeaderboards: 0,
      activeLeaderboards: 0,
      totalParticipants: 0,
      averageParticipantsPerLeaderboard: 0,
      popularMetrics: [],
      antiCheatStats: {
        suspiciousActivities: 0,
        resolvedCases: 0,
        activeInvestigations: 0,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get leaderboard analytics: ${error}`);
  }
}

async function getUserGrowthData() {
  try {
    // This would return user growth over time
    // For now, return placeholder data
    return {
      daily: [],
      weekly: [],
      monthly: [],
    };
  } catch (error) {
    throw new Error(`Failed to get user growth data: ${error}`);
  }
}

async function getEngagementData() {
  try {
    // This would return engagement metrics
    // For now, return placeholder data
    return {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      averageSessionDuration: 0,
      retentionRate: {
        day1: 0,
        day7: 0,
        day30: 0,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get engagement data: ${error}`);
  }
}

async function getPopularFeaturesData() {
  try {
    // This would return feature usage statistics
    // For now, return placeholder data
    return {
      mostUsedFeatures: [],
      featureAdoptionRates: {},
      userPreferences: {},
    };
  } catch (error) {
    throw new Error(`Failed to get popular features data: ${error}`);
  }
}