import mongoose from 'mongoose';
import Tournament, { ITournament } from '../../models/gamification/Tournament';
import TournamentMatch, { ITournamentMatch } from '../../models/gamification/TournamentMatch';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import { gamificationService } from './GamificationService';

export interface TournamentBracket {
  rounds: {
    roundNumber: number;
    matches: ITournamentMatch[];
    status: 'pending' | 'active' | 'completed';
  }[];
  currentRound: number;
  totalRounds: number;
}

export interface TournamentRegistration {
  userId: mongoose.Types.ObjectId;
  teamId?: mongoose.Types.ObjectId;
  registrationTime: Date;
  status: 'registered' | 'confirmed' | 'waitlisted';
  seed?: number;
}

export interface MatchResult {
  matchId: mongoose.Types.ObjectId;
  winnerId: mongoose.Types.ObjectId;
  loserId?: mongoose.Types.ObjectId;
  scores: {
    participant1: number;
    participant2: number;
  };
  duration: number;
  metadata: Record<string, any>;
}

export class TournamentEngine {
  private static instance: TournamentEngine;

  private constructor() {}

  public static getInstance(): TournamentEngine {
    if (!TournamentEngine.instance) {
      TournamentEngine.instance = new TournamentEngine();
    }
    return TournamentEngine.instance;
  }

  // Tournament Creation and Management
  async createTournament(
    creatorId: mongoose.Types.ObjectId,
    tournamentData: Partial<ITournament>
  ): Promise<ITournament> {
    try {
      const creator = await gamificationService.getUserProfile(creatorId);
      if (!creator) {
        throw new Error('Tournament creator not found');
      }

      const tournament = new Tournament({
        ...tournamentData,
        status: 'draft',
        bracket: {
          rounds: [],
          currentRound: 1,
          totalRounds: this.calculateTotalRounds(tournamentData.maxParticipants || 16, tournamentData.teamSize || 1),
        },
        statistics: {
          totalMatches: 0,
          completedMatches: 0,
          averageMatchDuration: 0,
          totalSpectators: 0,
          peakConcurrentViewers: 0,
        },
        createdBy: creatorId,
        managedBy: [creatorId],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await tournament.save();
    } catch (error) {
      throw new Error(`Failed to create tournament: ${error}`);
    }
  }

  async startTournament(tournamentId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return false;
      }

      if (tournament.participants.length < tournament.minParticipants) {
        return false; // Not enough participants
      }

      // Generate bracket
      await this.generateTournamentBracket(tournament);

      tournament.status = 'active';
      await tournament.save();

      return true;
    } catch (error) {
      throw new Error(`Failed to start tournament: ${error}`);
    }
  }

  private calculateTotalRounds(participantCount: number, teamSize: number): number {
    const actualParticipants = Math.max(participantCount, 2);
    return Math.ceil(Math.log2(actualParticipants));
  }

  private async generateTournamentBracket(tournament: ITournament): Promise<void> {
    try {
      const participants = [...tournament.participants];
      const rounds: ITournament['bracket']['rounds'] = [];
      const totalRounds = this.calculateTotalRounds(participants.length, tournament.teamSize);

      // Shuffle participants for random seeding
      this.shuffleArray(participants);

      // Assign seeds
      participants.forEach((participant, index) => {
        participant.seed = index + 1;
      });

      // Generate first round matches
      const firstRoundMatches = await this.generateRoundMatches(
        tournament._id,
        1,
        participants,
        tournament.teamSize
      );

      rounds.push({
        roundNumber: 1,
        matches: firstRoundMatches,
        status: 'active',
      });

      // Generate subsequent rounds (empty for now)
      for (let round = 2; round <= totalRounds; round++) {
        rounds.push({
          roundNumber: round,
          matches: [],
          status: 'pending',
        });
      }

      tournament.bracket.rounds = rounds;
      tournament.bracket.totalRounds = totalRounds;
      await tournament.save();
    } catch (error) {
      throw new Error(`Failed to generate tournament bracket: ${error}`);
    }
  }

  private async generateRoundMatches(
    tournamentId: mongoose.Types.ObjectId,
    roundNumber: number,
    participants: ITournament['participants'],
    teamSize: number
  ): Promise<ITournamentMatch[]> {
    const matches: ITournamentMatch[] = [];

    // Pair participants for matches
    for (let i = 0; i < participants.length; i += 2) {
      const participant1 = participants[i];
      const participant2 = participants[i + 1];

      const match = new TournamentMatch({
        tournamentId,
        roundNumber,
        matchNumber: Math.floor(i / 2) + 1,
        participants: [
          {
            userId: participant1.userId,
            teamId: participant1.teamId,
            seed: participant1.seed,
            score: 0,
            status: 'pending',
          },
          participant2 ? {
            userId: participant2.userId,
            teamId: participant2.teamId,
            seed: participant2.seed,
            score: 0,
            status: 'pending',
          } : null,
        ].filter(Boolean),
        type: teamSize > 1 ? 'best_of_three' : 'single',
        status: 'scheduled',
        schedule: {
          scheduledTime: new Date(Date.now() + roundNumber * 60 * 60 * 1000), // Stagger matches
          duration: 60,
          timezone: 'UTC',
        },
        scoring: {
          format: 'points',
          maxScore: 100,
          rounds: [],
        },
        monitoring: {
          spectatorCount: 0,
          suspiciousActivities: [],
          verificationStatus: 'pending',
          replayAvailable: false,
          automatedDetectionResults: {},
        },
        live: {
          isStreaming: false,
          viewerCount: 0,
          chatMessages: 0,
          highlights: [],
        },
        rewards: {
          experiencePoints: 50,
          virtualCurrency: { primary: 25, secondary: 0, premium: 0 },
          achievements: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      matches.push(await match.save());
    }

    return matches;
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  // Tournament Participation
  async registerForTournament(
    userId: mongoose.Types.ObjectId,
    tournamentId: mongoose.Types.ObjectId,
    teamId?: mongoose.Types.ObjectId
  ): Promise<boolean> {
    try {
      const [profile, tournament] = await Promise.all([
        gamificationService.getUserProfile(userId),
        Tournament.findById(tournamentId),
      ]);

      if (!profile || !tournament) {
        return false;
      }

      // Check if tournament is in registration phase
      if (tournament.status !== 'registration') {
        return false;
      }

      // Check if user meets requirements
      if (!this.meetsTournamentRequirements(profile, tournament)) {
        return false;
      }

      // Check if already registered
      const existingRegistration = tournament.participants.find(
        p => p.userId.toString() === userId.toString()
      );

      if (existingRegistration) {
        return false;
      }

      // Add participant
      tournament.participants.push({
        userId,
        teamId,
        status: 'registered',
        joinedAt: new Date(),
      });

      await tournament.save();
      return true;
    } catch (error) {
      throw new Error(`Failed to register for tournament: ${error}`);
    }
  }

  private meetsTournamentRequirements(profile: IUserGamificationProfile, tournament: ITournament): boolean {
    // Check level requirement
    if (tournament.registration.requirements.minLevel &&
        profile.level < tournament.registration.requirements.minLevel) {
      return false;
    }

    // Check achievement requirements
    if (tournament.registration.requirements.requiredAchievements) {
      const hasRequiredAchievements = tournament.registration.requirements.requiredAchievements.every(
        requiredAchievement => profile.achievements.includes(requiredAchievement)
      );

      if (!hasRequiredAchievements) {
        return false;
      }
    }

    return true;
  }

  // Match Management
  async startMatch(matchId: mongoose.Types.ObjectId): Promise<boolean> {
    try {
      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return false;
      }

      match.status = 'in_progress';
      match.schedule.actualStartTime = new Date();
      await match.save();

      return true;
    } catch (error) {
      throw new Error(`Failed to start match: ${error}`);
    }
  }

  async submitMatchResult(result: MatchResult): Promise<boolean> {
    try {
      const match = await TournamentMatch.findById(result.matchId);
      if (!match) {
        return false;
      }

      // Update match results
      match.status = 'completed';
      match.schedule.actualEndTime = new Date();
      match.results = {
        winner: result.winnerId,
        loser: result.loserId,
        finalScore: result.scores,
        statistics: {
          totalActions: result.metadata.totalActions || 0,
          averageResponseTime: result.metadata.averageResponseTime || 0,
          peakPerformance: result.metadata.peakPerformance || 0,
        },
      };

      // Update participant scores
      const winnerIndex = match.participants.findIndex(p => p.userId?.toString() === result.winnerId.toString());
      const loserIndex = match.participants.findIndex(p => p.userId?.toString() === result.loserId?.toString());

      if (winnerIndex !== -1) {
        match.participants[winnerIndex].score = result.scores.participant1;
        match.participants[winnerIndex].status = 'completed';
      }

      if (loserIndex !== -1) {
        match.participants[loserIndex].score = result.scores.participant2;
        match.participants[loserIndex].status = 'completed';
      }

      // Grant rewards
      if (winnerIndex !== -1) {
        const winnerId = match.participants[winnerIndex].userId!;
        await gamificationService.addExperience(winnerId, match.rewards.experiencePoints, 'tournament_win');
        await gamificationService.addCurrency(winnerId, 'primary', match.rewards.virtualCurrency.primary, 'tournament_win');
      }

      await match.save();

      // Advance tournament bracket
      await this.advanceTournamentBracket(match.tournamentId);

      return true;
    } catch (error) {
      throw new Error(`Failed to submit match result: ${error}`);
    }
  }

  private async advanceTournamentBracket(tournamentId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        return;
      }

      const currentRound = tournament.bracket.rounds.find(r => r.status === 'active');
      if (!currentRound) {
        return;
      }

      // Check if all matches in current round are completed
      const allMatchesCompleted = currentRound.matches.every(match => match.status === 'completed');

      if (!allMatchesCompleted) {
        return;
      }

      // Mark current round as completed
      currentRound.status = 'completed';

      // Generate next round if not final round
      if (currentRound.roundNumber < tournament.bracket.totalRounds) {
        const nextRoundNumber = currentRound.roundNumber + 1;
        const nextRound = tournament.bracket.rounds.find(r => r.roundNumber === nextRoundNumber);

        if (nextRound) {
          const winners = currentRound.matches.map(match => match.results.winner).filter(Boolean);
          const nextRoundMatches = await this.generateRoundMatches(
            tournamentId,
            nextRoundNumber,
            winners.map(winner => ({ userId: winner! })),
            tournament.teamSize
          );

          nextRound.matches = nextRoundMatches;
          nextRound.status = 'active';
        }
      } else {
        // Tournament completed
        await this.completeTournament(tournament);
      }

      await tournament.save();
    } catch (error) {
      throw new Error(`Failed to advance tournament bracket: ${error}`);
    }
  }

  private async completeTournament(tournament: ITournament): Promise<void> {
    try {
      // Determine final standings
      const finalMatch = tournament.bracket.rounds[tournament.bracket.rounds.length - 1]?.matches[0];
      if (finalMatch) {
        tournament.results = {
          winner: finalMatch.results.winner!,
          runnerUp: finalMatch.results.loser,
          finalStandings: tournament.participants.map((participant, index) => ({
            position: index + 1,
            participantId: participant.userId,
            score: participant.seed || 0,
          })),
        };
      }

      tournament.status = 'completed';

      // Grant tournament completion rewards
      for (const participant of tournament.participants) {
        if (participant.userId.toString() === tournament.results.winner?.toString()) {
          // Winner rewards
          await gamificationService.addExperience(participant.userId, 1000, 'tournament_victory');
          await gamificationService.addCurrency(participant.userId, 'primary', 500, 'tournament_victory');
          await gamificationService.addCurrency(participant.userId, 'secondary', 25, 'tournament_victory');
        } else {
          // Participation rewards
          await gamificationService.addExperience(participant.userId, 200, 'tournament_participation');
          await gamificationService.addCurrency(participant.userId, 'primary', 100, 'tournament_participation');
        }
      }

      await tournament.save();
    } catch (error) {
      throw new Error(`Failed to complete tournament: ${error}`);
    }
  }

  // Tournament Queries
  async getActiveTournaments(): Promise<ITournament[]> {
    try {
      return await Tournament.find({
        status: { $in: ['registration', 'active'] },
        isActive: true,
      }).populate('participants.userId');
    } catch (error) {
      throw new Error(`Failed to get active tournaments: ${error}`);
    }
  }

  async getTournamentBracket(tournamentId: mongoose.Types.ObjectId): Promise<TournamentBracket | null> {
    try {
      const tournament = await Tournament.findById(tournamentId).populate('bracket.rounds.matches');
      if (!tournament) {
        return null;
      }

      return {
        rounds: tournament.bracket.rounds,
        currentRound: tournament.bracket.currentRound,
        totalRounds: tournament.bracket.totalRounds,
      };
    } catch (error) {
      throw new Error(`Failed to get tournament bracket: ${error}`);
    }
  }

  // Anti-Cheating and Monitoring
  async reportMatchSuspiciousActivity(
    matchId: mongoose.Types.ObjectId,
    activityType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string
  ): Promise<void> {
    try {
      const match = await TournamentMatch.findById(matchId);
      if (!match) {
        return;
      }

      match.monitoring.suspiciousActivities.push({
        timestamp: new Date(),
        type: activityType,
        severity,
        description,
        resolved: false,
      });

      // Escalate based on severity
      if (severity === 'critical') {
        match.monitoring.verificationStatus = 'flagged';
        // Could trigger automatic disqualification or review
      }

      await match.save();
    } catch (error) {
      throw new Error(`Failed to report suspicious activity: ${error}`);
    }
  }

  // Analytics
  async getTournamentAnalytics(): Promise<{
    totalTournaments: number;
    activeTournaments: number;
    completedTournaments: number;
    averageParticipants: number;
    popularTypes: { type: string; count: number }[];
    completionRate: number;
  }> {
    try {
      const tournaments = await Tournament.find();

      const totalTournaments = tournaments.length;
      const activeTournaments = tournaments.filter(t => t.status === 'active').length;
      const completedTournaments = tournaments.filter(t => t.status === 'completed').length;

      const averageParticipants = tournaments.reduce((sum, t) => sum + t.participants.length, 0) / totalTournaments;

      const typeCount: Record<string, number> = {};
      tournaments.forEach(t => {
        typeCount[t.type] = (typeCount[t.type] || 0) + 1;
      });

      const popularTypes = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const completionRate = completedTournaments / totalTournaments * 100;

      return {
        totalTournaments,
        activeTournaments,
        completedTournaments,
        averageParticipants,
        popularTypes,
        completionRate,
      };
    } catch (error) {
      throw new Error(`Failed to get tournament analytics: ${error}`);
    }
  }
}

// Export singleton instance
export const tournamentEngine = TournamentEngine.getInstance();
export default TournamentEngine;