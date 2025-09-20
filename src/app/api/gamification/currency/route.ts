import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { virtualCurrencyService } from '../../../../lib/gamification/VirtualCurrencyService';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import VirtualCurrency from '../../../../models/gamification/VirtualCurrency';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const currencyId = searchParams.get('currencyId');
    const type = searchParams.get('type');
    const userId = searchParams.get('userId');

    if (currencyId) {
      // Get specific currency
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        return NextResponse.json({ error: 'Currency not found' }, { status: 404 });
      }

      const analytics = await virtualCurrencyService.getCurrencyAnalytics(new mongoose.Types.ObjectId(currencyId));

      return NextResponse.json({
        success: true,
        data: {
          currency,
          analytics,
        },
      });
    } else if (userId) {
      // Get user's currency balances
      const profile = await gamificationService.getUserProfile(new mongoose.Types.ObjectId(userId));
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          balances: profile.virtualCurrency,
          transactions: [], // Would be populated from transaction history
        },
      });
    } else {
      // Get all currencies
      const filter: any = { isActive: true };
      if (type) filter.type = type;

      const currencies = await VirtualCurrency.find(filter);

      return NextResponse.json({
        success: true,
        data: currencies,
      });
    }
  } catch (error) {
    console.error('Error fetching currency data:', error);
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
      symbol,
      type,
      description,
      icon,
      color,
      economics,
      exchange,
      supplyControl,
      rewardOptimization,
      marketplace,
    } = body;

    // Validate required fields
    if (!name || !symbol || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const currencyData = {
      name,
      symbol,
      type,
      description,
      icon,
      color,
      economics,
      exchange,
      supplyControl,
      rewardOptimization,
      marketplace,
    };

    const currency = await virtualCurrencyService.createCurrency(currencyData);

    return NextResponse.json({
      success: true,
      data: currency,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating currency:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}