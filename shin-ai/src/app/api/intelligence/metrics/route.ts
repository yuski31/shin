import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import CognitiveMetric from '@/models/CognitiveMetric';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const metricType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    const query: any = { userId };
    if (metricType) {
      query.metricType = metricType;
    }

    const metrics = await CognitiveMetric.find(query)
      .sort({ timestamp: -1 })
      .limit(limit);

    // Get user profile
    const profile = await CognitiveMetric.getUserProfile(
      userId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      new Date()
    );

    return NextResponse.json({
      metrics,
      profile,
      summary: {
        totalMetrics: metrics.length,
        metricTypes: [...new Set(metrics.map(m => m.metricType))],
        dateRange: {
          from: metrics[metrics.length - 1]?.timestamp || new Date(),
          to: metrics[0]?.timestamp || new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching cognitive metrics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { sessionId, metricType, value, unit, baseline, metadata } = body;

    if (!metricType || value === undefined) {
      return NextResponse.json({ error: 'Metric type and value required' }, { status: 400 });
    }

    const metric = new CognitiveMetric({
      userId: session.user.id,
      organization: session.user.organization,
      sessionId,
      metricType,
      value,
      unit: unit || 'score',
      baseline: baseline || 0,
      confidence: metadata?.confidence || 100,
      timestamp: new Date(),
      metadata
    });

    // Calculate improvement
    if (baseline && baseline > 0) {
      metric.improvement = ((value - baseline) / baseline) * 100;
    }

    await metric.save();

    return NextResponse.json({ metric });
  } catch (error) {
    console.error('Error creating cognitive metric:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}