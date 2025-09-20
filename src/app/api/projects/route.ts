import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Project from '@/models/Project';

// GET /api/projects - Get all projects for the authenticated user or organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    await connectDB();

    let projects;
    if (organizationId) {
      // Get projects for specific organization
      projects = await Project.find({ organization: organizationId })
        .sort({ updatedAt: -1 });
    } else {
      // Get projects for user's organizations
      const user = await require('mongoose').model('User').findById(session.user.id);
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      const organizationIds = user.organizations || [];
      if (user.defaultOrganization) {
        organizationIds.push(user.defaultOrganization);
      }

      projects = await Project.find({ organization: { $in: organizationIds } })
        .sort({ updatedAt: -1 });
    }

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, template, settings, organizationId } = body;

    if (!name || !description) {
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

    const project = new Project({
      userId: session.user.id,
      organization: organizationIdToUse,
      name,
      description,
      template: template || 'nextjs-starter',
      settings: {
        framework: 'nextjs',
        database: 'mongodb',
        features: ['responsive', 'modern'],
        ...settings,
      },
    });

    await project.save();

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
