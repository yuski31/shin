import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import mongoose from 'mongoose';
import AttentionMetric from '../../../../models/AttentionMetric';
import FocusSession from '../../../../models/FocusSession';

// GET /api/focus-enhancement/metrics - Get attention metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const metricType = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sessionId = searchParams.get('sessionId');

    // Build filter
    const filter: any = { userId: session.user.id };
    if (metricType) filter.metricType = metricType;
    if (sessionId) filter.sessionId = sessionId;
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Get metrics
    const metrics = await AttentionMetric.find(filter)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    // Get analytics
    const analytics = await AttentionMetric.getAttentionAnalytics(
      new mongoose.Types.ObjectId(session.user.id),
      startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    // Get user's profile
    const profile = await AttentionMetric.getUserProfile(
      new mongoose.Types.ObjectId(session.user.id),
      startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate ? new Date(endDate) : new Date()
    );

    return NextResponse.json({
      metrics,
      analytics,
      profile,
      summary: {
        totalMeasurements: metrics.length,
        dateRange: {
          start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: endDate || new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching attention metrics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/focus-enhancement/metrics - Record a new attention metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      metricType,
      value,
      unit,
      confidence,
      sessionId,
      context,
      metadata,
    } = body;

    // Validate required fields
    if (!metricType || typeof value !== 'number') {
      return NextResponse.json(
        { error: 'Missing or invalid required fields' },
        { status: 400 }
      );
    }

    // Get current session if provided
    let focusSession = null;
    if (sessionId) {
      focusSession = await FocusSession.findById(sessionId);
      if (!focusSession) {
        return NextResponse.json(
          { error: 'Focus session not found' },
          { status: 404 }
        );
      }
    }

    // Calculate baseline (average of last 5 measurements of same type)
    const recentMetrics = await AttentionMetric.find({
      userId: session.user.id,
      metricType,
    })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const baseline = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
      : 0;

    const improvement = baseline > 0 ? ((value - baseline) / baseline) * 100 : 0;

    // Create new metric
    const newMetric = new AttentionMetric({
      userId: session.user.id,
      organization: session.user.organizationId || 'default',
      sessionId: sessionId || null,
      metricType,
      value,
      unit: unit || 'score',
      baseline,
      improvement,
      confidence: confidence || 100,
      timestamp: new Date(),
      context: context || {},
      metadata: metadata || {},
    });

    await newMetric.save();

    // Update focus session metrics if linked
    if (focusSession) {
      await updateFocusSessionMetrics(focusSession, newMetric);
    }

    return NextResponse.json(newMetric, { status: 201 });
  } catch (error) {
    console.error('Error recording attention metric:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function updateFocusSessionMetrics(focusSession: any, metric: any) {
  try {
    // Update session metrics based on the new measurement
    const updates: any = {};

    switch (metric.metricType) {
      case 'attention-span':
        updates['metrics.attentionScore'] = metric.value;
        break;
      case 'focus-quality':
        updates['metrics.focusQuality'] = metric.value;
        break;
      case 'flow-state':
        updates['metrics.flowStateLevel'] = metric.value;
        break;
      case 'cognitive-load':
        updates['metrics.cognitiveLoad'] = metric.value;
        break;
    }

    // Recalculate focus quality if we have enough data
    const recentMetrics = await AttentionMetric.find({
      sessionId: focusSession._id,
    }).sort({ timestamp: -1 }).limit(4).lean();

    if (recentMetrics.length >= 2) {
      const avgAttention = recentMetrics
        .filter(m => m.metricType === 'attention-span')
        .reduce((sum, m) => sum + m.value, 0) /
        recentMetrics.filter(m => m.metricType === 'attention-span').length;

      const avgFlow = recentMetrics
        .filter(m => m.metricType === 'flow-state')
        .reduce((sum, m) => sum + m.value, 0) /
        recentMetrics.filter(m => m.metricType === 'flow-state').length;

      const avgCognitiveLoad = recentMetrics
        .filter(m => m.metricType === 'cognitive-load')
        .reduce((sum, m) => sum + m.value, 0) /
        recentMetrics.filter(m => m.metricType === 'cognitive-load').length;

      if (avgAttention > 0 && avgFlow > 0) {
        updates['metrics.focusQuality'] = (avgAttention + avgFlow - (avgCognitiveLoad * 0.3)) / 2;
      }
    }

    if (Object.keys(updates).length > 0) {
      await FocusSession.updateOne({ _id: focusSession._id }, { $set: updates });
    }
  } catch (error) {
    console.error('Error updating focus session metrics:', error);
  }
}