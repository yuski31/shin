import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { MemoryPalace } from '@/models/memory-palace';
import { z } from 'zod';

// Validation schemas
const UpdateMemoryPalaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
  structure: z.object({
    type: z.enum(['image-based', 'custom', 'template']).optional(),
    rooms: z.array(z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        z: z.number(),
      }),
      dimensions: z.object({
        width: z.number(),
        height: z.number(),
        depth: z.number(),
      }),
      color: z.string().optional(),
      imageUrl: z.string().optional(),
    })).optional(),
    connections: z.array(z.object({
      fromRoomId: z.string(),
      toRoomId: z.string(),
      type: z.enum(['door', 'hallway', 'stairs']),
    })).optional(),
  }).optional(),
  settings: z.object({
    enableSpatialAudio: z.boolean().optional(),
    enableCompression: z.boolean().optional(),
    autoBackup: z.boolean().optional(),
    privacyLevel: z.enum(['private', 'shared', 'public']).optional(),
  }).optional(),
});

// GET /api/memory-palaces/[palaceId] - Get specific memory palace
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ palaceId: string  }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { palaceId } = params;

    if (!palaceId) {
      return NextResponse.json({ error: 'Palace ID is required' }, { status: 400 });
    }

    await connectDB();

    const palace = await MemoryPalace.findOne({
      _id: palaceId,
      $or: [
        { userId: session.user.id },
        { isPublic: true }
      ]
    }).populate('userId', 'name email');

    if (!palace) {
      return NextResponse.json({ error: 'Memory palace not found' }, { status: 404 });
    }

    // Update last accessed time
    await MemoryPalace.updateOne(
      { _id: palaceId },
      { 'metadata.lastAccessed': new Date() }
    );

    return NextResponse.json(palace);
  } catch (error) {
    console.error('Error fetching memory palace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/memory-palaces/[palaceId] - Update specific memory palace
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ palaceId: string  }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { palaceId } = params;

    if (!palaceId) {
      return NextResponse.json({ error: 'Palace ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = UpdateMemoryPalaceSchema.parse(body);

    await connectDB();

    // Check ownership
    const existingPalace = await MemoryPalace.findOne({
      _id: palaceId,
      userId: session.user.id
    });

    if (!existingPalace) {
      return NextResponse.json({ error: 'Memory palace not found or access denied' }, { status: 404 });
    }

    // Update the palace
    const updatedPalace = await MemoryPalace.findByIdAndUpdate(
      palaceId,
      {
        ...validatedData,
        'metadata.updatedAt': new Date()
      },
      { new: true }
    );

    return NextResponse.json(updatedPalace);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating memory palace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/memory-palaces/[palaceId] - Delete specific memory palace
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ palaceId: string  }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { palaceId } = params;

    if (!palaceId) {
      return NextResponse.json({ error: 'Palace ID is required' }, { status: 400 });
    }

    await connectDB();

    // Check ownership and delete
    const deletedPalace = await MemoryPalace.findOneAndDelete({
      _id: palaceId,
      userId: session.user.id
    });

    if (!deletedPalace) {
      return NextResponse.json({ error: 'Memory palace not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Memory palace deleted successfully' });
  } catch (error) {
    console.error('Error deleting memory palace:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}