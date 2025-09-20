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
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');
    const userId = searchParams.get('userId');

    if (fromCurrency && toCurrency) {
      // Get exchange rate
      const exchangeRate = await virtualCurrencyService.getExchangeRate(fromCurrency, toCurrency);

      if (!exchangeRate) {
        return NextResponse.json({ error: 'Exchange rate not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          exchangeRate,
          estimatedFee: 0, // Would be calculated based on amount
          processingTime: 'Instant',
        },
      });
    } else if (userId) {
      // Get user's exchange history
      const profile = await gamificationService.getUserProfile(new mongoose.Types.ObjectId(userId));
      if (!profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        data: {
          balances: profile.virtualCurrency,
          exchangeHistory: [], // Would be populated from transaction history
        },
      });
    } else {
      // Get all available exchange rates
      const exchangeRates = [
        {
          fromCurrency: 'primary',
          toCurrency: 'secondary',
          rate: 10,
          fee: 0.02,
          minAmount: 10,
          maxAmount: 1000,
        },
        {
          fromCurrency: 'secondary',
          toCurrency: 'premium',
          rate: 0.01,
          fee: 0.05,
          minAmount: 100,
          maxAmount: 10000,
        },
        {
          fromCurrency: 'premium',
          toCurrency: 'primary',
          rate: 100,
          fee: 0.01,
          minAmount: 1,
          maxAmount: 100,
        },
      ];

      return NextResponse.json({
        success: true,
        data: exchangeRates,
      });
    }
  } catch (error) {
    console.error('Error fetching exchange data:', error);
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
      fromCurrency,
      toCurrency,
      amount,
      userId,
    } = body;

    // Validate required fields
    if (!fromCurrency || !toCurrency || !amount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if exchange is possible
    const exchangeRate = await virtualCurrencyService.getExchangeRate(fromCurrency, toCurrency);
    if (!exchangeRate) {
      return NextResponse.json({ error: 'Exchange rate not available' }, { status: 400 });
    }

    // Check minimum and maximum amounts
    if (amount < exchangeRate.minAmount || amount > exchangeRate.maxAmount) {
      return NextResponse.json({
        error: `Amount must be between ${exchangeRate.minAmount} and ${exchangeRate.maxAmount}`
      }, { status: 400 });
    }

    // Perform exchange
    const success = await virtualCurrencyService.exchangeCurrency(
      new mongoose.Types.ObjectId(userId),
      fromCurrency,
      toCurrency,
      amount
    );

    if (!success) {
      return NextResponse.json({ error: 'Exchange failed' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Exchange completed successfully',
        exchangeRate,
        exchangedAmount: amount * exchangeRate.rate,
        fee: (amount * exchangeRate.rate) * exchangeRate.fee,
      },
    });
  } catch (error) {
    console.error('Error performing exchange:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}