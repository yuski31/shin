import mongoose, { Document, Schema } from 'mongoose';

export interface IVirtualCurrency extends Document {
  name: string;
  symbol: string;
  type: 'primary' | 'secondary' | 'premium' | 'seasonal' | 'event';

  // Currency Configuration
  description: string;
  icon: string;
  color: string;

  // Economic Properties
  economics: {
    initialSupply: number;
    maxSupply?: number;
    currentSupply: number;
    inflationRate: number; // percentage per year
    deflationRate?: number; // percentage per year
    transactionFee: number; // percentage
  };

  // Exchange Configuration
  exchange: {
    isExchangeable: boolean;
    exchangeRate: {
      toPrimary?: number;
      toSecondary?: number;
      toPremium?: number;
      toRealCurrency?: number; // if applicable
    };
    exchangeRestrictions: {
      minAmount: number;
      maxAmount: number;
      cooldownHours: number;
      dailyLimit: number;
      monthlyLimit: number;
    };
  };

  // Supply Control Mechanisms
  supplyControl: {
    type: 'fixed' | 'algorithmic' | 'manual' | 'burning' | 'staking';
    parameters: Record<string, any>;
    adjustmentSchedule: {
      date: Date;
      adjustment: number;
      reason: string;
    }[];
  };

  // Reward Optimization (ML-based)
  rewardOptimization: {
    isEnabled: boolean;
    modelVersion: string;
    parameters: Record<string, any>;
    lastOptimized: Date;
    optimizationMetrics: {
      userEngagement: number;
      retentionRate: number;
      conversionRate: number;
      averageSessionTime: number;
    };
  };

  // Spending Opportunities
  spendingOpportunities: {
    categories: string[];
    vendors: mongoose.Types.ObjectId[];
    restrictions: {
      userLevel?: number;
      achievements?: mongoose.Types.ObjectId[];
      specialConditions?: string[];
    };
  }[];

  // Marketplace Configuration
  marketplace: {
    isEnabled: boolean;
    categories: string[];
    feeStructure: {
      listingFee: number;
      transactionFee: number;
      withdrawalFee: number;
    };
    regulations: {
      maxPrice: number;
      minPrice: number;
      allowedItems: string[];
      restrictedItems: string[];
    };
  };

  // Analytics and Monitoring
  analytics: {
    totalTransactions: number;
    totalVolume: number;
    uniqueHolders: number;
    averageBalance: number;
    velocity: number; // transactions per day
    distribution: {
      giniCoefficient: number;
      top10Percent: number;
      bottom50Percent: number;
    };
  };

  // Seasonal/Event Integration
  seasonal: {
    isSeasonal: boolean;
    season?: string;
    event?: string;
    bonuses: {
      earningMultiplier: number;
      spendingDiscount: number;
      specialRewards: string[];
    };
  };

  // Administrative
  isActive: boolean;
  isDeprecated: boolean;
  deprecationDate?: Date;
  successorCurrency?: mongoose.Types.ObjectId;

  // Metadata
  tags: string[];
  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const VirtualCurrencySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    maxlength: 10,
  },
  type: {
    type: String,
    enum: ['primary', 'secondary', 'premium', 'seasonal', 'event'],
    required: true,
  },

  // Currency Configuration
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  icon: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    trim: true,
  },

  // Economic Properties
  economics: {
    initialSupply: {
      type: Number,
      required: true,
      min: 0,
    },
    maxSupply: {
      type: Number,
      min: 0,
    },
    currentSupply: {
      type: Number,
      default: 0,
      min: 0,
    },
    inflationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    deflationRate: {
      type: Number,
      min: 0,
      max: 100,
    },
    transactionFee: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },

  // Exchange Configuration
  exchange: {
    isExchangeable: {
      type: Boolean,
      default: true,
    },
    exchangeRate: {
      toPrimary: {
        type: Number,
        min: 0,
      },
      toSecondary: {
        type: Number,
        min: 0,
      },
      toPremium: {
        type: Number,
        min: 0,
      },
      toRealCurrency: {
        type: Number,
        min: 0,
      },
    },
    exchangeRestrictions: {
      minAmount: {
        type: Number,
        default: 1,
        min: 0,
      },
      maxAmount: {
        type: Number,
        default: 10000,
        min: 0,
      },
      cooldownHours: {
        type: Number,
        default: 24,
        min: 0,
      },
      dailyLimit: {
        type: Number,
        default: 1000,
        min: 0,
      },
      monthlyLimit: {
        type: Number,
        default: 30000,
        min: 0,
      },
    },
  },

  // Supply Control Mechanisms
  supplyControl: {
    type: {
      type: String,
      enum: ['fixed', 'algorithmic', 'manual', 'burning', 'staking'],
      default: 'fixed',
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    adjustmentSchedule: [{
      date: {
        type: Date,
        required: true,
      },
      adjustment: {
        type: Number,
        required: true,
      },
      reason: {
        type: String,
        required: true,
      },
    }],
  },

  // Reward Optimization (ML-based)
  rewardOptimization: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    modelVersion: {
      type: String,
      default: '1.0.0',
    },
    parameters: {
      type: Schema.Types.Mixed,
      default: {},
    },
    lastOptimized: {
      type: Date,
    },
    optimizationMetrics: {
      userEngagement: {
        type: Number,
        default: 0,
        min: 0,
      },
      retentionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      conversionRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      averageSessionTime: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },

  // Spending Opportunities
  spendingOpportunities: [{
    categories: [{
      type: String,
    }],
    vendors: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
    }],
    restrictions: {
      userLevel: {
        type: Number,
        min: 1,
      },
      achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement',
      }],
      specialConditions: [{
        type: String,
      }],
    },
  }],

  // Marketplace Configuration
  marketplace: {
    isEnabled: {
      type: Boolean,
      default: false,
    },
    categories: [{
      type: String,
    }],
    feeStructure: {
      listingFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      transactionFee: {
        type: Number,
        default: 2.5,
        min: 0,
        max: 100,
      },
      withdrawalFee: {
        type: Number,
        default: 1,
        min: 0,
        max: 100,
      },
    },
    regulations: {
      maxPrice: {
        type: Number,
        default: 1000000,
        min: 0,
      },
      minPrice: {
        type: Number,
        default: 0.01,
        min: 0,
      },
      allowedItems: [{
        type: String,
      }],
      restrictedItems: [{
        type: String,
      }],
    },
  },

  // Analytics and Monitoring
  analytics: {
    totalTransactions: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalVolume: {
      type: Number,
      default: 0,
      min: 0,
    },
    uniqueHolders: {
      type: Number,
      default: 0,
      min: 0,
    },
    averageBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    velocity: {
      type: Number,
      default: 0,
      min: 0,
    },
    distribution: {
      giniCoefficient: {
        type: Number,
        default: 0,
        min: 0,
        max: 1,
      },
      top10Percent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      bottom50Percent: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },

  // Seasonal/Event Integration
  seasonal: {
    isSeasonal: {
      type: Boolean,
      default: false,
    },
    season: {
      type: String,
    },
    event: {
      type: String,
    },
    bonuses: {
      earningMultiplier: {
        type: Number,
        default: 1,
        min: 0.1,
      },
      spendingDiscount: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      specialRewards: [{
        type: String,
      }],
    },
  },

  // Administrative
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeprecated: {
    type: Boolean,
    default: false,
  },
  deprecationDate: {
    type: Date,
  },
  successorCurrency: {
    type: Schema.Types.ObjectId,
    ref: 'VirtualCurrency',
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
  }],
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for performance
VirtualCurrencySchema.index({ type: 1 });
VirtualCurrencySchema.index({ isActive: 1 });
VirtualCurrencySchema.index({ isDeprecated: 1 });
VirtualCurrencySchema.index({ symbol: 1 }, { unique: true });
VirtualCurrencySchema.index({ 'seasonal.season': 1 });
VirtualCurrencySchema.index({ 'analytics.totalVolume': -1 });

export default mongoose.models.VirtualCurrency ||
  mongoose.model<IVirtualCurrency>('VirtualCurrency', VirtualCurrencySchema);