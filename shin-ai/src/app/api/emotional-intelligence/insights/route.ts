import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import EmotionalSession from '@/models/EmotionalSession';
import MoodMetric from '@/models/MoodMetric';
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
    const timeframe = searchParams.get('timeframe') || '30d'; // 7d, 30d, 90d, 1y
    const includeRecommendations = searchParams.get('recommendations') === 'true';

    // Calculate date range
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
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Gather comprehensive emotional intelligence data
    const [sessions, metrics, empathyEvents] = await Promise.all([
      EmotionalSession.find({
        userId: session.user.id,
        startTime: { $gte: startDate }
      }).sort({ startTime: -1 }),

      MoodMetric.find({
        userId: session.user.id,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 }),

      EmpathyEvent.find({
        userId: session.user.id,
        timestamp: { $gte: startDate }
      }).sort({ timestamp: -1 }),
    ]);

    // Generate comprehensive insights
    const insights = await generateEmotionalInsights(sessions, metrics, empathyEvents);

    // Calculate emotional health score
    const emotionalHealthScore = await calculateEmotionalHealthScore(metrics, sessions);

    // Generate personalized recommendations
    const recommendations = includeRecommendations
      ? await generateRecommendations(metrics, sessions, empathyEvents)
      : [];

    return NextResponse.json({
      timeframe,
      period: {
        start: startDate,
        end: now,
      },
      summary: {
        totalSessions: sessions.length,
        totalMoodMetrics: metrics.length,
        totalEmpathyEvents: empathyEvents.length,
        emotionalHealthScore,
        averageSessionDuration: calculateAverageSessionDuration(sessions),
        mostActiveSessionType: findMostActiveSessionType(sessions),
      },
      insights,
      recommendations,
    });

  } catch (error) {
    console.error('Error generating emotional intelligence insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function generateEmotionalInsights(sessions: any[], metrics: any[], empathyEvents: any[]) {
  const insights: any[] = [];

  // Mood pattern insights
  if (metrics.length > 0) {
    const avgMood = metrics.reduce((sum, m) => sum + m.metrics.overallMood, 0) / metrics.length;
    const avgAnxiety = metrics.reduce((sum, m) => sum + m.metrics.anxiety, 0) / metrics.length;
    const avgStress = metrics.reduce((sum, m) => sum + m.metrics.stress, 0) / metrics.length;

    if (avgMood >= 8) {
      insights.push({
        type: 'positive',
        category: 'mood',
        title: 'Excellent Mood Pattern',
        description: 'Your overall mood has been consistently positive. Keep up the great work!',
        confidence: 0.9,
      });
    } else if (avgMood <= 3) {
      insights.push({
        type: 'concern',
        category: 'mood',
        title: 'Mood Support Needed',
        description: 'Your mood levels suggest you might benefit from additional support and mood-enhancing activities.',
        confidence: 0.8,
        actionItems: ['Try a short mindfulness session', 'Connect with a supportive friend', 'Engage in a favorite hobby'],
      });
    }

    if (avgAnxiety >= 7) {
      insights.push({
        type: 'concern',
        category: 'anxiety',
        title: 'High Anxiety Detected',
        description: 'Anxiety levels have been elevated. Consider anxiety reduction techniques.',
        confidence: 0.85,
        actionItems: ['Practice deep breathing exercises', 'Try progressive muscle relaxation', 'Consider a short meditation session'],
      });
    }

    if (avgStress >= 7) {
      insights.push({
        type: 'concern',
        category: 'stress',
        title: 'Stress Management Recommended',
        description: 'Stress levels have been high. Stress reduction protocols may be beneficial.',
        confidence: 0.85,
        actionItems: ['Take regular breaks during work', 'Practice time management techniques', 'Engage in physical activity'],
      });
    }
  }

  // Session effectiveness insights
  if (sessions.length > 0) {
    const successfulSessions = sessions.filter(s => s.emotionalState.current.mood > s.emotionalState.baseline.mood);
    const successRate = (successfulSessions.length / sessions.length) * 100;

    if (successRate >= 80) {
      insights.push({
        type: 'positive',
        category: 'sessions',
        title: 'High Session Effectiveness',
        description: `Your emotional intelligence sessions have been highly effective (${Math.round(successRate)}% success rate).`,
        confidence: 0.9,
      });
    } else if (successRate < 50) {
      insights.push({
        type: 'suggestion',
        category: 'sessions',
        title: 'Session Optimization Needed',
        description: 'Consider adjusting your session types or timing for better emotional outcomes.',
        confidence: 0.7,
        actionItems: ['Try different session types', 'Experiment with different times of day', 'Adjust session duration'],
      });
    }
  }

  // Empathy and social insights
  if (empathyEvents.length > 0) {
    const avgEmpathyLevel = empathyEvents.reduce((sum, e) => sum + e.interactionQuality.empathyLevel, 0) / empathyEvents.length;
    const positiveInteractions = empathyEvents.filter(e => e.interactionQuality.outcome === 'positive').length;
    const positiveRate = (positiveInteractions / empathyEvents.length) * 100;

    if (avgEmpathyLevel >= 8) {
      insights.push({
        type: 'positive',
        category: 'empathy',
        title: 'Strong Empathy Skills',
        description: 'Your empathy and social interaction skills are excellent.',
        confidence: 0.9,
      });
    }

    if (positiveRate >= 75) {
      insights.push({
        type: 'positive',
        category: 'social',
        title: 'Positive Social Interactions',
        description: `${Math.round(positiveRate)}% of your recent interactions have been positive.`,
        confidence: 0.85,
      });
    }
  }

  // Safety and crisis insights
  const crisisSessions = sessions.filter(s => s.safetyFlags.crisisDetected);
  if (crisisSessions.length > 0) {
    insights.push({
      type: 'crisis',
      category: 'safety',
      title: 'Crisis Detection',
      description: `${crisisSessions.length} session(s) detected potential crisis indicators. Please consider professional support if needed.`,
      confidence: 0.95,
      actionItems: ['Contact a mental health professional', 'Reach out to trusted support network', 'Use emergency resources if in immediate danger'],
    });
  }

  return insights;
}

async function calculateEmotionalHealthScore(metrics: any[], sessions: any[]) {
  if (metrics.length === 0) return 0;

  // Calculate weighted emotional health score (0-100)
  const recentMetrics = metrics.slice(0, 10); // Last 10 metrics for recency
  const avgMood = recentMetrics.reduce((sum, m) => sum + m.metrics.overallMood, 0) / recentMetrics.length;
  const avgAnxiety = recentMetrics.reduce((sum, m) => sum + m.metrics.anxiety, 0) / recentMetrics.length;
  const avgStress = recentMetrics.reduce((sum, m) => sum + m.metrics.stress, 0) / recentMetrics.length;
  const avgEnergy = recentMetrics.reduce((sum, m) => sum + m.metrics.energy, 0) / recentMetrics.length;

  // Convert to 0-100 scale with weighted formula
  const moodScore = (avgMood / 10) * 30; // 30% weight
  const anxietyScore = (1 - (avgAnxiety - 1) / 9) * 25; // 25% weight (inverted)
  const stressScore = (1 - (avgStress - 1) / 9) * 25; // 25% weight (inverted)
  const energyScore = (avgEnergy / 10) * 20; // 20% weight

  const totalScore = moodScore + anxietyScore + stressScore + energyScore;

  // Adjust based on recent session effectiveness
  if (sessions.length > 0) {
    const recentSessions = sessions.slice(0, 5);
    const avgImprovement = recentSessions.reduce((sum, s) => {
      return sum + (s.emotionalState.current.mood - s.emotionalState.baseline.mood);
    }, 0) / recentSessions.length;

    return Math.max(0, Math.min(100, totalScore + (avgImprovement * 2)));
  }

  return Math.max(0, Math.min(100, totalScore));
}

async function generateRecommendations(metrics: any[], sessions: any[], empathyEvents: any[]) {
  const recommendations: any[] = [];

  if (metrics.length > 0) {
    const avgMood = metrics.reduce((sum, m) => sum + m.metrics.overallMood, 0) / metrics.length;
    const avgAnxiety = metrics.reduce((sum, m) => sum + m.metrics.anxiety, 0) / metrics.length;

    if (avgMood < 5) {
      recommendations.push({
        type: 'mood_enhancement',
        priority: 'high',
        title: 'Mood Enhancement Protocol',
        description: 'Start a mood optimization session with focus on positive activities.',
        actions: ['Begin mood optimization session', 'Try positive affirmation exercises', 'Engage in gratitude practice'],
      });
    }

    if (avgAnxiety > 6) {
      recommendations.push({
        type: 'anxiety_reduction',
        priority: 'high',
        title: 'Anxiety Reduction Protocol',
        description: 'Implement anxiety reduction techniques and grounding exercises.',
        actions: ['Practice 5-minute breathing exercise', 'Try progressive muscle relaxation', 'Use grounding techniques'],
      });
    }
  }

  if (sessions.length === 0) {
    recommendations.push({
      type: 'session_recommendation',
      priority: 'medium',
      title: 'Start Emotional Intelligence Session',
      description: 'Begin your first emotional intelligence session to establish baseline metrics.',
      actions: ['Start empathy training session', 'Try mood optimization', 'Begin resilience building'],
    });
  }

  return recommendations.slice(0, 5); // Return top 5 recommendations
}

function calculateAverageSessionDuration(sessions: any[]) {
  if (sessions.length === 0) return 0;

  const sessionsWithDuration = sessions.filter(s => s.duration);
  if (sessionsWithDuration.length === 0) return 0;

  const totalDuration = sessionsWithDuration.reduce((sum, s) => sum + s.duration, 0);
  return Math.round(totalDuration / sessionsWithDuration.length);
}

function findMostActiveSessionType(sessions: any[]) {
  if (sessions.length === 0) return 'none';

  const typeCounts = sessions.reduce((acc, session) => {
    acc[session.sessionType] = (acc[session.sessionType] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || 'none';
}