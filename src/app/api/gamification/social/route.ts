import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { socialEngine } from '../../../../lib/gamification/SocialEngine';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const profile = await gamificationService.getUserProfile(new mongoose.Types.ObjectId(userId));
    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    switch (action) {
      case 'team_matches':
        const skillFocus = searchParams.get('skillFocus')?.split(',') || [];
        const activityLevel = searchParams.get('activityLevel') as any;
        const competitiveLevel = searchParams.get('competitiveLevel') as any;

        const teamMatches = await socialEngine.findTeamMatches(
          new mongoose.Types.ObjectId(userId),
          {
            skillFocus,
            activityLevel,
            timeZone: 'UTC',
            preferredPlayTimes: [],
            competitiveLevel,
            teamSize: 4,
          }
        );

        return NextResponse.json({
          success: true,
          data: teamMatches,
        });

      case 'mentorship_matches':
        const isMentor = searchParams.get('isMentor') === 'true';
        const skillFocusParam = searchParams.get('skillFocus')?.split(',') || [];

        const mentorshipMatches = await socialEngine.findMentorshipMatches(
          new mongoose.Types.ObjectId(userId),
          isMentor,
          skillFocusParam
        );

        return NextResponse.json({
          success: true,
          data: mentorshipMatches,
        });

      case 'analytics':
        const socialAnalytics = await socialEngine.getSocialAnalytics(new mongoose.Types.ObjectId(userId));

        return NextResponse.json({
          success: true,
          data: socialAnalytics,
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error fetching social data:', error);
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
    const { action, userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    switch (action) {
      case 'create_peer_challenge':
        const { targetId, challengeType, skillCategory, difficulty, wager } = body;

        if (!targetId) {
          return NextResponse.json({ error: 'Target ID required' }, { status: 400 });
        }

        const challengeRequest = {
          challengerId: new mongoose.Types.ObjectId(userId),
          targetId: new mongoose.Types.ObjectId(targetId),
          challengeType: challengeType || 'skill_based',
          skillCategory,
          difficulty,
          wager,
        };

        const challenge = await socialEngine.createPeerChallenge(challengeRequest);

        if (!challenge) {
          return NextResponse.json({ error: 'Failed to create challenge' }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          data: challenge,
        }, { status: 201 });

      case 'create_community_event':
        const { name, description, type, maxParticipants, scheduledTime, duration, isStreamed } = body;

        if (!name || !description || !type) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const event = await socialEngine.createCommunityEvent(
          new mongoose.Types.ObjectId(userId),
          {
            name,
            description,
            type,
            maxParticipants,
            scheduledTime: new Date(scheduledTime),
            duration,
            isStreamed,
          }
        );

        return NextResponse.json({
          success: true,
          data: event,
        }, { status: 201 });

      case 'share_achievement':
        const { contentType, contentId, platform, message } = body;

        if (!contentType || !contentId || !platform) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const share = {
          userId: new mongoose.Types.ObjectId(userId),
          contentType,
          contentId: new mongoose.Types.ObjectId(contentId),
          platform,
          message,
          metadata: {},
          viralMetrics: {
            shares: 0,
            likes: 0,
            comments: 0,
            reach: 0,
          },
        };

        const socialShare = await socialEngine.createSocialShare(share);

        return NextResponse.json({
          success: true,
          data: socialShare,
        }, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error processing social action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}