import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { achievementEngine } from '../../../../lib/gamification/AchievementEngine';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import Achievement from '../../../../models/gamification/Achievement';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    let achievements;

    if (userId) {
      // Get user's achievements
      const profile = await gamificationService.getUserProfile(new mongoose.Types.ObjectId(userId));
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      achievements = await achievementEngine.getUserAchievements(new mongoose.Types.ObjectId(userId));
    } else {
      // Get all achievements with filters
      const filter: any = { isActive: true };

      if (category) filter.category = category;
      if (rarity) filter.rarity = rarity;
      if (type) filter.type = type;

      achievements = await Achievement.find(filter).sort({ createdAt: -1 });
    }

    return NextResponse.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
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
      icon,
      category,
      type,
      requirements,
      rewards,
      rarity,
      maxProgress,
      season,
      event,
      isRepeatable,
      cooldownHours,
    } = body;

    // Validate required fields
    if (!name || !description || !category || !type || !requirements || !rewards) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const achievementTemplate = {
      name,
      description,
      icon: icon || '🏆',
      category,
      type,
      requirements,
      rewards,
      rarity: rarity || 'common',
      maxProgress: maxProgress || 1,
      season,
      event,
      isRepeatable: isRepeatable || false,
      cooldownHours,
    };

    const achievement = await achievementEngine.createAchievement(achievementTemplate);

    return NextResponse.json({
      success: true,
      data: achievement,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}