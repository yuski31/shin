import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import EmotionalSession from '@/models/EmotionalSession';
import connectDB from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const sessionType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: any = { userId: session.user.id };

    if (sessionType) {
      query.sessionType = sessionType;
    }

    const sessions = await EmotionalSession.find(query)
      .sort({ startTime: -1 })
      .limit(limit)
      .skip(offset)
      .populate('userId', 'name email');

    const total = await EmotionalSession.countDocuments(query);

    return NextResponse.json({
      sessions,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching emotional sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const {
      sessionType,
      emotionalState,
      interventions = [],
      metadata = {},
      safetyFlags = {}
    } = body;

    // Validate required fields
    if (!sessionType || !emotionalState) {
      return NextResponse.json(
        { error: 'Session type and emotional state are required' },
        { status: 400 }
      );
    }

    const newSession = new EmotionalSession({
      userId: session.user.id,
      sessionType,
      emotionalState,
      interventions,
      metadata,
      safetyFlags: {
        crisisDetected: false,
        professionalHelpRecommended: false,
        sessionPaused: false,
        ...safetyFlags
      },
    });

    await newSession.save();

    return NextResponse.json({
      message: 'Emotional session created successfully',
      session: newSession,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating emotional session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}