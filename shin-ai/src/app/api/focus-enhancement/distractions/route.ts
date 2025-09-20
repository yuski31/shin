import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';
import DistractionEvent from '../../../../models/DistractionEvent';
import { getDistractionBlocker } from '../../../../lib/focus-enhancement/distraction-blocker';

// GET /api/focus-enhancement/distractions - Get distraction events
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const eventType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sessionId = searchParams.get('sessionId');

    // Build filter
    const filter: any = { userId: session.user.id };
    if (eventType) filter.eventType = eventType;
    if (sessionId) filter.sessionId = sessionId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get distraction events
    const events = await DistractionEvent.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Get analytics
    const analytics = await DistractionEvent.getDistractionAnalytics(
      new mongoose.Types.ObjectId(session.user.id),
      startDate ? new Date(startDate) : new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      endDate ? new Date(endDate) : new Date()
    );

    // Get patterns
    const patterns = await DistractionEvent.getDistractionPatterns(
      new mongoose.Types.ObjectId(session.user.id),
      startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      endDate ? new Date(endDate) : new Date()
    );

    return NextResponse.json({
      events,
      analytics,
      patterns,
      summary: {
        totalEvents: events.length,
        dateRange: {
          start: startDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching distraction events:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/focus-enhancement/distractions - Log a new distraction event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventType,
      source,
      severity,
      duration,
      context,
      response,
      blocking,
      impact,
      patterns,
      metadata,
    } = body;

    // Validate required fields
    if (!eventType || !source || typeof severity !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Check if this distraction should be blocked
    let blockingDecision = null;
    try {
      const distractionBlocker = getDistractionBlocker();
      blockingDecision = await distractionBlocker.shouldBlockDistraction(
        eventType,
        source.application || source.category,
        severity,
        {
          userId: session.user.id,
          currentActivity: context?.activityBefore,
          flowStateLevel: context?.currentFlowState,
          cognitiveLoad: context?.cognitiveLoad,
          mentalFatigue: context?.mentalFatigue,
          timeOfDay: new Date().toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          }),
          dayOfWeek: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
          sessionActive: !!context?.sessionId,
          sessionType: context?.sessionType,
        }
      );
    } catch (error) {
      console.error('Error checking distraction blocking:', error);
    }

    // Create distraction event
    const distractionEvent = new DistractionEvent({
      userId: session.user.id,
      organization: session.user.organizationId || 'default',
      sessionId: context?.sessionId || null,
      eventType,
      severity,
      duration: duration || 0,
      timestamp: new Date(),
      source,
      context: context || {},
      response: response || {
        action: 'logged',
        responseTime: 0,
      },
      blocking: blocking || {
        wasBlocked: blockingDecision?.shouldBlock || false,
        blockingRule: blockingDecision?.rule?.id,
        blockSuccess: blockingDecision?.shouldBlock || false,
      },
      impact: impact || {
        focusDisruption: severity * 10,
        productivityLoss: severity * 5,
        flowStateDrop: severity * 2,
      },
      patterns: patterns || {
        frequency: 1,
        timeSinceLast: 0,
        recurring: false,
        peakHours: [],
      },
      metadata: metadata || {
        deviceType: 'api',
        location: 'auto-detected',
      },
    });

    await distractionEvent.save();

    return NextResponse.json({
      event: distractionEvent,
      blockingDecision,
    }, { status: 201 });
  } catch (error) {
    console.error('Error logging distraction event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}