import { EventEmitter } from 'events';

export interface AmbientEnvironment {
  id: string;
  name: string;
  type: 'nature' | 'urban' | 'space' | 'underwater' | 'medieval' | 'future' | 'abstract';
  sounds: {
    primary: string;
    secondary?: string;
    ambient?: string;
  };
  visuals?: {
    background: string;
    effects: string[];
    colorScheme: string;
  };
  focusBoost: number; // 1-10 scale
  flowInduction: number; // 1-10 scale
  stressReduction: number; // 1-10 scale
}

export interface TimeDilationSettings {
  factor: number; // 1.0-2.0x
  enabled: boolean;
  adaptive: boolean; // automatically adjust based on focus level
  maxFactor: number; // maximum allowed dilation
}

export interface MeditationProtocol {
  id: string;
  name: string;
  duration: number; // seconds
  phases: {
    preparation: number;
    breathing: number;
    focus: number;
    integration: number;
  };
  guidance: {
    voice: boolean;
    visual: boolean;
    haptic: boolean;
  };
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface DeepWorkSession {
  id: string;
  userId: string;
  mode: 'time-dilation' | 'meditation-guided' | 'ambient-enhancement' | 'lucid-dreaming';
  environment: AmbientEnvironment;
  timeDilation: TimeDilationSettings;
  meditationProtocol?: MeditationProtocol;
  startTime: Date;
  duration: number; // minutes
  currentPhase: 'initialization' | 'induction' | 'deepening' | 'maintenance' | 'transition' | 'integration' | 'completed' | 'paused';
  metrics: {
    perceivedTimeRatio: number; // how much slower time feels
    focusDepth: number; // 0-100
    cognitiveLoad: number; // 0-100
    stressLevel: number; // 0-100
    flowState: number; // 0-100
    neuralCoherence: number; // 0-100 brain wave synchronization
  };
  isActive: boolean;
  completedTasks: string[];
  distractionsBlocked: number;
}

export class DeepWorkEnvironment extends EventEmitter {
  private sessions: Map<string, DeepWorkSession> = new Map();
  private environments: AmbientEnvironment[] = [];
  private meditationProtocols: MeditationProtocol[] = [];
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.initializeEnvironments();
    this.initializeMeditationProtocols();
    this.startMetricsUpdate();
  }

  private initializeEnvironments(): void {
    this.environments = [
      {
        id: 'forest-glade',
        name: 'Forest Glade',
        type: 'nature',
        sounds: {
          primary: 'gentle-wind',
          secondary: 'distant-birds',
          ambient: 'stream-flow'
        },
        visuals: {
          background: 'forest-scene',
          effects: ['floating-particles', 'soft-glow'],
          colorScheme: 'natural-greens'
        },
        focusBoost: 8,
        flowInduction: 9,
        stressReduction: 9,
      },
      {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        type: 'underwater',
        sounds: {
          primary: 'deep-ocean',
          secondary: 'whale-calls',
          ambient: 'underwater-current'
        },
        visuals: {
          background: 'ocean-floor',
          effects: ['bubbles', 'light-rays'],
          colorScheme: 'deep-blues'
        },
        focusBoost: 7,
        flowInduction: 8,
        stressReduction: 10,
      },
      {
        id: 'mountain-peak',
        name: 'Mountain Peak',
        type: 'nature',
        sounds: {
          primary: 'wind-mountain',
          secondary: 'eagle-calls',
          ambient: 'distant-thunder'
        },
        visuals: {
          background: 'mountain-summit',
          effects: ['mist', 'sun-rays'],
          colorScheme: 'alpine'
        },
        focusBoost: 9,
        flowInduction: 8,
        stressReduction: 8,
      },
      {
        id: 'space-station',
        name: 'Space Station',
        type: 'space',
        sounds: {
          primary: 'white-noise',
          secondary: 'system-hum',
          ambient: 'distant-stars'
        },
        visuals: {
          background: 'starfield',
          effects: ['floating-particles', 'neon-glow'],
          colorScheme: 'cyberpunk'
        },
        focusBoost: 10,
        flowInduction: 7,
        stressReduction: 6,
      },
      {
        id: 'medieval-library',
        name: 'Medieval Library',
        type: 'medieval',
        sounds: {
          primary: 'parchment-pages',
          secondary: 'distant-bells',
          ambient: 'fire-crackle'
        },
        visuals: {
          background: 'ancient-library',
          effects: ['candle-flicker', 'dust-particles'],
          colorScheme: 'warm-amber'
        },
        focusBoost: 8,
        flowInduction: 9,
        stressReduction: 7,
      },
    ];
  }

  private initializeMeditationProtocols(): void {
    this.meditationProtocols = [
      {
        id: 'mindful-breathing',
        name: 'Mindful Breathing',
        duration: 600, // 10 minutes
        phases: {
          preparation: 60,
          breathing: 300,
          focus: 180,
          integration: 60,
        },
        guidance: {
          voice: true,
          visual: true,
          haptic: false,
        },
        difficulty: 'beginner',
      },
      {
        id: 'deep-focus',
        name: 'Deep Focus Meditation',
        duration: 1200, // 20 minutes
        phases: {
          preparation: 120,
          breathing: 480,
          focus: 480,
          integration: 120,
        },
        guidance: {
          voice: true,
          visual: true,
          haptic: true,
        },
        difficulty: 'intermediate',
      },
      {
        id: 'flow-induction',
        name: 'Flow State Induction',
        duration: 1800, // 30 minutes
        phases: {
          preparation: 180,
          breathing: 720,
          focus: 720,
          integration: 180,
        },
        guidance: {
          voice: true,
          visual: true,
          haptic: true,
        },
        difficulty: 'advanced',
      },
    ];
  }

  private startMetricsUpdate(): void {
    // Update metrics every 2 seconds for smooth experience
    this.updateInterval = setInterval(() => {
      this.updateAllSessionMetrics();
    }, 2000);
  }

  public getEnvironments(): AmbientEnvironment[] {
    return this.environments;
  }

  public getMeditationProtocols(): MeditationProtocol[] {
    return this.meditationProtocols;
  }

  public startSession(
    userId: string,
    mode: DeepWorkSession['mode'],
    environmentId: string,
    timeDilation: TimeDilationSettings,
    meditationProtocolId?: string
  ): DeepWorkSession {
    // Check for existing active session
    const existingSession = this.sessions.get(userId);
    if (existingSession && existingSession.isActive) {
      throw new Error('User already has an active deep work session');
    }

    // Find environment
    const environment = this.environments.find(env => env.id === environmentId);
    if (!environment) {
      throw new Error(`Environment ${environmentId} not found`);
    }

    // Find meditation protocol if specified
    let meditationProtocol: MeditationProtocol | undefined;
    if (meditationProtocolId) {
      meditationProtocol = this.meditationProtocols.find(p => p.id === meditationProtocolId);
      if (!meditationProtocol) {
        throw new Error(`Meditation protocol ${meditationProtocolId} not found`);
      }
    }

    // Create new session
    const session: DeepWorkSession = {
      id: `session_${userId}_${Date.now()}`,
      userId,
      mode,
      environment,
      timeDilation,
      meditationProtocol,
      startTime: new Date(),
      duration: mode === 'meditation-guided' && meditationProtocol
        ? meditationProtocol.duration / 60
        : 60, // default 60 minutes
      currentPhase: 'initialization',
      metrics: {
        perceivedTimeRatio: 1.0,
        focusDepth: 0,
        cognitiveLoad: 20,
        stressLevel: 50,
        flowState: 0,
        neuralCoherence: 0,
      },
      isActive: true,
      completedTasks: [],
      distractionsBlocked: 0,
    };

    this.sessions.set(userId, session);

    // Start the deep work process
    this.processSession(session);

    return session;
  }

  public pauseSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (!session || !session.isActive) {
      throw new Error('No active session found for user');
    }

    session.isActive = false;
    session.currentPhase = 'paused';
  }

  public resumeSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error('No session found for user');
    }

    session.isActive = true;
    this.processSession(session);
  }

  public stopSession(userId: string): void {
    const session = this.sessions.get(userId);
    if (!session) {
      throw new Error('No session found for user');
    }

    session.isActive = false;
    session.currentPhase = 'completed';

    // Clean up session after delay
    setTimeout(() => {
      this.sessions.delete(userId);
    }, 5000);
  }

  public getSession(userId: string): DeepWorkSession | undefined {
    return this.sessions.get(userId);
  }

  private async processSession(session: DeepWorkSession): Promise<void> {
    const phases = this.getPhaseSequence(session.mode, session.meditationProtocol);

    for (const phase of phases) {
      if (!session.isActive) break;

      session.currentPhase = phase.name as any;
      await phase.action(session);

      // Wait for phase duration
      await this.delay(phase.duration);
    }

    // Session completed
    session.currentPhase = 'completed';
    session.isActive = false;
  }

  private getPhaseSequence(mode: DeepWorkSession['mode'], protocol?: MeditationProtocol) {
    switch (mode) {
      case 'time-dilation':
        return [
          { name: 'initialization', duration: 5000, action: this.timeDilationInitialization.bind(this) },
          { name: 'induction', duration: 30000, action: this.timeDilationInduction.bind(this) },
          { name: 'deepening', duration: 60000, action: this.timeDilationDeepening.bind(this) },
          { name: 'maintenance', duration: session.duration * 60 * 1000 - 95000, action: this.timeDilationMaintenance.bind(this) },
          { name: 'transition', duration: 15000, action: this.timeDilationTransition.bind(this) },
          { name: 'integration', duration: 10000, action: this.timeDilationIntegration.bind(this) },
        ];

      case 'meditation-guided':
        if (!protocol) throw new Error('Meditation protocol required for guided mode');
        return [
          { name: 'preparation', duration: protocol.phases.preparation * 1000, action: this.meditationPreparation.bind(this) },
          { name: 'breathing', duration: protocol.phases.breathing * 1000, action: this.meditationBreathing.bind(this) },
          { name: 'focus', duration: protocol.phases.focus * 1000, action: this.meditationFocus.bind(this) },
          { name: 'integration', duration: protocol.phases.integration * 1000, action: this.meditationIntegration.bind(this) },
        ];

      case 'ambient-enhancement':
        return [
          { name: 'initialization', duration: 3000, action: this.ambientInitialization.bind(this) },
          { name: 'induction', duration: 20000, action: this.ambientInduction.bind(this) },
          { name: 'maintenance', duration: session.duration * 60 * 1000 - 23000, action: this.ambientMaintenance.bind(this) },
          { name: 'integration', duration: 8000, action: this.ambientIntegration.bind(this) },
        ];

      default:
        return [
          { name: 'initialization', duration: 5000, action: this.ambientInitialization.bind(this) },
          { name: 'maintenance', duration: session.duration * 60 * 1000 - 5000, action: this.ambientMaintenance.bind(this) },
        ];
    }
  }

  // Time Dilation Phase Methods
  private timeDilationInitialization(session: DeepWorkSession): void {
    session.metrics.neuralCoherence = 20;
    session.metrics.focusDepth = 10;
    session.metrics.cognitiveLoad = 30;
  }

  private timeDilationInduction(session: DeepWorkSession): void {
    session.metrics.neuralCoherence = 45;
    session.metrics.focusDepth = 35;
    session.metrics.perceivedTimeRatio = 1.2;
    session.metrics.cognitiveLoad = 40;
  }

  private timeDilationDeepening(session: DeepWorkSession): void {
    session.metrics.neuralCoherence = 70;
    session.metrics.focusDepth = 65;
    session.metrics.perceivedTimeRatio = 1.5;
    session.metrics.cognitiveLoad = 35;
    session.metrics.flowState = 60;
  }

  private timeDilationMaintenance(session: DeepWorkSession): void {
    // Maintain deep state with slight fluctuations
    const baseRatio = 1.6;
    const fluctuation = (Math.random() - 0.5) * 0.2;
    session.metrics.perceivedTimeRatio = Math.max(1.0, baseRatio + fluctuation);
    session.metrics.neuralCoherence = 75 + (Math.random() - 0.5) * 10;
    session.metrics.focusDepth = 70 + (Math.random() - 0.5) * 15;
    session.metrics.flowState = 80 + (Math.random() - 0.5) * 10;
    session.metrics.cognitiveLoad = 25 + (Math.random() - 0.5) * 10;
  }

  private timeDilationTransition(session: DeepWorkSession): void {
    session.metrics.perceivedTimeRatio = 1.3;
    session.metrics.neuralCoherence = 60;
    session.metrics.focusDepth = 50;
    session.metrics.flowState = 40;
  }

  private timeDilationIntegration(session: DeepWorkSession): void {
    session.metrics.perceivedTimeRatio = 1.0;
    session.metrics.neuralCoherence = 30;
    session.metrics.focusDepth = 20;
    session.metrics.flowState = 20;
    session.metrics.cognitiveLoad = 20;
  }

  // Meditation Phase Methods
  private meditationPreparation(session: DeepWorkSession): void {
    session.metrics.focusDepth = 15;
    session.metrics.stressLevel = 45;
    session.metrics.neuralCoherence = 25;
  }

  private meditationBreathing(session: DeepWorkSession): void {
    session.metrics.focusDepth = 40;
    session.metrics.stressLevel = 30;
    session.metrics.neuralCoherence = 50;
    session.metrics.flowState = 30;
  }

  private meditationFocus(session: DeepWorkSession): void {
    session.metrics.focusDepth = 75;
    session.metrics.stressLevel = 15;
    session.metrics.neuralCoherence = 80;
    session.metrics.flowState = 70;
  }

  private meditationIntegration(session: DeepWorkSession): void {
    session.metrics.focusDepth = 60;
    session.metrics.stressLevel = 20;
    session.metrics.neuralCoherence = 65;
    session.metrics.flowState = 50;
  }

  // Ambient Enhancement Methods
  private ambientInitialization(session: DeepWorkSession): void {
    session.metrics.focusDepth = 20;
    session.metrics.stressLevel = 40;
    session.metrics.neuralCoherence = 30;
  }

  private ambientInduction(session: DeepWorkSession): void {
    session.metrics.focusDepth = 45;
    session.metrics.stressLevel = 25;
    session.metrics.neuralCoherence = 55;
    session.metrics.flowState = 35;
  }

  private ambientMaintenance(session: DeepWorkSession): void {
    session.metrics.focusDepth = 60 + (Math.random() - 0.5) * 20;
    session.metrics.stressLevel = 20 + (Math.random() - 0.5) * 10;
    session.metrics.neuralCoherence = 60 + (Math.random() - 0.5) * 15;
    session.metrics.flowState = 50 + (Math.random() - 0.5) * 25;
  }

  private ambientIntegration(session: DeepWorkSession): void {
    session.metrics.focusDepth = 40;
    session.metrics.stressLevel = 25;
    session.metrics.neuralCoherence = 50;
    session.metrics.flowState = 35;
  }

  private updateAllSessionMetrics(): void {
    for (const [userId, session] of this.sessions) {
      if (session.isActive && session.currentPhase === 'maintenance') {
        // Add realistic fluctuations
        const fluctuation = (Math.random() - 0.5) * 5;
        session.metrics.focusDepth = Math.max(0, Math.min(100, session.metrics.focusDepth + fluctuation));
        session.metrics.flowState = Math.max(0, Math.min(100, session.metrics.flowState + fluctuation * 0.8));
        session.metrics.neuralCoherence = Math.max(0, Math.min(100, session.metrics.neuralCoherence + fluctuation * 0.6));
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public getEnvironmentRecommendation(userPreferences: any): AmbientEnvironment {
    // Simple recommendation based on time of day and user state
    const hour = new Date().getHours();
    const stressLevel = userPreferences.stressLevel || 50;

    if (stressLevel > 70) {
      // High stress - recommend calming environments
      return this.environments.find(env => env.type === 'nature') || this.environments[0];
    } else if (hour < 6 || hour > 22) {
      // Night time - recommend relaxing environments
      return this.environments.find(env => env.id === 'ocean-depths') || this.environments[0];
    } else if (hour < 12) {
      // Morning - recommend energizing environments
      return this.environments.find(env => env.id === 'mountain-peak') || this.environments[0];
    } else {
      // Day time - recommend focus environments
      return this.environments.find(env => env.id === 'space-station') || this.environments[0];
    }
  }

  public destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.sessions.clear();
  }
}

// Singleton instance
let deepWorkEnvironment: DeepWorkEnvironment | null = null;

export function getDeepWorkEnvironment(): DeepWorkEnvironment {
  if (!deepWorkEnvironment) {
    deepWorkEnvironment = new DeepWorkEnvironment();
  }
  return deepWorkEnvironment;
}