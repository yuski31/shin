import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import Leaderboard from '../../../../models/gamification/Leaderboard';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const scope = searchParams.get('scope');
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId');

    const filter: any = { isActive: true };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (scope) filter.scope = scope;

    const leaderboards = await Leaderboard.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .populate('rankings.userId', 'name email')
      .populate('rankings.teamId', 'name');

    // If userId is provided, get user's position in each leaderboard
    let userPositions = {};
    if (userId) {
      userPositions = await getUserLeaderboardPositions(new mongoose.Types.ObjectId(userId));
    }

    return NextResponse.json({
      success: true,
      data: {
        leaderboards,
        userPositions,
      },
    });
  } catch (error) {
    console.error('Error fetching leaderboards:', error);
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
    const {
      name,
      description,
      type,
      category,
      scope,
      metric,
      timeframe,
      scoring,
      antiCheat,
      requirements,
      prizes,
      isPublic,
      featured,
    } = body;

    // Validate required fields
    if (!name || !description || !type || !metric || !timeframe) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const leaderboard = new Leaderboard({
      name,
      description,
      type,
      category,
      scope: scope || 'individual',
      metric,
      timeframe,
      scoring: scoring || {
        primaryMetric: metric,
        secondaryMetrics: [],
        weightFormula: 'primary',
        normalizationMethod: 'none',
      },
      antiCheat: antiCheat || {
        suspiciousActivityThreshold: 100,
        verificationRequired: false,
        manualReviewRequired: false,
        automatedDetection: {
          rapidProgression: true,
          unusualPatterns: true,
          botDetection: true,
          duplicateAccounts: true,
        },
        penalties: {
          warning: true,
          temporaryBan: true,
          permanentBan: false,
          scoreReset: false,
        },
      },
      requirements: requirements || {},
      prizes: prizes || [],
      rankings: [],
      statistics: {
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        participationRate: 0,
        volatility: 0,
      },
      realTime: {
        isEnabled: false,
        updateFrequency: 30,
        liveTracking: false,
        spectatorMode: false,
      },
      isActive: true,
      isPublic: isPublic !== false,
      featured: featured || false,
      createdBy: new mongoose.Types.ObjectId(), // Would be actual user ID
      managedBy: [new mongoose.Types.ObjectId()], // Would be actual user ID
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedLeaderboard = await leaderboard.save();

    return NextResponse.json({
      success: true,
      data: savedLeaderboard,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating leaderboard:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getUserLeaderboardPositions(userId: mongoose.Types.ObjectId): Promise<Record<string, number>> {
  try {
    const leaderboards = await Leaderboard.find({ isActive: true });
    const positions: Record<string, number> = {};

    for (const leaderboard of leaderboards) {
      const userRanking = leaderboard.rankings.find(
        r => r.userId?.toString() === userId.toString()
      );

      if (userRanking) {
        positions[leaderboard._id.toString()] = userRanking.rank;
      } else {
        positions[leaderboard._id.toString()] = 0; // Not ranked
      }
    }

    return positions;
  } catch (error) {
    console.error('Error getting user leaderboard positions:', error);
    return {};
  }
}