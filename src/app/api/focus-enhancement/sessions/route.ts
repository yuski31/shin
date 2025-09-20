import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';
import FocusSession from '../../../../models/FocusSession';
import { getDistractionBlocker } from '../../../../lib/focus-enhancement/distraction-blocker';
import { getDeepWorkEnvironment } from '../../../../lib/focus-enhancement/deep-work-environment';

// GET /api/focus-enhancement/sessions - Get user's focus sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const type = searchParams.get('type');

    // Build filter
    const filter: any = { userId: session.user.id };
    if (status) filter.status = status;
    if (type) filter.sessionType = type;

    // Get sessions with pagination
    const sessions = await FocusSession.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('protocolId', 'name')
      .lean();

    // Get total count for pagination
    const total = await FocusSession.countDocuments(filter);

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit,
      },
    });
  } catch (error) {
    console.error('Error fetching focus sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/focus-enhancement/sessions - Create a new focus session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      sessionType,
      focusMode,
      duration,
      intensity,
      distractionBlocking,
      ambientEnvironment,
      timeDilationFactor,
      focusAreas,
    } = body;

    // Validate required fields
    if (!sessionType || !focusMode || !duration) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new focus session
    const newSession = new FocusSession({
      userId: session.user.id,
      organization: session.user.organizationId || 'default',
      protocolId: 'focus-enhancement-protocol', // Default protocol
      sessionType,
      status: 'active',
      startTime: new Date(),
      duration,
      settings: {
        intensity: intensity || 5,
        focusMode,
        duration,
        distractionBlocking: distractionBlocking !== false, // Default to true
        ambientEnvironment: ambientEnvironment || 'white-noise',
        timeDilationFactor: timeDilationFactor || 1.0,
        focusAreas: focusAreas || [],
        safetyLimits: {
          maxIntensity: 10,
          maxDuration: 480,
          minBreakInterval: 15,
        },
      },
      metrics: {
        attentionScore: 0,
        cognitiveLoad: 20,
        flowStateLevel: 0,
        distractionCount: 0,
        focusQuality: 0,
        timePerceptionRatio: timeDilationFactor || 1.0,
      },
      results: {
        productivityScore: 0,
        tasksCompleted: 0,
        focusTimeRatio: 0,
        improvementScore: 0,
        sessionEffectiveness: 0,
      },
      safety: {
        eyeStrainLevel: 0,
        mentalFatigue: 0,
        consentGiven: true,
        lastSafetyCheck: new Date(),
        emergencyStop: false,
      },
      distractions: {
        blockedDistractions: 0,
        distractionPatterns: [],
        distractionTypes: {
          notifications: 0,
          externalInterruptions: 0,
          internalThoughts: 0,
          environmental: 0,
        },
      },
    });

    await newSession.save();

    // Start the focus enhancement services
    try {
      if (distractionBlocking !== false) {
        const distractionBlocker = getDistractionBlocker();
        // Initialize blocking for this user
      }

      if (focusMode === 'ambient-enhancement' || focusMode === 'time-dilation') {
        const deepWorkEnv = getDeepWorkEnvironment();
        // Initialize environment session
      }
    } catch (error) {
      console.error('Error initializing focus services:', error);
    }

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('Error creating focus session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}