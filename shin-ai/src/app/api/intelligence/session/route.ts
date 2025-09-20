import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import IntelligenceSession from '@/models/IntelligenceSession';
import EnhancementProtocol from '@/models/EnhancementProtocol';
import { getIQBoostingEngine } from '@/lib/intelligence-amplification/iq-boosting-engine';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const query: any = { userId };
    if (status) {
      query.status = status;
    }

    const sessions = await IntelligenceSession.find(query)
      .populate('protocolId', 'name category')
      .sort({ startTime: -1 })
      .limit(50);

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Error fetching intelligence sessions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const body = await request.json();
    const { protocolId, sessionType, settings } = body;

    if (!protocolId || !sessionType) {
      return NextResponse.json({ error: 'Protocol ID and session type required' }, { status: 400 });
    }

    // Verify protocol exists and is accessible
    const protocol = await EnhancementProtocol.findOne({
      _id: protocolId,
      isActive: true
    });

    if (!protocol) {
      return NextResponse.json({ error: 'Protocol not found or inactive' }, { status: 404 });
    }

    // Create intelligence session
    const intelligenceSession = new IntelligenceSession({
      userId: session.user.id,
      organization: session.user.organization,
      protocolId,
      sessionType,
      settings: {
        intensity: settings?.intensity || 5,
        frequency: settings?.frequency || 10,
        duration: settings?.duration || 30,
        focusAreas: settings?.focusAreas || ['general'],
        safetyLimits: {
          maxIntensity: settings?.safetyLimits?.maxIntensity || 8,
          maxDuration: settings?.safetyLimits?.maxDuration || 60,
          minRestPeriod: settings?.safetyLimits?.minRestPeriod || 4
        }
      },
      metrics: {
        cognitiveLoad: 0,
        neuralActivity: 0,
        performanceScore: 0,
        stressLevel: 0
      },
      safety: {
        consentGiven: true,
        lastSafetyCheck: new Date(),
        emergencyStop: false
      }
    });

    await intelligenceSession.save();

    // Start IQ boosting engine session
    const iqEngine = getIQBoostingEngine();
    try {
      const engineSession = iqEngine.startSession(
        session.user.id,
        sessionType === 'iq-boost' ? 'gamma-focus' : 'theta-creativity'
      );

      return NextResponse.json({
        session: intelligenceSession,
        engineSession: {
          id: engineSession.id,
          pattern: engineSession.pattern,
          currentPhase: engineSession.currentPhase
        }
      });
    } catch (engineError) {
      console.error('IQ Engine error:', engineError);
      // Continue with database session even if engine fails
      return NextResponse.json({
        session: intelligenceSession,
        warning: 'Engine initialization failed, session created in database only'
      });
    }
  } catch (error) {
    console.error('Error creating intelligence session:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}