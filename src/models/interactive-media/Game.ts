import mongoose, { Document, Schema } from 'mongoose';

export interface IGameWorld {
  seed: number;
  dimensions: {
    width: number;
    height: number;
    depth?: number;
  };
  terrain: {
    type: 'procedural' | 'predefined';
    noiseScale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
  };
  biomes: Array<{
    name: string;
    temperature: number;
    humidity: number;
    elevation: number;
    resources: string[];
  }>;
}

export interface IGameNPC {
  id: string;
  name: string;
  type: 'hostile' | 'neutral' | 'friendly' | 'quest';
  behaviorTree: {
    rootNode: string;
    nodes: Array<{
      id: string;
      type: 'selector' | 'sequence' | 'condition' | 'action';
      condition?: string;
      action?: string;
      children: string[];
    }>;
  };
  stats: {
    health: number;
    damage: number;
    speed: number;
    intelligence: number;
  };
  position: {
    x: number;
    y: number;
    z: number;
  };
  inventory: string[];
  dialogue: Array<{
    trigger: string;
    responses: Array<{
      text: string;
      conditions: string[];
      actions: string[];
    }>;
  }>;
}

export interface IGameDifficulty {
  level: 'easy' | 'medium' | 'hard' | 'expert' | 'adaptive';
  scaling: {
    enemyHealth: number;
    enemyDamage: number;
    resourceSpawnRate: number;
    questComplexity: number;
  };
  adaptiveRules: Array<{
    trigger: string;
    adjustment: {
      property: string;
      value: number;
      duration: number;
    };
  }>;
}

export interface IGameNarrative {
  title: string;
  description: string;
  branches: Array<{
    id: string;
    parentId?: string;
    conditions: string[];
    content: {
      text: string;
      choices: Array<{
        text: string;
        nextBranchId: string;
        requirements: string[];
        consequences: Array<{
          type: 'stat_change' | 'item_gain' | 'relationship_change';
          target: string;
          value: number;
        }>;
      }>;
    };
  }>;
  variables: Record<string, any>;
}

export interface IGamePlayer {
  id: string;
  stats: Record<string, number>;
  inventory: Array<{
    itemId: string;
    quantity: number;
    equipped: boolean;
  }>;
  position: {
    x: number;
    y: number;
    z: number;
  };
  progress: {
    completedQuests: string[];
    discoveredLocations: string[];
    skillLevels: Record<string, number>;
  };
}

export interface IGame extends Document {
  title: string;
  description: string;
  genre: string[];
  tags: string[];
  organizationId: mongoose.Types.ObjectId;
  creatorId: mongoose.Types.ObjectId;
  world: IGameWorld;
  npcs: IGameNPC[];
  difficulty: IGameDifficulty;
  narrative: IGameNarrative;
  players: IGamePlayer[];
  settings: {
    maxPlayers: number;
    isPublic: boolean;
    allowMods: boolean;
    pvpEnabled: boolean;
  };
  metadata: {
    version: string;
    lastPlayed: Date;
    totalPlayTime: number;
    rating: number;
    playCount: number;
  };
  assets: Array<{
    type: 'model' | 'texture' | 'sound' | 'script';
    url: string;
    name: string;
    size: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const GameWorldSchema = new Schema({
  seed: {
    type: Number,
    required: true,
  },
  dimensions: {
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    depth: { type: Number },
  },
  terrain: {
    type: {
      type: String,
      enum: ['procedural', 'predefined'],
      default: 'procedural',
    },
    noiseScale: { type: Number, default: 0.01 },
    octaves: { type: Number, default: 4 },
    persistence: { type: Number, default: 0.5 },
    lacunarity: { type: Number, default: 2.0 },
  },
  biomes: [{
    name: { type: String, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    elevation: { type: Number, required: true },
    resources: [{ type: String }],
  }],
});

const GameNPCSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['hostile', 'neutral', 'friendly', 'quest'],
    default: 'neutral',
  },
  behaviorTree: {
    rootNode: { type: String, required: true },
    nodes: [{
      id: { type: String, required: true },
      type: {
        type: String,
        enum: ['selector', 'sequence', 'condition', 'action'],
        required: true,
      },
      condition: { type: String },
      action: { type: String },
      children: [{ type: String }],
    }],
  },
  stats: {
    health: { type: Number, default: 100 },
    damage: { type: Number, default: 10 },
    speed: { type: Number, default: 1.0 },
    intelligence: { type: Number, default: 1.0 },
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  inventory: [{ type: String }],
  dialogue: [{
    trigger: { type: String, required: true },
    responses: [{
      text: { type: String, required: true },
      conditions: [{ type: String }],
      actions: [{ type: String }],
    }],
  }],
});

const GameDifficultySchema = new Schema({
  level: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert', 'adaptive'],
    default: 'medium',
  },
  scaling: {
    enemyHealth: { type: Number, default: 1.0 },
    enemyDamage: { type: Number, default: 1.0 },
    resourceSpawnRate: { type: Number, default: 1.0 },
    questComplexity: { type: Number, default: 1.0 },
  },
  adaptiveRules: [{
    trigger: { type: String, required: true },
    adjustment: {
      property: { type: String, required: true },
      value: { type: Number, required: true },
      duration: { type: Number, required: true },
    },
  }],
});

const GameNarrativeSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  branches: [{
    id: { type: String, required: true },
    parentId: { type: String },
    conditions: [{ type: String }],
    content: {
      text: { type: String, required: true },
      choices: [{
        text: { type: String, required: true },
        nextBranchId: { type: String, required: true },
        requirements: [{ type: String }],
        consequences: [{
          type: {
            type: String,
            enum: ['stat_change', 'item_gain', 'relationship_change'],
            required: true,
          },
          target: { type: String, required: true },
          value: { type: Number, required: true },
        }],
      }],
    },
  }],
  variables: { type: Schema.Types.Mixed, default: {} },
});

const GamePlayerSchema = new Schema({
  id: { type: String, required: true },
  stats: { type: Schema.Types.Mixed, default: {} },
  inventory: [{
    itemId: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    equipped: { type: Boolean, default: false },
  }],
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  progress: {
    completedQuests: [{ type: String }],
    discoveredLocations: [{ type: String }],
    skillLevels: { type: Schema.Types.Mixed, default: {} },
  },
});

const GameSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  genre: [{ type: String }],
  tags: [{ type: String }],
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
  creatorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  world: { type: GameWorldSchema, required: true },
  npcs: [GameNPCSchema],
  difficulty: { type: GameDifficultySchema, default: () => ({}) },
  narrative: { type: GameNarrativeSchema, default: () => ({}) },
  players: [GamePlayerSchema],
  settings: {
    maxPlayers: { type: Number, default: 100 },
    isPublic: { type: Boolean, default: false },
    allowMods: { type: Boolean, default: false },
    pvpEnabled: { type: Boolean, default: false },
  },
  metadata: {
    version: { type: String, default: '1.0.0' },
    lastPlayed: { type: Date, default: null },
    totalPlayTime: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    playCount: { type: Number, default: 0 },
  },
  assets: [{
    type: {
      type: String,
      enum: ['model', 'texture', 'sound', 'script'],
      required: true,
    },
    url: { type: String, required: true },
    name: { type: String, required: true },
    size: { type: Number, required: true },
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
GameSchema.index({ organizationId: 1 });
GameSchema.index({ creatorId: 1 });
GameSchema.index({ title: 'text', description: 'text' });
GameSchema.index({ genre: 1 });
GameSchema.index({ tags: 1 });
GameSchema.index({ 'metadata.rating': -1 });
GameSchema.index({ 'metadata.playCount': -1 });
GameSchema.index({ createdAt: -1 });

// Method to get active NPCs
GameSchema.methods.getActiveNPCs = function(): IGameNPC[] {
  return this.npcs.filter((npc: IGameNPC) => npc.stats.health > 0);
};

// Method to update player progress
GameSchema.methods.updatePlayerProgress = function(playerId: string, progress: Partial<IGamePlayer['progress']>): IGamePlayer | null {
  const player = this.players.find((p: IGamePlayer) => p.id === playerId);
  if (player) {
    Object.assign(player.progress, progress);
    return player;
  }
  return null;
};

// Method to calculate adaptive difficulty
GameSchema.methods.calculateAdaptiveDifficulty = function(playerStats: Record<string, number>): Partial<IGameDifficulty['scaling']> {
  const baseDifficulty = this.difficulty.scaling;
  const playerLevel = Math.max(...Object.values(playerStats));

  return {
    enemyHealth: baseDifficulty.enemyHealth * (1 + playerLevel * 0.1),
    enemyDamage: baseDifficulty.enemyDamage * (1 + playerLevel * 0.05),
    resourceSpawnRate: Math.max(0.1, baseDifficulty.resourceSpawnRate * (1 - playerLevel * 0.02)),
    questComplexity: baseDifficulty.questComplexity * (1 + playerLevel * 0.1),
  };
};

export default mongoose.models.Game || mongoose.model<IGame>('Game', GameSchema);