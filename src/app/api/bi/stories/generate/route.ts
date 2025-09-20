import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Story from '@/models/bi/Story';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      organizationId,
      data,
      insights,
      audience,
      narrativeStyle = 'business'
    } = body;

    if (!title || !organizationId || !data) {
      return NextResponse.json({
        error: 'Title, organization ID, and data are required'
      }, { status: 400 });
    }

    await connectToDatabase();

    // Generate automatic insights if not provided
    const generatedInsights = insights || await generateInsights(data);

    // Create narrative structure
    const narrativeArc = await createNarrativeArc(generatedInsights, narrativeStyle);

    // Generate visualizations
    const visualizations = await generateVisualizations(data, generatedInsights);

    // Create story content
    const storyContent = await generateStoryContent(
      title,
      generatedInsights,
      visualizations,
      narrativeArc,
      audience
    );

    const story = new Story({
      organizationId,
      title: title.trim(),
      content: storyContent,
      insights: generatedInsights,
      visualizations,
      narrativeArc,
      audience: {
        type: audience?.type || 'business',
        knowledgeLevel: audience?.knowledgeLevel || 'intermediate',
        interests: audience?.interests || [],
        preferences: audience?.preferences || {
          detailLevel: 'medium',
          technicalDepth: 'medium',
          visualStyle: 'balanced',
          interactionLevel: 'interactive'
        }
      },
      status: 'draft',
      version: 1,
      createdBy: session.user.id
    });

    const savedStory = await story.save();

    // Populate the createdBy field
    await savedStory.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      story: savedStory
    }, { status: 201 });

  } catch (error) {
    console.error('Generate story error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    let query: any = { organizationId };

    if (status) {
      query.status = status;
    }

    const stories = await Story.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(offset)
      .populate('createdBy', 'name email')
      .lean();

    const total = await Story.countDocuments(query);

    return NextResponse.json({
      stories,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Get stories error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
async function generateInsights(data: any): Promise<any[]> {
  const insights = [];

  // Analyze data for trends, anomalies, and patterns
  if (Array.isArray(data)) {
    // Time series analysis
    if (data.length > 1) {
      const values = data.map(d => d.value || d);
      const trend = calculateTrend(values);

      insights.push({
        id: `insight-${Date.now()}-1`,
        type: 'trend',
        title: 'Data Trend Analysis',
        description: `Detected ${trend.direction} trend with ${trend.strength} strength`,
        data: trend,
        confidence: trend.confidence,
        impact: trend.impact,
        category: 'analysis',
        tags: ['trend', 'analysis'],
        source: 'auto-generated',
        timestamp: new Date()
      });
    }

    // Anomaly detection
    const anomalies = detectAnomalies(data);
    if (anomalies.length > 0) {
      insights.push({
        id: `insight-${Date.now()}-2`,
        type: 'anomaly',
        title: 'Anomaly Detection',
        description: `Found ${anomalies.length} potential anomalies in the data`,
        data: anomalies,
        confidence: 0.85,
        impact: 'high',
        category: 'alert',
        tags: ['anomaly', 'alert'],
        source: 'auto-generated',
        timestamp: new Date()
      });
    }

    // Summary statistics
    const summary = generateSummary(data);
    insights.push({
      id: `insight-${Date.now()}-3`,
      type: 'summary',
      title: 'Data Summary',
      description: 'Statistical summary of the dataset',
      data: summary,
      confidence: 0.95,
      impact: 'medium',
      category: 'summary',
      tags: ['summary', 'statistics'],
      source: 'auto-generated',
      timestamp: new Date()
    });
  }

  return insights;
}

async function createNarrativeArc(insights: any[], style: string): Promise<any> {
  return {
    structure: {
      introduction: {
        id: 'intro',
        title: 'Overview',
        content: 'This analysis presents key findings from the data.',
        duration: 30,
        emphasis: 'medium'
      },
      risingAction: insights.slice(0, 3).map((insight, index) => ({
        id: `finding-${index}`,
        title: insight.title,
        content: insight.description,
        duration: 45,
        emphasis: insight.impact === 'high' ? 'high' : 'medium'
      })),
      climax: {
        id: 'climax',
        title: 'Key Insights',
        content: 'The most significant findings and their implications.',
        duration: 60,
        emphasis: 'high'
      },
      fallingAction: insights.slice(3).map((insight, index) => ({
        id: `detail-${index}`,
        title: insight.title,
        content: insight.description,
        duration: 30,
        emphasis: 'low'
      })),
      resolution: {
        id: 'conclusion',
        title: 'Summary & Recommendations',
        content: 'Summary of findings and suggested next steps.',
        duration: 45,
        emphasis: 'medium'
      }
    },
    tension: [],
    climax: {
      id: 'main-climax',
      title: 'Critical Findings',
      content: 'The most important discoveries from this analysis.',
      revelation: 'Key insights that require immediate attention.',
      impact: 'Strategic decisions needed'
    },
    resolution: {
      id: 'main-resolution',
      title: 'Action Plan',
      content: 'Recommended actions based on the analysis.',
      outcome: 'Improved decision-making and strategic planning',
      nextSteps: ['Review findings', 'Plan implementation', 'Monitor results']
    },
    pacing: {
      overall: 7,
      sectionPacing: {
        introduction: 5,
        analysis: 8,
        conclusion: 6
      },
      emphasisPoints: ['climax'],
      transitions: []
    }
  };
}

async function generateVisualizations(data: any, insights: any[]): Promise<any[]> {
  const visualizations = [];

  // Generate chart for trend data
  if (Array.isArray(data) && data.length > 0) {
    visualizations.push({
      id: `viz-${Date.now()}-1`,
      type: 'chart',
      title: 'Data Trend Visualization',
      description: 'Visual representation of data trends over time',
      data: data,
      config: {
        framework: 'plotly',
        dimensions: { width: 800, height: 400 },
        theme: 'light',
        responsive: true,
        animations: true
      },
      interactive: true,
      createdAt: new Date()
    });
  }

  // Generate summary table
  visualizations.push({
    id: `viz-${Date.now()}-2`,
    type: 'table',
    title: 'Summary Statistics',
    description: 'Key statistical measures and metrics',
    data: insights.find(i => i.type === 'summary')?.data || {},
    config: {
      framework: 'custom',
      dimensions: { width: 600, height: 300 },
      theme: 'light',
      responsive: true,
      animations: false
    },
    interactive: false,
    createdAt: new Date()
  });

  return visualizations;
}

async function generateStoryContent(
  title: string,
  insights: any[],
  visualizations: any[],
  narrativeArc: any,
  audience: any
): Promise<any> {
  const sections = [];

  // Introduction section
  sections.push({
    id: 'intro-section',
    title: 'Executive Summary',
    content: `This ${audience?.type || 'business'} report analyzes the provided data and presents key findings and recommendations.`,
    order: 1,
    type: 'introduction',
    insights: insights.slice(0, 1).map(i => i.id),
    visualizations: visualizations.slice(0, 1).map(v => v.id)
  });

  // Analysis sections
  insights.forEach((insight, index) => {
    sections.push({
      id: `analysis-${index}`,
      title: insight.title,
      content: insight.description,
      order: 2 + index,
      type: 'analysis',
      insights: [insight.id],
      visualizations: visualizations.filter(v => v.title.includes(insight.title.split(' ')[0])).map(v => v.id)
    });
  });

  // Conclusion section
  sections.push({
    id: 'conclusion-section',
    title: 'Conclusion & Recommendations',
    content: 'Based on the analysis, here are the key takeaways and recommended actions.',
    order: sections.length + 1,
    type: 'conclusion',
    insights: insights.slice(-1).map(i => i.id),
    visualizations: []
  });

  return {
    sections,
    narrative: `This comprehensive analysis of ${title} reveals important insights that require attention.`,
    keyMessages: insights.map(i => i.title),
    summary: `Analysis completed with ${insights.length} key insights identified.`
  };
}

// Utility functions
function calculateTrend(values: number[]): any {
  if (values.length < 2) return { direction: 'stable', strength: 0, confidence: 0 };

  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const change = ((secondAvg - firstAvg) / firstAvg) * 100;
  const strength = Math.abs(change);

  return {
    direction: change > 5 ? 'increasing' : change < -5 ? 'decreasing' : 'stable',
    strength: Math.min(strength, 100),
    confidence: 0.8,
    impact: strength > 20 ? 'high' : strength > 10 ? 'medium' : 'low'
  };
}

function detectAnomalies(data: any[]): any[] {
  if (!Array.isArray(data) || data.length < 5) return [];

  const values = data.map(d => d.value || d);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

  const threshold = 2 * stdDev;
  const anomalies = [];

  values.forEach((value, index) => {
    if (Math.abs(value - mean) > threshold) {
      anomalies.push({
        index,
        value,
        deviation: Math.abs(value - mean),
        severity: Math.abs(value - mean) / stdDev
      });
    }
  });

  return anomalies;
}

function generateSummary(data: any[]): any {
  if (!Array.isArray(data) || data.length === 0) return {};

  const values = data.map(d => d.value || d).filter(v => typeof v === 'number');

  if (values.length === 0) return {};

  return {
    count: data.length,
    min: Math.min(...values),
    max: Math.max(...values),
    average: values.reduce((a, b) => a + b, 0) / values.length,
    median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)]
  };
}