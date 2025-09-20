import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import ChatSession from '@/models/ChatSession';
import AIProvider from '@/models/AIProvider';
import { authenticateApiKey, trackUsage, checkQuotas, validateScopes } from '@/lib/api-security';

// GET /api/chat - Get all chat sessions for the authenticated user or organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    await connectDB();

    let chatSessions;
    if (organizationId) {
      // Get chat sessions for specific organization
      chatSessions = await ChatSession.find({ organization: organizationId })
        .populate('providers')
        .sort({ updatedAt: -1 });
    } else {
      // Get chat sessions for user's organizations
      const user = await require('mongoose').model('User').findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const organizationIds = user.organizations || [];
      if (user.defaultOrganization) {
        organizationIds.push(user.defaultOrganization);
      }

      chatSessions = await ChatSession.find({ organization: { $in: organizationIds } })
        .populate('providers')
        .sort({ updatedAt: -1 });
    }

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/chat - Create a new chat session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, mode, providerIds, organizationId } = body;

    if (!title || !mode || !providerIds || !Array.isArray(providerIds)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await connectDB();

    // Get user's organizations
    const user = await require('mongoose').model('User').findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let organizationIdToUse;
    if (organizationId) {
      // Use specified organization
      if (!user.organizations.includes(organizationId) && user.defaultOrganization?.toString() !== organizationId) {
        return NextResponse.json(
          { error: 'Organization not found or access denied' },
          { status: 404 }
        );
      }
      organizationIdToUse = organizationId;
    } else {
      // Use user's default organization
      organizationIdToUse = user.defaultOrganization;
      if (!organizationIdToUse) {
        return NextResponse.json(
          { error: 'No default organization found. Please specify an organizationId.' },
          { status: 400 }
        );
      }
    }

    const chatSession = new ChatSession({
      userId: session.user.id,
      organization: organizationIdToUse,
      title,
      mode,
      providers: providerIds,
      messages: [],
    });

    await chatSession.save();

    return NextResponse.json(chatSession, { status: 201 });
  } catch (error) {
    console.error('Error creating chat session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
