import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import EmpathyEvent from '@/models/EmpathyEvent';
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
    const eventType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query: any = { userId: session.user.id };

    if (eventType) {
      query.eventType = eventType;
    }

    const events = await EmpathyEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .populate('participants.user', 'name email')
      .populate('participants.others', 'name email');

    const total = await EmpathyEvent.countDocuments(query);

    // Calculate empathy analytics
    const analytics = await calculateEmpathyAnalytics(session.user.id);

    return NextResponse.json({
      events,
      analytics,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching empathy events:', error);
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
      eventType,
      participants,
      emotionalData,
      culturalContext,
      contagionPrediction,
      interactionQuality
    } = body;

    // Validate required fields
    if (!eventType || !participants || !emotionalData) {
      return NextResponse.json(
        { error: 'Event type, participants, and emotional data are required' },
        { status: 400 }
      );
    }

    const newEvent = new EmpathyEvent({
      userId: session.user.id,
      eventType,
      participants: {
        user: session.user.id,
        ...participants,
      },
      emotionalData,
      culturalContext: {
        primaryCulture: 'general',
        translationNeeded: false,
        ...culturalContext,
      },
      contagionPrediction: {
        predicted: false,
        confidence: 0,
        direction: 'neutral',
        magnitude: 1,
        timeframe: 0,
        ...contagionPrediction,
      },
      interactionQuality: {
        empathyLevel: 5,
        connectionDepth: 5,
        mutualUnderstanding: 5,
        emotionalSafety: 5,
        outcome: 'neutral',
        ...interactionQuality,
      },
      metadata: {
        source: 'simulation',
        confidence: 0.5,
        dataQuality: 5,
      },
    });

    await newEvent.save();

    return NextResponse.json({
      message: 'Empathy event recorded successfully',
      event: newEvent,
    }, { status: 201 });

  } catch (error) {
    console.error('Error recording empathy event:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateEmpathyAnalytics(userId: string) {
  const recentEvents = await EmpathyEvent.find({ userId })
    .sort({ timestamp: -1 })
    .limit(50);

  if (recentEvents.length === 0) {
    return {
      averageEmpathyLevel: 0,
      mostCommonOutcome: 'none',
      culturalAdaptability: 0,
      emotionalContagionRate: 0,
      interactionTrends: [],
    };
  }

  const totalEmpathy = recentEvents.reduce((sum, event) => sum + event.interactionQuality.empathyLevel, 0);
  const averageEmpathyLevel = totalEmpathy / recentEvents.length;

  const outcomes = recentEvents.map(event => event.interactionQuality.outcome);
  const outcomeCounts = outcomes.reduce((acc: any, outcome) => {
    acc[outcome] = (acc[outcome] || 0) + 1;
    return acc;
  }, {});
  const mostCommonOutcome = Object.entries(outcomeCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'none';

  const positiveEvents = outcomes.filter(outcome => outcome === 'positive').length;
  const emotionalContagionRate = (positiveEvents / recentEvents.length) * 100;

  const culturalTranslations = recentEvents.filter(event => event.culturalContext.translationNeeded);
  const culturalAdaptability = culturalTranslations.length > 0
    ? (culturalTranslations.filter(t => t.culturalContext.translationAccuracy > 0.7).length / culturalTranslations.length) * 100
    : 100;

  return {
    averageEmpathyLevel: Math.round(averageEmpathyLevel * 10) / 10,
    mostCommonOutcome,
    culturalAdaptability: Math.round(culturalAdaptability * 10) / 10,
    emotionalContagionRate: Math.round(emotionalContagionRate * 10) / 10,
    interactionTrends: [
      `${positiveEvents} positive interactions out of ${recentEvents.length} recent events`,
      `${recentEvents.length} total interactions analyzed`,
      `${culturalTranslations.length} cultural translations needed`,
    ],
  };
}