import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import EnhancementProtocol from '@/models/EnhancementProtocol';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty');
    const isPublic = searchParams.get('public') === 'true';

    const query: any = { isActive: true };
    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query['metadata.difficulty'] = difficulty;
    }
    if (isPublic !== undefined) {
      query.isPublic = isPublic;
    }

    const protocols = await EnhancementProtocol.find(query)
      .populate('createdBy', 'name email')
      .sort({ 'effectiveness.userRating': -1, 'effectiveness.totalSessions': -1 })
      .limit(50);

    // Get popular protocols
    const popular = await EnhancementProtocol.getPopularProtocols(5);

    return NextResponse.json({
      protocols,
      popular,
      categories: ['iq-boost', 'math-intuition', 'creative-enhancement', 'pattern-recognition', 'synesthetic-learning', 'memory-optimization'],
      difficulties: ['beginner', 'intermediate', 'advanced', 'expert']
    });
  } catch (error) {
    console.error('Error fetching enhancement protocols:', error);
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
    const {
      name,
      description,
      category,
      version,
      requirements,
      configuration,
      metadata
    } = body;

    if (!name || !description || !category) {
      return NextResponse.json({ error: 'Name, description, and category required' }, { status: 400 });
    }

    const protocol = new EnhancementProtocol({
      name,
      description,
      category,
      version: version || '1.0.0',
      isActive: true,
      isPublic: false,
      createdBy: session.user.id,
      organization: session.user.organization,
      requirements: requirements || {},
      configuration: configuration || {},
      effectiveness: {
        averageImprovement: 0,
        successRate: 0,
        userRating: 0,
        totalSessions: 0,
        totalUsers: 0
      },
      analytics: {
        bestPerformingDemographics: {},
        optimalConditions: {},
        commonSideEffects: [],
        dropoutReasons: []
      },
      metadata: metadata || {}
    });

    await protocol.save();

    return NextResponse.json({ protocol });
  } catch (error) {
    console.error('Error creating enhancement protocol:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}