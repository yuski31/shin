import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import StreamEvent from '@/models/bi/StreamEvent';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { events, source, eventType, organizationId } = body;

    if (!events || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: 'Events array is required' }, { status: 400 });
    }

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    // Process and validate events
    const processedEvents = [];
    const errors = [];

    for (const event of events) {
      try {
        // Validate event structure
        if (!event.eventId || !event.timestamp || !event.data) {
          throw new Error('Invalid event structure');
        }

        // Calculate data quality score
        const qualityScore = calculateDataQuality(event.data);

        // Create stream event
        const streamEvent = new StreamEvent({
          organizationId,
          eventType: eventType || 'generic',
          eventId: event.eventId,
          timestamp: new Date(event.timestamp),
          source: source || 'api',
          data: event.data,
          schemaVersion: '1.0',
          processed: false,
          processingStatus: 'pending',
          metadata: {
            quality: {
              score: qualityScore,
              issues: [],
              validated: true
            },
            source: source || 'api',
            tags: event.tags || []
          }
        });

        const savedEvent = await streamEvent.save();
        processedEvents.push(savedEvent);

        // Trigger real-time processing (in a real implementation, this would trigger Kafka)
        await triggerStreamProcessing(savedEvent);

      } catch (error) {
        errors.push({
          eventId: event.eventId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEvents.length,
      errors: errors.length,
      results: processedEvents.map(event => ({
        id: event._id,
        eventId: event.eventId,
        status: event.processingStatus,
        qualityScore: event.metadata.quality.score
      })),
      errors
    });

  } catch (error) {
    console.error('Stream processing error:', error);
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
    const eventType = searchParams.get('eventType');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    let query: any = { organizationId };

    if (eventType) {
      query.eventType = eventType;
    }

    const events = await StreamEvent.find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await StreamEvent.countDocuments(query);

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Get stream events error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateDataQuality(data: any): number {
  let score = 1.0;

  // Check for missing required fields
  if (!data || typeof data !== 'object') {
    return 0.0;
  }

  // Check for null/undefined values
  const values = Object.values(data);
  const nullCount = values.filter(v => v === null || v === undefined).length;
  score -= nullCount * 0.1;

  // Check for empty strings
  const emptyStringCount = values.filter(v => v === '').length;
  score -= emptyStringCount * 0.05;

  // Check for nested object complexity
  const nestedObjects = values.filter(v => typeof v === 'object' && v !== null).length;
  if (nestedObjects > 10) {
    score -= 0.1; // Penalize overly complex nested structures
  }

  return Math.max(0, Math.min(1, score));
}

async function triggerStreamProcessing(event: any): Promise<void> {
  // In a real implementation, this would:
  // 1. Send event to Kafka topic
  // 2. Trigger stream processing pipeline
  // 3. Update event processing status
  // 4. Emit real-time updates via WebSocket

  console.log(`Triggered stream processing for event: ${event.eventId}`);

  // Simulate async processing
  setTimeout(async () => {
    try {
      await StreamEvent.findByIdAndUpdate(event._id, {
        processed: true,
        processingStatus: 'completed',
        'metadata.processingTime': Math.random() * 1000
      });
    } catch (error) {
      console.error('Stream processing update error:', error);
    }
  }, 100);
}