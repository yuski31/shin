import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { challengeEngine } from '../../../../lib/gamification/ChallengeEngine';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import Challenge from '../../../../models/gamification/Challenge';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const userId = searchParams.get('userId');

    // Get user ID from email (this would be replaced with actual user lookup)
    const currentUserId = new mongoose.Types.ObjectId(); // Placeholder

    let challenges;

    if (userId) {
      // Get challenges for specific user
      challenges = await challengeEngine.getAvailableChallenges(new mongoose.Types.ObjectId(userId));
    } else {
      // Get all challenges with filters
      const filter: any = { isActive: true };

      if (category) filter.category = category;
      if (difficulty) filter.difficulty = difficulty;
      if (type) filter.type = type;
      if (featured === 'true') filter.featured = true;

      challenges = await Challenge.find(filter)
        .sort({ featured: -1, createdAt: -1 })
        .limit(50);
    }

    return NextResponse.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
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
      title,
      description,
      type,
      category,
      difficulty,
      estimatedDuration,
      generationRules,
      rewards,
      requirements,
      antiCheat,
      tags,
      featured,
    } = body;

    // Validate required fields
    if (!title || !description || !type || !category || !difficulty) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const challengeTemplate = {
      title,
      description,
      type,
      category,
      difficulty,
      estimatedDuration: estimatedDuration || 30,
      generationRules: generationRules || [],
      rewards: rewards || {
        experiencePoints: 100,
        virtualCurrency: { primary: 50, secondary: 0, premium: 0 },
        achievements: [],
        unlockContent: [],
        multipliers: { experience: 1, currency: 1 },
      },
      requirements: requirements || {},
      antiCheat: antiCheat || {
        maxActionsPerMinute: 30,
        suspiciousPatterns: [],
        verificationRequired: false,
        monitoringLevel: 'medium',
      },
      tags: tags || [],
      isActive: true,
      featured: featured || false,
    };

    // Get user context for dynamic generation
    const userId = new mongoose.Types.ObjectId(); // Placeholder
    const profile = await gamificationService.getUserProfile(userId);

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const context = {
      userId,
      userLevel: profile.level,
      userSkills: [], // Would be populated from user data
      recentActivity: [], // Would be populated from user activity
      preferences: {},
      difficultyPreference: difficulty,
      timeAvailable: estimatedDuration,
    };

    const challenge = await challengeEngine.generateChallenge(context);

    return NextResponse.json({
      success: true,
      data: challenge,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating challenge:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}