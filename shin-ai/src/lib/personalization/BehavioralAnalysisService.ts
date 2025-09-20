import { BasePersonalizationService, AnalysisResult } from './BasePersonalizationService';
import { UserBehavior, UserProfile, UserPreferences, UserPsychographics, UserContext } from '@/models/personalization';

export interface BehavioralPattern {
  id: string;
  type: 'sequence' | 'frequency' | 'temporal' | 'contextual';
  description: string;
  confidence: number;
  frequency: number;
  avgDuration: number;
  peakHours: number[];
  triggers: string[];
  outcomes: string[];
}

export interface UserBehaviorSequence {
  id: string;
  userId: string;
  actions: Array<{
    action: string;
    targetType: string;
    targetId: string;
    timestamp: Date;
    context: any;
  }>;
  pattern: string;
  duration: number;
  outcome: 'success' | 'abandoned' | 'error';
  satisfaction: number;
}

export class BehavioralAnalysisService extends BasePersonalizationService {
  private readonly SEQUENCE_WINDOW_HOURS = 24;
  private readonly MIN_PATTERN_CONFIDENCE = 0.6;
  private readonly MAX_BEHAVIORS_PER_ANALYSIS = 1000;

  async analyzeBehavior(userId: string, behaviors: any[]): Promise<AnalysisResult> {
    if (!this.validateUserId(userId)) {
      throw new Error('Invalid user ID');
    }

    try {
      // Get recent behaviors if not provided
      const behaviorData = behaviors.length > 0
        ? behaviors
        : await this.getRecentBehaviors(userId);

      // Analyze different aspects of behavior
      const patterns = await this.identifyPatterns(userId, behaviorData);
      const sequences = await this.analyzeSequences(userId, behaviorData);
      const temporal = await this.analyzeTemporalPatterns(userId, behaviorData);
      const contextual = await this.analyzeContextualPatterns(userId, behaviorData);

      // Calculate overall behavioral score
      const score = this.calculateBehavioralScore(patterns, sequences, temporal, contextual);
      const confidence = this.calculateConfidence(
        behaviorData.length,
        this.calculateConsistency(patterns),
        this.calculateRecency(behaviorData)
      );

      // Generate insights and recommendations
      const insights = await this.generateInsights(patterns, sequences, temporal, contextual);
      const recommendations = await this.generateRecommendations(userId, patterns, sequences);

      return {
        score,
        confidence,
        insights,
        recommendations,
        metadata: {
          patterns: patterns.length,
          sequences: sequences.length,
          temporalPatterns: temporal.length,
          contextualPatterns: contextual.length,
          analysisTimestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Error analyzing behavior:', error);
      throw error;
    }
  }

  private async getRecentBehaviors(userId: string): Promise<any[]> {
    const since = new Date();
    since.setHours(since.getHours() - this.SEQUENCE_WINDOW_HOURS);

    return await UserBehavior.find({
      userId,
      timestamp: { $gte: since },
    })
      .sort({ timestamp: 1 })
      .limit(this.MAX_BEHAVIORS_PER_ANALYSIS);
  }

  private async identifyPatterns(userId: string, behaviors: any[]): Promise<BehavioralPattern[]> {
    const patterns: BehavioralPattern[] = [];

    // Frequency patterns
    const actionCounts = this.countActions(behaviors);
    for (const [action, count] of Object.entries(actionCounts)) {
      if (count > 5) { // Minimum threshold for pattern recognition
        patterns.push({
          id: `freq_${action}_${Date.now()}`,
          type: 'frequency',
          description: `Frequently performs ${action} (${count} times)`,
          confidence: Math.min(count / 20, 1), // Normalize confidence
          frequency: count,
          avgDuration: this.calculateAvgDuration(behaviors, action),
          peakHours: this.findPeakHours(behaviors, action),
          triggers: this.identifyTriggers(behaviors, action),
          outcomes: this.identifyOutcomes(behaviors, action),
        });
      }
    }

    // Sequence patterns
    const sequences = this.findCommonSequences(behaviors);
    for (const sequence of sequences) {
      if (sequence.confidence >= this.MIN_PATTERN_CONFIDENCE) {
        patterns.push({
          id: `seq_${sequence.id}`,
          type: 'sequence',
          description: `Follows pattern: ${sequence.pattern}`,
          confidence: sequence.confidence,
          frequency: sequence.frequency,
          avgDuration: sequence.avgDuration,
          peakHours: sequence.peakHours,
          triggers: sequence.triggers,
          outcomes: sequence.outcomes,
        });
      }
    }

    return patterns.sort((a, b) => b.confidence - a.confidence);
  }

  private async analyzeSequences(userId: string, behaviors: any[]): Promise<UserBehaviorSequence[]> {
    const sequences: UserBehaviorSequence[] = [];

    // Group behaviors by session
    const sessions = this.groupBySession(behaviors);

    for (const session of sessions) {
      if (session.actions.length >= 3) { // Minimum sequence length
        const pattern = this.identifySequencePattern(session.actions);
        const duration = this.calculateSequenceDuration(session.actions);
        const outcome = this.determineSequenceOutcome(session.actions);
        const satisfaction = this.calculateSequenceSatisfaction(session.actions);

        sequences.push({
          id: `seq_${userId}_${session.startTime.getTime()}`,
          userId,
          actions: session.actions,
          pattern,
          duration,
          outcome,
          satisfaction,
        });
      }
    }

    return sequences;
  }

  private async analyzeTemporalPatterns(userId: string, behaviors: any[]): Promise<any[]> {
    const temporalPatterns = [];

    // Hourly distribution
    const hourlyDistribution = this.calculateHourlyDistribution(behaviors);
    const peakHours = this.findPeakHoursFromDistribution(hourlyDistribution);

    temporalPatterns.push({
      type: 'hourly_distribution',
      peakHours,
      consistency: this.calculateTemporalConsistency(hourlyDistribution),
      description: `Most active during hours: ${peakHours.join(', ')}`,
    });

    // Daily patterns
    const dailyPatterns = this.calculateDailyPatterns(behaviors);
    temporalPatterns.push({
      type: 'daily_patterns',
      patterns: dailyPatterns,
      consistency: this.calculateDailyConsistency(dailyPatterns),
    });

    // Session duration patterns
    const durationPatterns = this.calculateDurationPatterns(behaviors);
    temporalPatterns.push({
      type: 'duration_patterns',
      patterns: durationPatterns,
    });

    return temporalPatterns;
  }

  private async analyzeContextualPatterns(userId: string, behaviors: any[]): Promise<any[]> {
    const contextualPatterns = [];

    // Device preferences
    const devicePatterns = this.analyzeDevicePreferences(behaviors);
    contextualPatterns.push({
      type: 'device_preferences',
      patterns: devicePatterns,
    });

    // Context switching
    const contextSwitching = this.analyzeContextSwitching(behaviors);
    contextualPatterns.push({
      type: 'context_switching',
      patterns: contextSwitching,
    });

    // Environmental factors
    const environmentalPatterns = this.analyzeEnvironmentalFactors(behaviors);
    contextualPatterns.push({
      type: 'environmental_factors',
      patterns: environmentalPatterns,
    });

    return contextualPatterns;
  }

  private countActions(behaviors: any[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const behavior of behaviors) {
      counts[behavior.action] = (counts[behavior.action] || 0) + 1;
    }

    return counts;
  }

  private calculateAvgDuration(behaviors: any[], action: string): number {
    const actionBehaviors = behaviors.filter(b => b.action === action);
    if (actionBehaviors.length === 0) return 0;

    const totalDuration = actionBehaviors.reduce((sum, b) => sum + (b.context?.timeSpent || 0), 0);
    return totalDuration / actionBehaviors.length;
  }

  private findPeakHours(behaviors: any[], action: string): number[] {
    const hourlyCounts: Record<number, number> = {};

    for (const behavior of behaviors) {
      if (behavior.action === action) {
        const hour = new Date(behavior.timestamp).getHours();
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
      }
    }

    return Object.entries(hourlyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private identifyTriggers(behaviors: any[], action: string): string[] {
    // Simplified trigger identification
    const triggers = new Set<string>();

    for (let i = 0; i < behaviors.length; i++) {
      if (behaviors[i].action === action && i > 0) {
        const previousAction = behaviors[i - 1].action;
        triggers.add(previousAction);
      }
    }

    return Array.from(triggers).slice(0, 5);
  }

  private identifyOutcomes(behaviors: any[], action: string): string[] {
    // Simplified outcome identification
    const outcomes = new Set<string>();

    for (let i = 0; i < behaviors.length; i++) {
      if (behaviors[i].action === action && i < behaviors.length - 1) {
        const nextAction = behaviors[i + 1].action;
        outcomes.add(nextAction);
      }
    }

    return Array.from(outcomes).slice(0, 5);
  }

  private findCommonSequences(behaviors: any[]): any[] {
    const sequences = [];
    const sequenceMap = new Map<string, { count: number; totalDuration: number; outcomes: string[] }>();

    // Look for 3-action sequences
    for (let i = 0; i < behaviors.length - 2; i++) {
      const sequence = [
        behaviors[i].action,
        behaviors[i + 1].action,
        behaviors[i + 2].action,
      ].join(' -> ');

      if (!sequenceMap.has(sequence)) {
        sequenceMap.set(sequence, { count: 0, totalDuration: 0, outcomes: [] });
      }

      const seqData = sequenceMap.get(sequence)!;
      seqData.count++;
      seqData.totalDuration += this.calculateSequenceDuration(behaviors.slice(i, i + 3));
      seqData.outcomes.push(behaviors[i + 3]?.action || 'end');
    }

    // Convert to array and calculate confidence
    for (const [sequence, data] of sequenceMap.entries()) {
      if (data.count >= 3) { // Minimum occurrences
        sequences.push({
          id: sequence.replace(/[^a-zA-Z0-9]/g, '_'),
          pattern: sequence,
          confidence: Math.min(data.count / 10, 1),
          frequency: data.count,
          avgDuration: data.totalDuration / data.count,
          peakHours: [], // Would need more complex analysis
          triggers: [],
          outcomes: [...new Set(data.outcomes)].slice(0, 3),
        });
      }
    }

    return sequences.sort((a, b) => b.confidence - a.confidence);
  }

  private groupBySession(behaviors: any[]): any[] {
    const sessions = [];
    let currentSession = null;

    for (const behavior of behaviors) {
      const behaviorTime = new Date(behavior.timestamp);

      if (!currentSession ||
          (behaviorTime.getTime() - new Date(currentSession.lastTime).getTime()) > 30 * 60 * 1000) {
        // Start new session
        if (currentSession) {
          sessions.push(currentSession);
        }
        currentSession = {
          startTime: behavior.timestamp,
          lastTime: behavior.timestamp,
          actions: [behavior],
        };
      } else {
        // Continue current session
        currentSession.actions.push(behavior);
        currentSession.lastTime = behavior.timestamp;
      }
    }

    if (currentSession) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private identifySequencePattern(actions: any[]): string {
    if (actions.length < 2) return 'single_action';

    const actionTypes = actions.map(a => a.action);
    const uniqueActions = new Set(actionTypes);

    if (uniqueActions.size === 1) {
      return 'repetitive';
    } else if (this.isSequential(actionTypes)) {
      return 'sequential';
    } else {
      return 'exploratory';
    }
  }

  private isSequential(actions: string[]): boolean {
    // Check if actions follow a logical sequence
    const commonSequences = [
      ['view', 'click', 'complete'],
      ['search', 'view', 'bookmark'],
      ['click', 'view', 'share'],
    ];

    return commonSequences.some(seq =>
      seq.every(action => actions.includes(action))
    );
  }

  private calculateSequenceDuration(actions: any[]): number {
    if (actions.length === 0) return 0;

    const startTime = new Date(actions[0].timestamp);
    const endTime = new Date(actions[actions.length - 1].timestamp);
    return endTime.getTime() - startTime.getTime();
  }

  private determineSequenceOutcome(actions: any[]): 'success' | 'abandoned' | 'error' {
    const lastAction = actions[actions.length - 1];

    if (lastAction.action === 'complete' || lastAction.action === 'share') {
      return 'success';
    } else if (lastAction.action === 'skip' || actions.length < 3) {
      return 'abandoned';
    } else {
      return 'success'; // Default assumption
    }
  }

  private calculateSequenceSatisfaction(actions: any[]): number {
    // Simplified satisfaction calculation
    const positiveActions = ['complete', 'bookmark', 'share', 'rate'];
    const negativeActions = ['skip', 'error'];

    const positiveCount = actions.filter(a => positiveActions.includes(a.action)).length;
    const negativeCount = actions.filter(a => negativeActions.includes(a.action)).length;

    return Math.max(0, Math.min(1, (positiveCount - negativeCount + 1) / 2));
  }

  private calculateHourlyDistribution(behaviors: any[]): Record<number, number> {
    const distribution: Record<number, number> = {};

    for (const behavior of behaviors) {
      const hour = new Date(behavior.timestamp).getHours();
      distribution[hour] = (distribution[hour] || 0) + 1;
    }

    return distribution;
  }

  private findPeakHoursFromDistribution(distribution: Record<number, number>): number[] {
    return Object.entries(distribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  private calculateTemporalConsistency(distribution: Record<number, number>): number {
    const values = Object.values(distribution);
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    // Normalize to 0-1 (lower variance = higher consistency)
    return Math.max(0, 1 - variance / (mean + 1));
  }

  private calculateDailyPatterns(behaviors: any[]): any[] {
    const dailyCounts: Record<number, number> = {};

    for (const behavior of behaviors) {
      const day = new Date(behavior.timestamp).getDay();
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;
    }

    return Object.entries(dailyCounts)
      .map(([day, count]) => ({
        day: parseInt(day),
        count,
        percentage: count / behaviors.length,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private calculateDailyConsistency(dailyPatterns: any[]): number {
    const percentages = dailyPatterns.map(p => p.percentage);
    if (percentages.length === 0) return 0;

    const mean = percentages.reduce((sum, val) => sum + val, 0) / percentages.length;
    const variance = percentages.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / percentages.length;

    return Math.max(0, 1 - variance / (mean + 0.1));
  }

  private calculateDurationPatterns(behaviors: any[]): any[] {
    const durations = behaviors
      .map(b => b.context?.timeSpent || 0)
      .filter(d => d > 0);

    if (durations.length === 0) return [];

    const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const maxDuration = Math.max(...durations);
    const minDuration = Math.min(...durations);

    return [
      { type: 'average', duration: avgDuration },
      { type: 'range', min: minDuration, max: maxDuration },
    ];
  }

  private analyzeDevicePreferences(behaviors: any[]): any[] {
    const deviceCounts: Record<string, number> = {};

    for (const behavior of behaviors) {
      const device = behavior.context?.userAgent || 'unknown';
      deviceCounts[device] = (deviceCounts[device] || 0) + 1;
    }

    return Object.entries(deviceCounts)
      .map(([device, count]) => ({
        device: device.substring(0, 50), // Truncate for readability
        count,
        percentage: count / behaviors.length,
      }))
      .sort((a, b) => b.count - a.count);
  }

  private analyzeContextSwitching(behaviors: any[]): any[] {
    let switches = 0;
    let previousContext = null;

    for (const behavior of behaviors) {
      const currentContext = behavior.context?.page || 'unknown';

      if (previousContext && previousContext !== currentContext) {
        switches++;
      }

      previousContext = currentContext;
    }

    return [{
      totalSwitches: switches,
      switchRate: behaviors.length > 0 ? switches / behaviors.length : 0,
      avgSessionContexts: switches / Math.max(1, behaviors.length / 10),
    }];
  }

  private analyzeEnvironmentalFactors(behaviors: any[]): any[] {
    const factors: Record<string, number> = {};

    for (const behavior of behaviors) {
      const context = behavior.context;

      if (context?.viewport) {
        const viewportKey = `${context.viewport.width}x${context.viewport.height}`;
        factors[viewportKey] = (factors[viewportKey] || 0) + 1;
      }

      if (context?.page) {
        factors[`page_${context.page}`] = (factors[`page_${context.page}`] || 0) + 1;
      }
    }

    return Object.entries(factors)
      .map(([factor, count]) => ({
        factor,
        count,
        percentage: count / behaviors.length,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateBehavioralScore(
    patterns: BehavioralPattern[],
    sequences: UserBehaviorSequence[],
    temporal: any[],
    contextual: any[]
  ): number {
    // Weighted scoring based on different behavioral aspects
    const patternScore = patterns.length > 0 ? Math.min(patterns.length * 10, 40) : 0;
    const sequenceScore = sequences.length > 0 ? Math.min(sequences.length * 5, 30) : 0;
    const temporalScore = temporal.length > 0 ? 15 : 0;
    const contextualScore = contextual.length > 0 ? 15 : 0;

    // Bonus for consistency and engagement
    const consistencyBonus = this.calculateConsistency(patterns) * 10;
    const engagementBonus = sequences.filter(s => s.outcome === 'success').length * 2;

    return Math.min(100, patternScore + sequenceScore + temporalScore + contextualScore + consistencyBonus + engagementBonus);
  }

  private calculateConsistency(patterns: BehavioralPattern[]): number {
    if (patterns.length === 0) return 0;

    const confidences = patterns.map(p => p.confidence);
    const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;

    return avgConfidence;
  }

  private calculateRecency(behaviors: any[]): number {
    if (behaviors.length === 0) return 30; // Default to 30 days if no data

    const latest = new Date(behaviors[behaviors.length - 1].timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - latest.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  private async generateInsights(
    patterns: BehavioralPattern[],
    sequences: UserBehaviorSequence[],
    temporal: any[],
    contextual: any[]
  ): Promise<string[]> {
    const insights = [];

    // Pattern-based insights
    for (const pattern of patterns.slice(0, 3)) {
      insights.push(`User shows ${pattern.description.toLowerCase()} with ${(pattern.confidence * 100).toFixed(1)}% confidence`);
    }

    // Sequence-based insights
    const successfulSequences = sequences.filter(s => s.outcome === 'success');
    if (successfulSequences.length > 0) {
      insights.push(`Successfully completes ${(successfulSequences.length / sequences.length * 100).toFixed(1)}% of behavior sequences`);
    }

    // Temporal insights
    for (const temp of temporal) {
      if (temp.type === 'hourly_distribution' && temp.peakHours.length > 0) {
        insights.push(`Most active during hours: ${temp.peakHours.join(', ')}`);
      }
    }

    // Contextual insights
    for (const context of contextual) {
      if (context.type === 'device_preferences' && context.patterns.length > 0) {
        const topDevice = context.patterns[0];
        insights.push(`Prefers using ${topDevice.device} (${(topDevice.percentage * 100).toFixed(1)}% of interactions)`);
      }
    }

    return insights;
  }

  private async generateRecommendations(
    userId: string,
    patterns: BehavioralPattern[],
    sequences: UserBehaviorSequence[]
  ): Promise<string[]> {
    const recommendations = [];

    // Based on successful patterns
    const successfulPatterns = patterns.filter(p => p.confidence > 0.7);
    if (successfulPatterns.length > 0) {
      recommendations.push('Continue leveraging successful behavior patterns for optimal productivity');
    }

    // Based on abandoned sequences
    const abandonedSequences = sequences.filter(s => s.outcome === 'abandoned');
    if (abandonedSequences.length > sequences.length * 0.3) {
      recommendations.push('Consider simplifying workflows to reduce abandonment rate');
    }

    // Based on temporal patterns
    const temporalPatterns = patterns.filter(p => p.type === 'temporal');
    if (temporalPatterns.length > 0) {
      recommendations.push('Schedule important tasks during identified peak productivity hours');
    }

    // Based on contextual preferences
    const contextualPatterns = patterns.filter(p => p.type === 'contextual');
    if (contextualPatterns.length > 0) {
      recommendations.push('Optimize interface for preferred devices and contexts');
    }

    return recommendations;
  }

  // Required abstract method implementations
  async updatePreferences(userId: string, interactions: any[]): Promise<UserPreferences> {
    // This would be implemented by a preference learning service
    // For now, return a basic preferences object
    const preferences = await UserPreferences.findOne({ userId });

    if (!preferences) {
      return await UserPreferences.create({
        userId,
        contentTypes: ['article', 'tutorial'],
        topics: ['general'],
        difficulty: 'intermediate',
        learningStyle: 'visual',
        timePreference: 'afternoon',
        pace: 'moderate',
        notifications: {
          email: true,
          push: true,
          sms: false,
          frequency: 'daily',
        },
        privacy: {
          profileVisibility: 'private',
          dataCollection: true,
          analytics: true,
        },
      });
    }

    return preferences;
  }

  async analyzePsychographics(userId: string, data: any): Promise<AnalysisResult> {
    // This would be implemented by a psychographics analysis service
    // For now, return a basic analysis result
    return {
      score: 75,
      confidence: 0.6,
      insights: ['Balanced personality profile detected'],
      recommendations: ['Continue current engagement patterns'],
      metadata: {
        analysisType: 'psychographics',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async updateContext(userId: string, contextData: any): Promise<UserContext> {
    // This would be implemented by a context awareness service
    // For now, return a basic context object
    const context = await UserContext.findOne({ userId });

    if (!context) {
      return await UserContext.create({
        userId,
        currentSession: {
          id: `session_${Date.now()}`,
          startTime: new Date(),
          lastActivity: new Date(),
          device: {
            type: 'desktop',
            os: 'unknown',
            browser: 'unknown',
          },
        },
        circadianRhythm: {
          peakHours: [9, 10, 11, 14, 15, 16],
          preferredTimes: {
            content: [9, 10, 11, 14, 15, 16],
            communication: [9, 10, 11, 14, 15, 16],
            learning: [9, 10, 11, 14, 15, 16],
          },
        },
        fatigueLevel: 0.2,
        stressLevel: 0.3,
        focusState: 'medium',
        environment: {
          noiseLevel: 'moderate',
          lighting: 'bright',
          setting: 'home',
        },
      });
    }

    return context;
  }
}