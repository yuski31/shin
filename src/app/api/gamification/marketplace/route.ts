import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { virtualCurrencyService } from '../../../../lib/gamification/VirtualCurrencyService';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const currency = searchParams.get('currency');
    const sellerId = searchParams.get('sellerId');
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '20');

    // This would fetch marketplace items from database
    // For now, return mock data
    const mockItems = [
      {
        id: '1',
        name: 'Premium Avatar Pack',
        description: 'Exclusive avatar collection for premium users',
        category: 'cosmetics',
        price: {
          currency: 'premium',
          amount: 50,
        },
        sellerId: new mongoose.Types.ObjectId(),
        isActive: true,
        createdAt: new Date(),
        metadata: { rarity: 'rare' },
      },
      {
        id: '2',
        name: 'Experience Boost',
        description: '2x experience points for 1 hour',
        category: 'boosts',
        price: {
          currency: 'primary',
          amount: 100,
        },
        sellerId: new mongoose.Types.ObjectId(),
        isActive: true,
        createdAt: new Date(),
        metadata: { duration: 3600 },
      },
      {
        id: '3',
        name: 'Custom Title',
        description: 'Unlock custom title creation',
        category: 'features',
        price: {
          currency: 'secondary',
          amount: 500,
        },
        sellerId: new mongoose.Types.ObjectId(),
        isActive: true,
        createdAt: new Date(),
        metadata: { permanent: true },
      },
    ];

    let filteredItems = mockItems;

    if (category) {
      filteredItems = filteredItems.filter(item => item.category === category);
    }

    if (currency) {
      filteredItems = filteredItems.filter(item => item.price.currency === currency);
    }

    if (sellerId) {
      filteredItems = filteredItems.filter(item => item.sellerId.toString() === sellerId);
    }

    return NextResponse.json({
      success: true,
      data: {
        items: filteredItems.slice(0, limit),
        total: filteredItems.length,
        categories: ['cosmetics', 'boosts', 'features'],
        currencies: ['primary', 'secondary', 'premium'],
      },
    });
  } catch (error) {
    console.error('Error fetching marketplace data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      category,
      price,
      userId,
      metadata,
    } = body;

    // Validate required fields
    if (!name || !description || !category || !price || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate price structure
    if (!price.currency || !price.amount || price.amount <= 0) {
      return NextResponse.json({ error: 'Invalid price structure' }, { status: 400 });
    }

    const item = await virtualCurrencyService.listItem(
      new mongoose.Types.ObjectId(userId),
      {
        name,
        description,
        category,
        price,
        metadata,
      }
    );

    return NextResponse.json({
      success: true,
      data: item,
    }, { status: 201 });
  } catch (error) {
    console.error('Error listing marketplace item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}