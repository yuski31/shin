import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import AIProvider from '@/models/AIProvider';

// GET /api/providers - Get all AI providers for the authenticated user or organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    await connectDB();

    let providers;
    if (organizationId) {
      // Get providers for specific organization
      providers = await AIProvider.find({ organization: organizationId })
        .sort({ createdAt: -1 });
    } else {
      // Get providers for user's organizations
      const user = await require('mongoose').model('User').findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const organizationIds = user.organizations || [];
      if (user.defaultOrganization) {
        organizationIds.push(user.defaultOrganization);
      }

      providers = await AIProvider.find({ organization: { $in: organizationIds } })
        .sort({ createdAt: -1 });
    }

    return NextResponse.json(providers);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new AI provider
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, baseUrl, apiKey, models, organizationId } = body;

    if (!name || !baseUrl || !apiKey || !models || !Array.isArray(models)) {
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

    const provider = new AIProvider({
      userId: session.user.id,
      organization: organizationIdToUse,
      name,
      baseUrl,
      apiKey,
      models,
    });

    await provider.save();

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
