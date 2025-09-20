import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import Team from '../../../../models/gamification/Team';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const isPublic = searchParams.get('isPublic');
    const isRecruiting = searchParams.get('isRecruiting');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');

    const filter: any = {};

    if (type) filter.type = type;
    if (isPublic !== null) filter.isPublic = isPublic === 'true';
    if (isRecruiting !== null) filter['social.isRecruiting'] = isRecruiting === 'true';

    const teams = await Team.find(filter)
      .sort({ 'stats.totalMembers': -1, createdAt: -1 })
      .limit(limit)
      .populate('founder', 'name email')
      .populate('members.userId', 'name email');

    // If userId is provided, get user's teams
    let userTeams = [];
    if (userId) {
      const profile = await gamificationService.getUserProfile(new mongoose.Types.ObjectId(userId));
      if (profile) {
        userTeams = await Team.find({ _id: { $in: profile.teams } })
          .populate('founder', 'name email')
          .populate('members.userId', 'name email');
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        teams,
        userTeams,
      },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
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
      tag,
      type,
      maxMembers,
      minMembers,
      isPublic,
      requiresApproval,
      preferences,
      social,
    } = body;

    // Validate required fields
    if (!name || !description || !tag) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if tag is already taken
    const existingTeam = await Team.findOne({ tag: tag.toUpperCase() });
    if (existingTeam) {
      return NextResponse.json({ error: 'Team tag already taken' }, { status: 409 });
    }

    // Get user ID from session (placeholder)
    const founderId = new mongoose.Types.ObjectId();

    const teamData = {
      name,
      description,
      tag: tag.toUpperCase(),
      type: type || 'casual',
      maxMembers: maxMembers || 50,
      minMembers: minMembers || 1,
      isPublic: isPublic !== false,
      requiresApproval: requiresApproval || false,
      preferences: preferences || {
        skillFocus: [],
        activityLevel: 'medium',
        timeZone: 'UTC',
        preferredPlayTimes: [],
        competitiveLevel: 'casual',
      },
      social: social || {
        isRecruiting: false,
        socialLinks: {},
        showcase: {
          achievements: [],
          highlights: [],
          featuredMembers: [],
        },
      },
    };

    const team = await gamificationService.createTeam(founderId, teamData);

    return NextResponse.json({
      success: true,
      data: team,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}