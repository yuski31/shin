import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { MemoryItem } from '@/models/memory-palace';
import { z } from 'zod';

// Validation schemas
const CreateMemoryItemSchema = z.object({
  locationId: z.string(),
  title: z.string().min(1).max(200),
  content: z.object({
    type: z.enum(['text', 'image', 'audio', 'video', 'mixed']),
    data: z.string(),
    metadata: z.object({
      duration: z.number().optional(),
      dimensions: z.object({
        width: z.number(),
        height: z.number(),
      }).optional(),
      wordCount: z.number().optional(),
    }).optional(),
  }),
  associations: z.array(z.object({
    type: z.enum(['visual', 'spatial', 'emotional', 'logical']),
    description: z.string(),
    strength: z.number().min(1).max(10),
  })).default([]),
  recall: z.object({
    difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
    confidence: z.number().min(1).max(100).default(50),
  }).optional(),
  tags: z.array(z.string()).default([]),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  category: z.string().max(50).optional(),
});

// GET /api/memory-palaces/[palaceId]/items - Get items for a palace
export async function GET(
  request: NextRequest,
  { params }: { params: { palaceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { palaceId } = params;
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    const priority = searchParams.get('priority');
    const isArchived = searchParams.get('archived') === 'true';
    const search = searchParams.get('search');

    if (!palaceId) {
      return NextResponse.json({ error: 'Palace ID is required' }, { status: 400 });
    }

    await connectDB();

    const query: any = { palaceId, userId: session.user.id };

    if (locationId) {
      query.locationId = locationId;
    }

    if (priority) {
      query.priority = priority;
    }

    if (isArchived !== undefined) {
      query.isArchived = isArchived;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'content.data': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const items = await MemoryItem.find(query)
      .sort({ createdAt: -1 })
      .populate('locationId', 'name')
      .populate('palaceId', 'name');

    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching memory items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/memory-palaces/[palaceId]/items - Create new memory item
export async function POST(
  request: NextRequest,
  { params }: { params: { palaceId: string } }
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
    const validatedData = CreateMemoryItemSchema.parse(body);

    await connectDB();

    // Verify palace ownership/access
    const { MemoryPalace } = await import('@/models/memory-palace');
    const palace = await MemoryPalace.findOne({
      _id: palaceId,
      userId: session.user.id
    });

    if (!palace) {
      return NextResponse.json({ error: 'Memory palace not found or access denied' }, { status: 404 });
    }

    // Verify location exists
    const { MemoryLocation } = await import('@/models/memory-palace');
    const location = await MemoryLocation.findOne({
      _id: validatedData.locationId,
      palaceId
    });

    if (!location) {
      return NextResponse.json({ error: 'Memory location not found' }, { status: 404 });
    }

    const item = new MemoryItem({
      ...validatedData,
      palaceId,
      userId: session.user.id,
      recall: {
        ...validatedData.recall,
        recallStreak: 0,
        totalRecalls: 0,
        successfulRecalls: 0,
        averageRecallTime: 0,
      },
      realityAnchoring: {
        isVerified: false,
        confidenceScore: 50,
      },
      sharing: {
        isShared: false,
        sharedWith: [],
        sharePermissions: {
          view: true,
          edit: false,
          delete: false,
          copy: false,
        },
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        accessCount: 0,
      },
      isArchived: false,
      isDeleted: false,
    });

    await item.save();

    // Update location occupancy
    await MemoryLocation.updateOne(
      { _id: validatedData.locationId },
      { $inc: { currentOccupancy: 1, 'metadata.totalMemories': 1 } }
    );

    // Update palace metadata
    await MemoryPalace.updateOne(
      { _id: palaceId },
      {
        $inc: { 'metadata.totalMemories': 1 },
        'metadata.updatedAt': new Date()
      }
    );

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating memory item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}