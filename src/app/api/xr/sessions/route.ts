import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import XRSession from '@/models/XRSession';

// GET /api/xr/sessions - Get all XR sessions for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');
    const sessionType = searchParams.get('type');
    const status = searchParams.get('status');

    await connectDB();

    let query: any = { userId: session.user.id };

    if (organizationId) {
      query.organization = organizationId;
    }

    if (sessionType) {
      query.sessionType = sessionType;
    }

    if (status) {
      query.status = status;
    }

    const xrSessions = await XRSession.find(query)
      .populate('participants', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(xrSessions);
  } catch (error) {
    console.error('Error fetching XR sessions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/xr/sessions - Create a new XR session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      sessionType,
      organizationId,
      participants,
      settings
    } = body;

    if (!title || !sessionType) {
      return NextResponse.json(
        { error: 'Missing required fields: title and sessionType are required' },
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

    const xrSession = new XRSession({
      userId: session.user.id,
      organization: organizationIdToUse,
      title,
      description,
      sessionType,
      participants: participants || [],
      settings: {
        quality: 'medium',
        maxParticipants: 10,
        duration: 60,
        recording: false,
        streaming: false,
        ...settings
      },
      metadata: {},
    });

    await xrSession.save();

    return NextResponse.json(xrSession, { status: 201 });
  } catch (error) {
    console.error('Error creating XR session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}