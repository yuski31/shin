import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import { achievementEngine } from '../../../../lib/gamification/AchievementEngine';
import { challengeEngine } from '../../../../lib/gamification/ChallengeEngine';
import { tournamentEngine } from '../../../../lib/gamification/TournamentEngine';
import UserGamificationProfile from '../../../../models/gamification/UserGamificationProfile';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from email (this would be replaced with actual user lookup)
    const userId = new mongoose.Types.ObjectId(); // Placeholder

    const profile = await gamificationService.getUserProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        profile: {
          level: profile.level,
          experiencePoints: profile.experiencePoints,
          experiencePointsToNext: profile.experiencePointsToNext,
          virtualCurrency: profile.virtualCurrency,
          stats: profile.stats,
          currentSeason: profile.currentSeason,
          seasonPoints: profile.seasonPoints,
          prestigeLevel: profile.prestigeLevel,
          leaderboardPositions: profile.leaderboardPositions,
        },
        achievements: await achievementEngine.getUserAchievements(userId),
        availableChallenges: await challengeEngine.getAvailableChallenges(userId),
      },
    });
  } catch (error) {
    console.error('Error fetching gamification profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount, currencyType } = body;

    // Get user ID from email (this would be replaced with actual user lookup)
    const userId = new mongoose.Types.ObjectId(); // Placeholder

    switch (action) {
      case 'add_experience':
        const levelProgress = await gamificationService.addExperience(userId, amount, 'manual_grant');
        return NextResponse.json({
          success: true,
          data: { levelProgress },
        });

      case 'add_currency':
        await gamificationService.addCurrency(userId, currencyType, amount, 'manual_grant');
        return NextResponse.json({
          success: true,
          data: { message: 'Currency added successfully' },
        });

      case 'spend_currency':
        const success = await gamificationService.spendCurrency(userId, currencyType, amount, 'manual_spend');
        return NextResponse.json({
          success,
          data: { message: success ? 'Currency spent successfully' : 'Insufficient funds' },
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating gamification profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}