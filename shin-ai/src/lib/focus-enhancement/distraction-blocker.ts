import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import DistractionEvent from '../../models/DistractionEvent';

export interface DistractionRule {
  id: string;
  name: string;
  priority: number; // 1-10, higher = more important
  conditions: {
    eventTypes: string[];
    sources: string[];
    severityThreshold: number;
    timeWindows?: {
      start: string; // HH:MM format
      end: string;
      days: string[]; // ['monday', 'tuesday', etc.]
    };
    userState?: {
      flowStateMin?: number; // minimum flow state to trigger rule
      cognitiveLoadMax?: number; // maximum cognitive load
      mentalFatigueMax?: number; // maximum mental fatigue
    };
  };
  actions: {
    block: boolean;
    notify: boolean;
    postpone: boolean;
    postponeDuration?: number; // minutes
    customMessage?: string;
  };
  cooldown: number; // minutes between rule applications
  enabled: boolean;
}

export interface BlockingDecision {
  shouldBlock: boolean;
  rule?: DistractionRule;
  reason: string;
  customMessage?: string;
  postponeUntil?: Date;
}

export interface DistractionContext {
  userId: string;
  currentActivity?: string;
  flowStateLevel?: number;
  cognitiveLoad?: number;
  mentalFatigue?: number;
  timeOfDay: string;
  dayOfWeek: string;
  sessionActive: boolean;
  sessionType?: string;
}

export class DistractionBlocker extends EventEmitter {
  private rules: Map<string, DistractionRule> = new Map();
  private userCooldowns: Map<string, Map<string, Date>> = new Map();
  private activeBlocks: Map<string, Set<string>> = new Map(); // userId -> blocked sources

  constructor() {
    super();
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: DistractionRule[] = [
      {
        id: 'emergency-only',
        name: 'Emergency Communications Only',
        priority: 10,
        conditions: {
          eventTypes: ['notification'],
          sources: ['phone', 'emergency-contacts', 'medical'],
          severityThreshold: 8,
        },
        actions: {
          block: false,
          notify: true,
          postpone: false,
        },
        cooldown: 0,
        enabled: true,
      },
      {
        id: 'deep-work-protection',
        name: 'Deep Work Protection',
        priority: 9,
        conditions: {
          eventTypes: ['notification', 'external-interruption'],
          sources: ['work-email', 'chat-apps', 'social-media'],
          severityThreshold: 1,
          userState: {
            flowStateMin: 70,
            cognitiveLoadMax: 80,
          },
        },
        actions: {
          block: true,
          notify: false,
          postpone: true,
          postponeDuration: 90,
        },
        cooldown: 5,
        enabled: true,
      },
      {
        id: 'meeting-blocker',
        name: 'Meeting Protection',
        priority: 8,
        conditions: {
          eventTypes: ['notification', 'external-interruption'],
          sources: ['calendar', 'meeting-apps'],
          severityThreshold: 5,
          timeWindows: {
            start: '09:00',
            end: '17:00',
            days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          },
        },
        actions: {
          block: false,
          notify: true,
          postpone: false,
        },
        cooldown: 1,
        enabled: true,
      },
      {
        id: 'social-media-block',
        name: 'Social Media Distraction Block',
        priority: 7,
        conditions: {
          eventTypes: ['digital-temptation'],
          sources: ['social-media', 'entertainment'],
          severityThreshold: 1,
        },
        actions: {
          block: true,
          notify: false,
          postpone: true,
          postponeDuration: 60,
        },
        cooldown: 15,
        enabled: true,
      },
      {
        id: 'fatigue-override',
        name: 'Fatigue State Override',
        priority: 6,
        conditions: {
          eventTypes: ['notification', 'external-interruption'],
          sources: ['work-email', 'chat-apps'],
          severityThreshold: 1,
          userState: {
            mentalFatigueMax: 30, // Allow more interruptions when fatigued
          },
        },
        actions: {
          block: false,
          notify: true,
          postpone: false,
        },
        cooldown: 2,
        enabled: true,
      },
      {
        id: 'focus-session-block',
        name: 'Focus Session Protection',
        priority: 9,
        conditions: {
          eventTypes: ['notification', 'external-interruption', 'context-switch'],
          sources: ['*'], // Block all during focus sessions
          severityThreshold: 1,
        },
        actions: {
          block: true,
          notify: false,
          postpone: true,
          postponeDuration: 25, // Standard pomodoro duration
        },
        cooldown: 1,
        enabled: true,
      },
    ];

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule);
    });
  }

  public async shouldBlockDistraction(
    eventType: string,
    source: string,
    severity: number,
    context: DistractionContext
  ): Promise<BlockingDecision> {
    // Check cooldowns first
    if (this.isOnCooldown(context.userId, eventType, source)) {
      return {
        shouldBlock: false,
        reason: 'Rule on cooldown',
      };
    }

    // Get applicable rules sorted by priority
    const applicableRules = this.getApplicableRules(eventType, source, severity, context)
      .sort((a, b) => b.priority - a.priority);

    if (applicableRules.length === 0) {
      return {
        shouldBlock: false,
        reason: 'No applicable rules found',
      };
    }

    // Use highest priority rule
    const rule = applicableRules[0];

    // Check user state conditions
    if (!this.checkUserStateConditions(rule, context)) {
      return {
        shouldBlock: false,
        reason: 'User state conditions not met',
      };
    }

    // Apply the rule
    const decision: BlockingDecision = {
      shouldBlock: rule.actions.block,
      rule,
      reason: `Applied rule: ${rule.name}`,
      customMessage: rule.actions.customMessage,
    };

    if (rule.actions.postpone) {
      decision.postponeUntil = new Date(Date.now() + (rule.actions.postponeDuration || 30) * 60 * 1000);
    }

    // Set cooldown
    this.setCooldown(context.userId, rule.id);

    // Track active blocks
    if (decision.shouldBlock) {
      this.addActiveBlock(context.userId, source);
    }

    // Log the decision
    await this.logDistractionEvent({
      userId: context.userId,
      eventType,
      source: {
        application: source,
        category: this.categorizeSource(source),
        trigger: 'system-detected',
        automated: true,
      },
      severity,
      context: {
        activityBefore: context.currentActivity,
        timeSinceFocusStart: context.sessionActive ? 30 : 0, // simplified
        currentFlowState: context.flowStateLevel,
        mentalFatigue: context.mentalFatigue,
        timeOfDay: context.timeOfDay,
        dayOfWeek: context.dayOfWeek,
      },
      response: {
        action: decision.shouldBlock ? 'blocked' : 'allowed',
        responseTime: 0, // system response
        effectiveness: decision.shouldBlock ? 100 : 0,
      },
      blocking: {
        wasBlocked: decision.shouldBlock,
        blockingRule: rule.id,
        blockSuccess: decision.shouldBlock,
      },
      impact: {
        focusDisruption: decision.shouldBlock ? 0 : severity * 10,
        productivityLoss: decision.shouldBlock ? 0 : severity * 5,
        flowStateDrop: decision.shouldBlock ? 0 : severity * 2,
      },
      patterns: {
        frequency: 1,
        timeSinceLast: 0,
        recurring: false,
        peakHours: [context.timeOfDay],
      },
    });

    this.emit('distraction-processed', {
      userId: context.userId,
      decision,
      eventType,
      source,
    });

    return decision;
  }

  private getApplicableRules(
    eventType: string,
    source: string,
    severity: number,
    context: DistractionContext
  ): DistractionRule[] {
    const applicableRules: DistractionRule[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check event type
      if (!rule.conditions.eventTypes.includes(eventType) &&
          !rule.conditions.eventTypes.includes('*')) {
        continue;
      }

      // Check source
      if (!rule.conditions.sources.includes(source) &&
          !rule.conditions.sources.includes('*')) {
        continue;
      }

      // Check severity threshold
      if (severity < rule.conditions.severityThreshold) {
        continue;
      }

      // Check time windows
      if (rule.conditions.timeWindows &&
          !this.isInTimeWindow(rule.conditions.timeWindows, context)) {
        continue;
      }

      applicableRules.push(rule);
    }

    return applicableRules;
  }

  private checkUserStateConditions(rule: DistractionRule, context: DistractionContext): boolean {
    if (!rule.conditions.userState) return true;

    const { userState } = rule.conditions;

    if (userState.flowStateMin !== undefined &&
        context.flowStateLevel !== undefined &&
        context.flowStateLevel < userState.flowStateMin) {
      return false;
    }

    if (userState.cognitiveLoadMax !== undefined &&
        context.cognitiveLoad !== undefined &&
        context.cognitiveLoad > userState.cognitiveLoadMax) {
      return false;
    }

    if (userState.mentalFatigueMax !== undefined &&
        context.mentalFatigue !== undefined &&
        context.mentalFatigue > userState.mentalFatigueMax) {
      return false;
    }

    return true;
  }

  private isInTimeWindow(timeWindow: any, context: DistractionContext): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = context.dayOfWeek.toLowerCase();

    if (!timeWindow.days.includes(currentDay)) {
      return false;
    }

    return currentTime >= timeWindow.start && currentTime <= timeWindow.end;
  }

  private categorizeSource(source: string): string {
    const categories: { [key: string]: string } = {
      'work-email': 'work-email',
      'personal-email': 'personal-email',
      'chat-apps': 'chat-apps',
      'social-media': 'social-media',
      'calendar': 'calendar',
      'meeting-apps': 'meeting-apps',
      'phone': 'phone',
      'emergency-contacts': 'emergency-contacts',
      'medical': 'medical',
      'entertainment': 'entertainment',
    };

    return categories[source] || 'other';
  }

  private isOnCooldown(userId: string, eventType: string, source: string): boolean {
    const userCooldowns = this.userCooldowns.get(userId);
    if (!userCooldowns) return false;

    const key = `${eventType}-${source}`;
    const cooldownEnd = userCooldowns.get(key);

    if (!cooldownEnd) return false;

    return new Date() < cooldownEnd;
  }

  private setCooldown(userId: string, ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (!rule || rule.cooldown === 0) return;

    if (!this.userCooldowns.has(userId)) {
      this.userCooldowns.set(userId, new Map());
    }

    const userCooldowns = this.userCooldowns.get(userId)!;
    const cooldownEnd = new Date(Date.now() + rule.cooldown * 60 * 1000);
    userCooldowns.set(ruleId, cooldownEnd);
  }

  private addActiveBlock(userId: string, source: string): void {
    if (!this.activeBlocks.has(userId)) {
      this.activeBlocks.set(userId, new Set());
    }
    this.activeBlocks.get(userId)!.add(source);
  }

  public removeActiveBlock(userId: string, source: string): void {
    const userBlocks = this.activeBlocks.get(userId);
    if (userBlocks) {
      userBlocks.delete(source);
      if (userBlocks.size === 0) {
        this.activeBlocks.delete(userId);
      }
    }
  }

  public getActiveBlocks(userId: string): string[] {
    return Array.from(this.activeBlocks.get(userId) || []);
  }

  public addRule(rule: DistractionRule): void {
    this.rules.set(rule.id, rule);
    this.emit('rule-added', rule);
  }

  public updateRule(ruleId: string, updates: Partial<DistractionRule>): void {
    const existingRule = this.rules.get(ruleId);
    if (existingRule) {
      const updatedRule = { ...existingRule, ...updates };
      this.rules.set(ruleId, updatedRule);
      this.emit('rule-updated', updatedRule);
    }
  }

  public removeRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      this.emit('rule-removed', rule);
    }
  }

  public getRules(): DistractionRule[] {
    return Array.from(this.rules.values());
  }

  private async logDistractionEvent(eventData: any): Promise<void> {
    try {
      const distractionEvent = new DistractionEvent({
        userId: eventData.userId,
        organization: 'default', // This should come from context
        eventType: eventData.eventType,
        severity: eventData.severity,
        duration: 0, // System events have no duration
        timestamp: new Date(),
        source: eventData.source,
        context: eventData.context,
        response: eventData.response,
        blocking: eventData.blocking,
        impact: eventData.impact,
        patterns: eventData.patterns,
        metadata: {
          deviceType: 'system',
          location: 'auto-detected',
        },
      });

      await distractionEvent.save();
    } catch (error) {
      console.error('Failed to log distraction event:', error);
    }
  }

  public destroy(): void {
    this.rules.clear();
    this.userCooldowns.clear();
    this.activeBlocks.clear();
    this.removeAllListeners();
  }
}

// Singleton instance
let distractionBlocker: DistractionBlocker | null = null;

export function getDistractionBlocker(): DistractionBlocker {
  if (!distractionBlocker) {
    distractionBlocker = new DistractionBlocker();
  }
  return distractionBlocker;
}