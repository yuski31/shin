import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { IdeaGenerationService } from '@/lib/creativity/IdeaGenerationService';
import { CreativeSession } from '@/models/creativity';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      method,
      prompt,
      domain,
      constraints,
      sessionId,
    } = body;

    // Validate required fields
    if (!method || !prompt || !domain) {
      return NextResponse.json(
        { error: 'Missing required fields: method, prompt, domain' },
        { status: 400 }
      );
    }

    // Validate method
    const validMethods = [
      'cross_domain_inspiration',
      'random_association',
      'constraint_based',
      'divergent_thinking',
      'brainstorming_facilitator'
    ];

    if (!validMethods.includes(method)) {
      return NextResponse.json(
        { error: 'Invalid method. Must be one of: ' + validMethods.join(', ') },
        { status: 400 }
      );
    }

    // Check if session exists (optional - create new if not provided)
    let creativeSession;
    if (sessionId) {
      creativeSession = await CreativeSession.findById(sessionId);
      if (!creativeSession) {
        return NextResponse.json(
          { error: 'Creative session not found' },
          { status: 404 }
        );
      }
    } else {
      // Create a new creative session
      creativeSession = await CreativeSession.create({
        userId: session.user.id,
        title: `Idea Generation: ${prompt.substring(0, 50)}...`,
        description: `AI-powered idea generation using ${method}`,
        sessionType: 'idea_generation',
        status: 'active',
        goals: [`Generate creative ideas for: ${prompt}`],
        metrics: {
          ideasGenerated: 0,
          breakthroughsAchieved: 0,
          creativityScore: 5,
          flowStateAchieved: false,
          distractionEvents: 0,
        },
        environment: {
          location: 'AI Platform',
          mood: null,
          energy: null,
          distractionsBlocked: ['notifications', 'social_media'],
        },
      });
    }

    // Generate ideas using the service
    const ideaGenerationService = (await import('@/lib/creativity/IdeaGenerationService')).default;
    const result = await ideaGenerationService.generateIdeas({
      userId: session.user.id,
      sessionId: creativeSession._id.toString(),
      method: method as any,
      prompt,
      domain,
      constraints,
    });

    // Update session metrics
    await CreativeSession.findByIdAndUpdate(creativeSession._id, {
      $inc: {
        'metrics.ideasGenerated': result.totalIdeas,
        'metrics.breakthroughsAchieved': result.breakthroughIdeas,
      },
      $set: {
        'metrics.creativityScore': result.metrics.averageIdeaQuality,
        'outcomes.outputs': [], // Will be populated when ideas are saved
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        sessionId: creativeSession._id,
        result,
      },
    });

  } catch (error) {
    console.error('Error in idea generation API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get idea generation history for the session
    const { default: IdeaGeneration } = await import('@/models/creativity/IdeaGeneration');
    const ideaGenerations = await IdeaGeneration
      .find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('sessionId');

    const total = await IdeaGeneration.countDocuments({ sessionId });

    return NextResponse.json({
      success: true,
      data: {
        ideaGenerations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });

  } catch (error) {
    console.error('Error fetching idea generation history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}