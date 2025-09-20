import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { tournamentEngine } from '../../../../lib/gamification/TournamentEngine';
import { gamificationService } from '../../../../lib/gamification/GamificationService';
import Tournament from '../../../../models/gamification/Tournament';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');

    const filter: any = {};

    if (status) filter.status = status;
    if (category) filter.category = category;
    if (type) filter.type = type;
    if (featured === 'true') filter.featured = true;

    const tournaments = await tournamentEngine.getActiveTournaments();

    // Apply additional filters
    let filteredTournaments = tournaments;
    if (Object.keys(filter).length > 0) {
      filteredTournaments = tournaments.filter(tournament => {
        return Object.entries(filter).every(([key, value]) => {
          return tournament[key as keyof typeof tournament] === value;
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: filteredTournaments.slice(0, limit),
    });
  } catch (error) {
    console.error('Error fetching tournaments:', error);
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
      type,
      category,
      maxParticipants,
      minParticipants,
      teamSize,
      registration,
      prizes,
      rules,
      antiCheat,
      tags,
      isPublic,
      featured,
    } = body;

    // Validate required fields
    if (!name || !description || !type || !maxParticipants) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get user ID from session (placeholder)
    const creatorId = new mongoose.Types.ObjectId();

    const tournamentData = {
      name,
      description,
      type,
      category: category || 'casual',
      maxParticipants,
      minParticipants: minParticipants || 2,
      teamSize: teamSize || 1,
      registration: registration || {
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        requirements: {},
      },
      prizes: prizes || [],
      rules: rules || {
        scoringSystem: 'standard',
        tiebreakerRules: [],
        disqualificationRules: [],
        spectatorMode: true,
        streamingAllowed: true,
      },
      antiCheat: antiCheat || {
        monitoringLevel: 'medium',
        verificationRequired: false,
        replayAnalysis: false,
        spectatorVerification: false,
        automatedDetection: true,
      },
      tags: tags || [],
      isPublic: isPublic !== false,
      featured: featured || false,
    };

    const tournament = await tournamentEngine.createTournament(creatorId, tournamentData);

    return NextResponse.json({
      success: true,
      data: tournament,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}