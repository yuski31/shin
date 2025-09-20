import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import MoodMetric from '@/models/MoodMetric';
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
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const timeframe = searchParams.get('timeframe') || '7d'; // 7d, 30d, 90d, 1y

    // Calculate date range based on timeframe
    const now = new Date();
    let startDate: Date;

    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const metrics = await MoodMetric.find({
      userId: session.user.id,
      timestamp: { $gte: startDate }
    })
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset);

    const total = await MoodMetric.countDocuments({
      userId: session.user.id,
      timestamp: { $gte: startDate }
    });

    // Calculate trends and insights
    const trends = await calculateMoodTrends(session.user.id, startDate);
    const insights = await generateMoodInsights(metrics);

    return NextResponse.json({
      metrics,
      trends,
      insights,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Error fetching mood metrics:', error);
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
    const { metrics, triggers = {}, context = {}, interventions = {} } = body;

    // Validate required fields
    if (!metrics) {
      return NextResponse.json(
        { error: 'Metrics data is required' },
        { status: 400 }
      );
    }

    const newMetric = new MoodMetric({
      userId: session.user.id,
      metrics,
      triggers,
      context,
      interventions,
      patterns: {
        trend: 'stable', // Will be calculated by the system
        confidence: 0.5,
        insights: [],
      },
    });

    await newMetric.save();

    return NextResponse.json({
      message: 'Mood metric recorded successfully',
      metric: newMetric,
    }, { status: 201 });

  } catch (error) {
    console.error('Error recording mood metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function calculateMoodTrends(userId: string, startDate: Date) {
  const recentMetrics = await MoodMetric.find({
    userId,
    timestamp: { $gte: startDate }
  }).sort({ timestamp: 1 });

  if (recentMetrics.length < 2) {
    return {
      overallMood: { trend: 'insufficient_data', confidence: 0 },
      anxiety: { trend: 'insufficient_data', confidence: 0 },
      stress: { trend: 'insufficient_data', confidence: 0 },
      empathy: { trend: 'insufficient_data', confidence: 0 },
    };
  }

  const first = recentMetrics[0];
  const last = recentMetrics[recentMetrics.length - 1];

  const calculateTrend = (start: number, end: number) => {
    const change = end - start;
    if (change > 1) return 'improving';
    if (change < -1) return 'declining';
    return 'stable';
  };

  return {
    overallMood: {
      trend: calculateTrend(first.metrics.overallMood, last.metrics.overallMood),
      confidence: 0.8,
      change: last.metrics.overallMood - first.metrics.overallMood
    },
    anxiety: {
      trend: calculateTrend(first.metrics.anxiety, last.metrics.anxiety),
      confidence: 0.8,
      change: last.metrics.anxiety - first.metrics.anxiety
    },
    stress: {
      trend: calculateTrend(first.metrics.stress, last.metrics.stress),
      confidence: 0.8,
      change: last.metrics.stress - first.metrics.stress
    },
    empathy: {
      trend: calculateTrend(first.metrics.empathy, last.metrics.empathy),
      confidence: 0.8,
      change: last.metrics.empathy - first.metrics.empathy
    },
  };
}

async function generateMoodInsights(metrics: any[]) {
  if (metrics.length === 0) {
    return ['No mood data available for insights'];
  }

  const insights: string[] = [];

  // Analyze mood patterns
  const avgMood = metrics.reduce((sum, m) => sum + m.metrics.overallMood, 0) / metrics.length;
  const avgAnxiety = metrics.reduce((sum, m) => sum + m.metrics.anxiety, 0) / metrics.length;
  const avgStress = metrics.reduce((sum, m) => sum + m.metrics.stress, 0) / metrics.length;

  if (avgMood >= 8) {
    insights.push('Your overall mood has been consistently positive');
  } else if (avgMood <= 3) {
    insights.push('Consider focusing on mood improvement activities');
  }

  if (avgAnxiety >= 7) {
    insights.push('High anxiety levels detected - anxiety reduction protocols may help');
  }

  if (avgStress >= 7) {
    insights.push('High stress levels detected - stress management techniques recommended');
  }

  // Check for improvement trends
  const recent = metrics.slice(0, 5);
  const older = metrics.slice(-5);
  if (recent.length > 0 && older.length > 0) {
    const recentAvg = recent.reduce((sum, m) => sum + m.metrics.overallMood, 0) / recent.length;
    const olderAvg = older.reduce((sum, m) => sum + m.metrics.overallMood, 0) / older.length;

    if (recentAvg > olderAvg + 0.5) {
      insights.push('Your mood shows positive improvement trends');
    }
  }

  return insights.length > 0 ? insights : ['Continue tracking your mood for more personalized insights'];
}