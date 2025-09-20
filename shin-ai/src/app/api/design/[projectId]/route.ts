import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { DesignProject } from '@/models/design-automation';

// GET /api/design/[projectId] - Get a specific design project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    await connectDB();

    const project = await DesignProject.findById(projectId)
      .populate('owner', 'name email avatar')
      .populate('organization', 'name slug')
      .populate('collaborators', 'name email avatar');

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user can access this project
    if (!project.canUserAccess(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching design project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/design/[projectId] - Update a design project
export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const body = await request.json();
    const {
      name,
      description,
      status,
      settings,
      metadata,
      collaborators
    } = body;

    await connectDB();

    const project = await DesignProject.findById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user can edit this project (only owner can edit)
    if (!project.canUserEdit(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Update fields
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) {
      const validStatuses = ['draft', 'in-progress', 'review', 'approved', 'archived'];
      if (validStatuses.includes(status)) {
        project.status = status;
      }
    }
    if (settings !== undefined) project.settings = { ...project.settings, ...settings };
    if (metadata !== undefined) project.metadata = { ...project.metadata, ...metadata };
    if (collaborators !== undefined) {
      // Ensure owner is always a collaborator
      const ownerId = project.owner.toString();
      const newCollaborators = collaborators.filter((id: string) => id !== ownerId);
      project.collaborators = [ownerId, ...newCollaborators];
    }

    await project.save();

    // Populate the updated project
    await project.populate('owner', 'name email avatar');
    await project.populate('organization', 'name slug');
    await project.populate('collaborators', 'name email avatar');

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating design project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/design/[projectId] - Delete a design project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;

    await connectDB();

    const project = await DesignProject.findById(projectId);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user can edit this project (only owner can delete)
    if (!project.canUserEdit(new (await import('mongoose')).Types.ObjectId(session.user.id))) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // TODO: Also delete associated assets, versions, etc.
    await DesignProject.findByIdAndDelete(projectId);

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting design project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}