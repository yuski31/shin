import mongoose from 'mongoose';
import VirtualCurrency, { IVirtualCurrency } from '../../models/gamification/VirtualCurrency';
import UserGamificationProfile, { IUserGamificationProfile } from '../../models/gamification/UserGamificationProfile';
import { gamificationService } from './GamificationService';

export interface ExchangeRate {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  fee: number;
  minAmount: number;
  maxAmount: number;
}

export interface Transaction {
  id: string;
  userId: mongoose.Types.ObjectId;
  type: 'exchange' | 'purchase' | 'reward' | 'penalty' | 'transfer';
  fromCurrency?: string;
  toCurrency?: string;
  amount: number;
  fee: number;
  timestamp: Date;
  description: string;
  metadata: Record<string, any>;
}

export interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  price: {
    currency: string;
    amount: number;
  };
  sellerId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface InflationAdjustment {
  currencyId: mongoose.Types.ObjectId;
  adjustment: number;
  reason: string;
  timestamp: Date;
  appliedBy: mongoose.Types.ObjectId;
}

export class VirtualCurrencyService {
  private static instance: VirtualCurrencyService;
  private exchangeRates: Map<string, ExchangeRate> = new Map();
  private inflationAdjustments: InflationAdjustment[] = [];

  private constructor() {
    this.initializeExchangeRates();
  }

  public static getInstance(): VirtualCurrencyService {
    if (!VirtualCurrencyService.instance) {
      VirtualCurrencyService.instance = new VirtualCurrencyService();
    }
    return VirtualCurrencyService.instance;
  }

  // Currency Management
  async createCurrency(currencyData: Partial<IVirtualCurrency>): Promise<IVirtualCurrency> {
    try {
      const currency = new VirtualCurrency({
        ...currencyData,
        economics: {
          initialSupply: currencyData.economics?.initialSupply || 1000000,
          maxSupply: currencyData.economics?.maxSupply,
          currentSupply: currencyData.economics?.initialSupply || 1000000,
          inflationRate: currencyData.economics?.inflationRate || 0,
          deflationRate: currencyData.economics?.deflationRate || 0,
          transactionFee: currencyData.economics?.transactionFee || 0,
        },
        exchange: {
          isExchangeable: currencyData.exchange?.isExchangeable !== false,
          exchangeRate: currencyData.exchange?.exchangeRate || {},
          exchangeRestrictions: {
            minAmount: currencyData.exchange?.exchangeRestrictions?.minAmount || 1,
            maxAmount: currencyData.exchange?.exchangeRestrictions?.maxAmount || 10000,
            cooldownHours: currencyData.exchange?.exchangeRestrictions?.cooldownHours || 24,
            dailyLimit: currencyData.exchange?.exchangeRestrictions?.dailyLimit || 1000,
            monthlyLimit: currencyData.exchange?.exchangeRestrictions?.monthlyLimit || 30000,
          },
        },
        supplyControl: {
          type: currencyData.supplyControl?.type || 'fixed',
          parameters: currencyData.supplyControl?.parameters || {},
          adjustmentSchedule: currencyData.supplyControl?.adjustmentSchedule || [],
        },
        rewardOptimization: {
          isEnabled: currencyData.rewardOptimization?.isEnabled || false,
          modelVersion: currencyData.rewardOptimization?.modelVersion || '1.0.0',
          parameters: currencyData.rewardOptimization?.parameters || {},
          lastOptimized: currencyData.rewardOptimization?.lastOptimized,
          optimizationMetrics: {
            userEngagement: currencyData.rewardOptimization?.optimizationMetrics?.userEngagement || 0,
            retentionRate: currencyData.rewardOptimization?.optimizationMetrics?.retentionRate || 0,
            conversionRate: currencyData.rewardOptimization?.optimizationMetrics?.conversionRate || 0,
            averageSessionTime: currencyData.rewardOptimization?.optimizationMetrics?.averageSessionTime || 0,
          },
        },
        marketplace: {
          isEnabled: currencyData.marketplace?.isEnabled || false,
          categories: currencyData.marketplace?.categories || [],
          feeStructure: {
            listingFee: currencyData.marketplace?.feeStructure?.listingFee || 0,
            transactionFee: currencyData.marketplace?.feeStructure?.transactionFee || 2.5,
            withdrawalFee: currencyData.marketplace?.feeStructure?.withdrawalFee || 1,
          },
          regulations: {
            maxPrice: currencyData.marketplace?.regulations?.maxPrice || 1000000,
            minPrice: currencyData.marketplace?.regulations?.minPrice || 0.01,
            allowedItems: currencyData.marketplace?.regulations?.allowedItems || [],
            restrictedItems: currencyData.marketplace?.regulations?.restrictedItems || [],
          },
        },
        analytics: {
          totalTransactions: 0,
          totalVolume: 0,
          uniqueHolders: 0,
          averageBalance: 0,
          velocity: 0,
          distribution: {
            giniCoefficient: 0,
            top10Percent: 0,
            bottom50Percent: 0,
          },
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return await currency.save();
    } catch (error) {
      throw new Error(`Failed to create virtual currency: ${error}`);
    }
  }

  async getCurrency(currencyId: mongoose.Types.ObjectId): Promise<IVirtualCurrency | null> {
    try {
      return await VirtualCurrency.findById(currencyId);
    } catch (error) {
      throw new Error(`Failed to get virtual currency: ${error}`);
    }
  }

  async getAllCurrencies(): Promise<IVirtualCurrency[]> {
    try {
      return await VirtualCurrency.find({ isActive: true });
    } catch (error) {
      throw new Error(`Failed to get virtual currencies: ${error}`);
    }
  }

  // Exchange System
  private initializeExchangeRates(): void {
    // Primary to Secondary (1:10 ratio)
    this.exchangeRates.set('primary_to_secondary', {
      fromCurrency: 'primary',
      toCurrency: 'secondary',
      rate: 10,
      fee: 0.02,
      minAmount: 10,
      maxAmount: 1000,
    });

    // Secondary to Premium (100:1 ratio)
    this.exchangeRates.set('secondary_to_premium', {
      fromCurrency: 'secondary',
      toCurrency: 'premium',
      rate: 0.01,
      fee: 0.05,
      minAmount: 100,
      maxAmount: 10000,
    });

    // Premium to Primary (1:100 ratio)
    this.exchangeRates.set('premium_to_primary', {
      fromCurrency: 'premium',
      toCurrency: 'primary',
      rate: 100,
      fee: 0.01,
      minAmount: 1,
      maxAmount: 100,
    });
  }

  async exchangeCurrency(
    userId: mongoose.Types.ObjectId,
    fromCurrency: string,
    toCurrency: string,
    amount: number
  ): Promise<boolean> {
    try {
      const profile = await gamificationService.getUserProfile(userId);
      if (!profile) {
        return false;
      }

      const exchangeKey = `${fromCurrency}_to_${toCurrency}`;
      const rate = this.exchangeRates.get(exchangeKey);

      if (!rate) {
        return false;
      }

      // Check minimum and maximum amounts
      if (amount < rate.minAmount || amount > rate.maxAmount) {
        return false;
      }

      // Check if user has sufficient balance
      if (profile.virtualCurrency[fromCurrency as keyof typeof profile.virtualCurrency] < amount) {
        return false;
      }

      // Calculate exchange amount and fee
      const exchangeAmount = amount * rate.rate;
      const fee = exchangeAmount * rate.fee;
      const finalAmount = exchangeAmount - fee;

      // Perform exchange
      profile.virtualCurrency[fromCurrency as keyof typeof profile.virtualCurrency] -= amount;
      profile.virtualCurrency[toCurrency as keyof typeof profile.virtualCurrency] += finalAmount;

      // Record transaction
      await this.recordTransaction({
        id: new mongoose.Types.ObjectId().toString(),
        userId,
        type: 'exchange',
        fromCurrency,
        toCurrency,
        amount: finalAmount,
        fee,
        timestamp: new Date(),
        description: `Exchanged ${amount} ${fromCurrency} to ${finalAmount} ${toCurrency}`,
        metadata: { exchangeRate: rate.rate, feeRate: rate.fee },
      });

      await profile.save();
      return true;
    } catch (error) {
      throw new Error(`Failed to exchange currency: ${error}`);
    }
  }

  async getExchangeRate(fromCurrency: string, toCurrency: string): Promise<ExchangeRate | null> {
    const exchangeKey = `${fromCurrency}_to_${toCurrency}`;
    return this.exchangeRates.get(exchangeKey) || null;
  }

  // Inflation Control
  async applyInflationAdjustment(currencyId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        return;
      }

      const adjustment = this.calculateInflationAdjustment(currency);
      if (adjustment === 0) {
        return;
      }

      currency.economics.currentSupply += adjustment;
      currency.analytics.totalVolume += Math.abs(adjustment);

      const inflationAdjustment: InflationAdjustment = {
        currencyId,
        adjustment,
        reason: adjustment > 0 ? 'inflation' : 'deflation',
        timestamp: new Date(),
        appliedBy: new mongoose.Types.ObjectId(), // Would be actual admin user ID
      };

      this.inflationAdjustments.push(inflationAdjustment);
      await currency.save();
    } catch (error) {
      throw new Error(`Failed to apply inflation adjustment: ${error}`);
    }
  }

  private calculateInflationAdjustment(currency: IVirtualCurrency): number {
    const now = new Date();
    const lastAdjustment = this.inflationAdjustments
      .filter(adj => adj.currencyId.toString() === currency._id.toString())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];

    const hoursSinceLastAdjustment = lastAdjustment
      ? (now.getTime() - lastAdjustment.timestamp.getTime()) / (1000 * 60 * 60)
      : 24;

    if (hoursSinceLastAdjustment < 24) {
      return 0; // Don't adjust more than once per day
    }

    const dailyInflationRate = currency.economics.inflationRate / 365;
    const adjustment = currency.economics.currentSupply * dailyInflationRate;

    return Math.round(adjustment);
  }

  // Reward Optimization (ML-based)
  async optimizeRewards(currencyId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        return;
      }

      // This would implement ML-based reward optimization
      // For now, it's a placeholder that updates optimization metrics

      currency.rewardOptimization.lastOptimized = new Date();
      currency.rewardOptimization.optimizationMetrics = {
        userEngagement: Math.random() * 100,
        retentionRate: Math.random() * 100,
        conversionRate: Math.random() * 100,
        averageSessionTime: Math.random() * 300, // 0-5 minutes
      };

      await currency.save();
    } catch (error) {
      throw new Error(`Failed to optimize rewards: ${error}`);
    }
  }

  // Marketplace
  async listItem(
    sellerId: mongoose.Types.ObjectId,
    itemData: Partial<MarketplaceItem>
  ): Promise<MarketplaceItem> {
    try {
      const profile = await gamificationService.getUserProfile(sellerId);
      if (!profile) {
        throw new Error('Seller profile not found');
      }

      const currency = await VirtualCurrency.findOne({ symbol: itemData.price?.currency });
      if (!currency) {
        throw new Error('Invalid currency');
      }

      // Check if marketplace is enabled for this currency
      if (!currency.marketplace.isEnabled) {
        throw new Error('Marketplace not enabled for this currency');
      }

      const item: MarketplaceItem = {
        id: new mongoose.Types.ObjectId().toString(),
        name: itemData.name!,
        description: itemData.description!,
        category: itemData.category!,
        price: itemData.price!,
        sellerId,
        isActive: true,
        createdAt: new Date(),
        metadata: itemData.metadata || {},
      };

      // This would save to a marketplace collection
      // For now, return the item as-is

      return item;
    } catch (error) {
      throw new Error(`Failed to list item: ${error}`);
    }
  }

  async purchaseItem(
    buyerId: mongoose.Types.ObjectId,
    itemId: string,
    currency: string,
    amount: number
  ): Promise<boolean> {
    try {
      const profile = await gamificationService.getUserProfile(buyerId);
      if (!profile) {
        return false;
      }

      // Check if buyer has sufficient balance
      if (profile.virtualCurrency[currency as keyof typeof profile.virtualCurrency] < amount) {
        return false;
      }

      // Deduct amount from buyer
      profile.virtualCurrency[currency as keyof typeof profile.virtualCurrency] -= amount;

      // This would handle the actual item transfer
      // For now, just record the transaction

      await this.recordTransaction({
        id: new mongoose.Types.ObjectId().toString(),
        userId: buyerId,
        type: 'purchase',
        amount,
        fee: 0,
        timestamp: new Date(),
        description: `Purchased item ${itemId}`,
        metadata: { itemId, currency },
      });

      await profile.save();
      return true;
    } catch (error) {
      throw new Error(`Failed to purchase item: ${error}`);
    }
  }

  // Transaction Recording
  private async recordTransaction(transaction: Transaction): Promise<void> {
    try {
      // This would save to a transactions collection
      // For now, just log it
      console.log('Transaction recorded:', transaction);
    } catch (error) {
      console.error('Failed to record transaction:', error);
    }
  }

  // Analytics
  async getCurrencyAnalytics(currencyId: mongoose.Types.ObjectId): Promise<{
    totalTransactions: number;
    totalVolume: number;
    uniqueHolders: number;
    averageBalance: number;
    velocity: number;
    distribution: {
      giniCoefficient: number;
      top10Percent: number;
      bottom50Percent: number;
    };
  }> {
    try {
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        throw new Error('Currency not found');
      }

      return currency.analytics;
    } catch (error) {
      throw new Error(`Failed to get currency analytics: ${error}`);
    }
  }

  // Supply Control
  async adjustSupply(
    currencyId: mongoose.Types.ObjectId,
    adjustment: number,
    reason: string,
    adminId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        return;
      }

      currency.economics.currentSupply += adjustment;

      const supplyAdjustment: InflationAdjustment = {
        currencyId,
        adjustment,
        reason,
        timestamp: new Date(),
        appliedBy: adminId,
      };

      this.inflationAdjustments.push(supplyAdjustment);
      await currency.save();
    } catch (error) {
      throw new Error(`Failed to adjust supply: ${error}`);
    }
  }

  // Batch Operations
  async processDailyInflationAdjustments(): Promise<void> {
    try {
      const currencies = await VirtualCurrency.find({ isActive: true });

      for (const currency of currencies) {
        await this.applyInflationAdjustment(currency._id);
      }
    } catch (error) {
      throw new Error(`Failed to process daily inflation adjustments: ${error}`);
    }
  }

  async generateCurrencyReport(currencyId: mongoose.Types.ObjectId): Promise<{
    currency: IVirtualCurrency;
    recentTransactions: Transaction[];
    inflationHistory: InflationAdjustment[];
    marketAnalysis: any;
  }> {
    try {
      const currency = await VirtualCurrency.findById(currencyId);
      if (!currency) {
        throw new Error('Currency not found');
      }

      const recentInflationAdjustments = this.inflationAdjustments
        .filter(adj => adj.currencyId.toString() === currencyId.toString())
        .slice(-30); // Last 30 adjustments

      return {
        currency,
        recentTransactions: [], // Would be populated from transaction history
        inflationHistory: recentInflationAdjustments,
        marketAnalysis: {
          supplyHealth: this.calculateSupplyHealth(currency),
          exchangeStability: this.calculateExchangeStability(currency),
          userEngagement: currency.rewardOptimization.optimizationMetrics,
        },
      };
    } catch (error) {
      throw new Error(`Failed to generate currency report: ${error}`);
    }
  }

  private calculateSupplyHealth(currency: IVirtualCurrency): 'healthy' | 'inflating' | 'deflating' | 'unstable' {
    const inflationRate = currency.economics.inflationRate;
    const deflationRate = currency.economics.deflationRate || 0;

    if (inflationRate > 0.1) return 'inflating';
    if (deflationRate > 0.1) return 'deflating';
    if (Math.abs(inflationRate - deflationRate) > 0.05) return 'unstable';
    return 'healthy';
  }

  private calculateExchangeStability(currency: IVirtualCurrency): 'stable' | 'volatile' | 'unknown' {
    // This would analyze exchange rate stability over time
    // For now, return 'stable' as placeholder
    return 'stable';
  }
}

// Export singleton instance
export const virtualCurrencyService = VirtualCurrencyService.getInstance();
export default VirtualCurrencyService;