import { BasePersonalizationService, AnalysisResult } from './BasePersonalizationService';
import {
  ContentItem,
  UserItemInteraction,
  Recommendation,
  UserSimilarity,
  ItemEmbedding
} from '@/models/personalization';

export interface RecommendationRequest {
  userId: string;
  type: 'content' | 'feature' | 'workflow' | 'social' | 'learning_path';
  context?: {
    currentTime?: Date;
    userState?: 'focused' | 'exploring' | 'learning' | 'casual';
    recentInteractions?: string[];
    constraints?: Record<string, any>;
  };
  filters?: {
    contentTypes?: string[];
    topics?: string[];
    difficulty?: string[];
    maxItems?: number;
    diversity?: number; // 0-1, higher = more diverse
  };
  algorithms?: {
    collaborative?: boolean;
    contentBased?: boolean;
    hybrid?: boolean;
    exploration?: boolean;
  };
}

export interface RecommendationResult {
  items: Array<{
    id: string;
    type: string;
    score: number;
    confidence: number;
    reason: string;
    metadata: Record<string, any>;
    algorithm: string;
  }>;
  metadata: {
    totalCandidates: number;
    filteredCandidates: number;
    algorithmsUsed: string[];
    processingTime: number;
    diversityScore: number;
  };
}

export interface MatrixFactorizationModel {
  userFactors: Map<string, number[]>;
  itemFactors: Map<string, number[]>;
  globalBias: number;
  userBiases: Map<string, number>;
  itemBiases: Map<string, number>;
  learningRate: number;
  regularization: number;
  factors: number;
  iterations: number;
  lastUpdated: Date;
}

export class RecommendationEngine extends BasePersonalizationService {
  private readonly DEFAULT_FACTORS = 50;
  private readonly DEFAULT_LEARNING_RATE = 0.01;
  private readonly DEFAULT_REGULARIZATION = 0.02;
  private readonly DEFAULT_ITERATIONS = 100;
  private readonly EXPLORATION_WEIGHT = 0.3;
  private readonly CONTENT_SIMILARITY_THRESHOLD = 0.7;

  // In-memory model storage (in production, use Redis or similar)
  private mfModel: MatrixFactorizationModel | null = null;
  private itemEmbeddings: Map<string, number[]> = new Map();
  private userProfiles: Map<string, any> = new Map();

  async analyzeBehavior(userId: string, behaviors: any[]): Promise<AnalysisResult> {
    // This would be implemented by the main personalization service
    return {
      score: 75,
      confidence: 0.8,
      insights: ['Recommendation analysis completed'],
      recommendations: ['Continue using recommendation features'],
      metadata: {
        analysisType: 'recommendations',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async updatePreferences(userId: string, interactions: any[]): Promise<any> {
    // Update user profile for recommendations
    const profile = await this.buildUserProfile(userId, interactions);
    this.userProfiles.set(userId, profile);
    return profile;
  }

  async analyzePsychographics(userId: string, data: any): Promise<AnalysisResult> {
    return {
      score: 75,
      confidence: 0.6,
      insights: ['Psychographic analysis for recommendations'],
      recommendations: ['Use psychographic data for better recommendations'],
      metadata: {
        analysisType: 'psychographics',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async updateContext(userId: string, contextData: any): Promise<any> {
    return contextData;
  }

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = Date.now();

    try {
      // Validate request
      if (!this.validateUserId(request.userId)) {
        throw new Error('Invalid user ID');
      }

      // Get user profile and interactions
      const [userInteractions, userProfile] = await Promise.all([
        UserItemInteraction.find({ userId: request.userId })
          .sort({ timestamp: -1 })
          .limit(1000),
        this.getUserProfile(request.userId),
      ]);

      // Initialize model if needed
      await this.initializeModel();

      // Generate recommendations using different algorithms
      const candidates: Array<{
        itemId: string;
        score: number;
        confidence: number;
        algorithm: string;
        reason: string;
        metadata: any;
      }> = [];

      // Collaborative filtering recommendations
      if (request.algorithms?.collaborative !== false) {
        const cfRecommendations = await this.getCollaborativeFilteringRecommendations(
          request.userId,
          userInteractions,
          request
        );
        candidates.push(...cfRecommendations);
      }

      // Content-based recommendations
      if (request.algorithms?.contentBased !== false) {
        const cbRecommendations = await this.getContentBasedRecommendations(
          request.userId,
          userInteractions,
          request
        );
        candidates.push(...cbRecommendations);
      }

      // Hybrid recommendations
      if (request.algorithms?.hybrid !== false) {
        const hybridRecommendations = await this.getHybridRecommendations(
          request.userId,
          userInteractions,
          request
        );
        candidates.push(...hybridRecommendations);
      }

      // Exploration recommendations
      if (request.algorithms?.exploration !== false) {
        const explorationRecommendations = await this.getExplorationRecommendations(
          request.userId,
          userInteractions,
          request
        );
        candidates.push(...explorationRecommendations);
      }

      // Remove duplicates and apply filters
      const filteredCandidates = await this.applyFiltersAndDeduplication(
        candidates,
        request,
        userInteractions
      );

      // Apply diversity if requested
      const finalCandidates = request.filters?.diversity
        ? await this.applyDiversity(filteredCandidates, request.filters.diversity)
        : filteredCandidates;

      // Sort by score and limit results
      const topCandidates = finalCandidates
        .sort((a, b) => b.score - a.score)
        .slice(0, request.filters?.maxItems || 20);

      const processingTime = Date.now() - startTime;

      return {
        items: topCandidates,
        metadata: {
          totalCandidates: candidates.length,
          filteredCandidates: filteredCandidates.length,
          algorithmsUsed: this.getAlgorithmsUsed(request.algorithms),
          processingTime,
          diversityScore: this.calculateDiversityScore(topCandidates),
        },
      };
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  private async initializeModel(): Promise<void> {
    if (this.mfModel) return;

    try {
      // Initialize matrix factorization model
      this.mfModel = {
        userFactors: new Map(),
        itemFactors: new Map(),
        globalBias: 0,
        userBiases: new Map(),
        itemBiases: new Map(),
        learningRate: this.DEFAULT_LEARNING_RATE,
        regularization: this.DEFAULT_REGULARIZATION,
        factors: this.DEFAULT_FACTORS,
        iterations: this.DEFAULT_ITERATIONS,
        lastUpdated: new Date(),
      };

      // Load item embeddings
      const embeddings = await ItemEmbedding.find({});
      for (const embedding of embeddings) {
        this.itemEmbeddings.set(embedding.itemId, embedding.embedding);
      }

      console.log(`Initialized recommendation model with ${embeddings.length} item embeddings`);
    } catch (error) {
      console.error('Error initializing recommendation model:', error);
      throw error;
    }
  }

  private async getCollaborativeFilteringRecommendations(
    userId: string,
    userInteractions: any[],
    request: RecommendationRequest
  ): Promise<any[]> {
    const recommendations = [];

    try {
      // Find similar users
      const similarUsers = await UserSimilarity.find({
        $or: [
          { userId1: userId },
          { userId2: userId }
        ],
        similarityScore: { $gte: 0.3 }
      }).limit(50);

      // Get items liked by similar users
      const similarUserIds = similarUsers.map(s =>
        s.userId1 === userId ? s.userId2 : s.userId1
      );

      const recommendedInteractions = await UserItemInteraction.find({
        userId: { $in: similarUserIds },
        itemId: { $nin: userInteractions.map(i => i.itemId) },
        interactionType: { $in: ['complete', 'bookmark', 'rate'] },
        weight: { $gte: 7 } // High-quality interactions only
      }).limit(100);

      // Group by item and calculate scores
      const itemScores = new Map<string, { totalScore: number; count: number; reasons: string[] }>();

      for (const interaction of recommendedInteractions) {
        const similarity = similarUsers.find(s =>
          (s.userId1 === interaction.userId || s.userId2 === interaction.userId) &&
          (s.userId1 === userId || s.userId2 === userId)
        );

        if (similarity) {
          const score = interaction.weight * similarity.similarityScore;

          if (itemScores.has(interaction.itemId)) {
            const existing = itemScores.get(interaction.itemId)!;
            existing.totalScore += score;
            existing.count += 1;
            existing.reasons.push(`Similar user interaction (similarity: ${(similarity.similarityScore * 100).toFixed(1)}%)`);
          } else {
            itemScores.set(interaction.itemId, {
              totalScore: score,
              count: 1,
              reasons: [`Similar user interaction (similarity: ${(similarity.similarityScore * 100).toFixed(1)}%)`],
            });
          }
        }
      }

      // Convert to recommendation format
      for (const [itemId, data] of itemScores.entries()) {
        const avgScore = data.totalScore / data.count;
        const confidence = Math.min(1, data.count / 10); // Normalize confidence

        recommendations.push({
          itemId,
          score: avgScore,
          confidence,
          algorithm: 'collaborative_filtering',
          reason: data.reasons[0],
          metadata: {
            similarUsers: data.count,
            avgSimilarity: data.reasons.length > 0 ? 0.5 : 0, // Simplified
          },
        });
      }

    } catch (error) {
      console.error('Error in collaborative filtering:', error);
    }

    return recommendations;
  }

  private async getContentBasedRecommendations(
    userId: string,
    userInteractions: any[],
    request: RecommendationRequest
  ): Promise<any[]> {
    const recommendations = [];

    try {
      // Get user's liked items
      const likedItems = userInteractions.filter(i =>
        ['complete', 'bookmark', 'rate'].includes(i.interactionType) &&
        i.weight >= 7
      );

      if (likedItems.length === 0) return recommendations;

      // Get embeddings for liked items
      const likedItemIds = likedItems.map(i => i.itemId);
      const likedEmbeddings = await ItemEmbedding.find({
        itemId: { $in: likedItemIds }
      });

      if (likedEmbeddings.length === 0) return recommendations;

      // Calculate average user profile vector
      const userProfileVector = this.calculateAverageVector(
        likedEmbeddings.map(e => e.embedding)
      );

      // Find similar items
      const allEmbeddings = await ItemEmbedding.find({
        itemId: { $nin: likedItemIds }
      }).limit(200);

      for (const embedding of allEmbeddings) {
        const similarity = this.calculateCosineSimilarity(
          userProfileVector,
          embedding.embedding
        );

        if (similarity >= this.CONTENT_SIMILARITY_THRESHOLD) {
          recommendations.push({
            itemId: embedding.itemId,
            score: similarity,
            confidence: similarity,
            algorithm: 'content_based',
            reason: `Content similarity: ${(similarity * 100).toFixed(1)}%`,
            metadata: {
              similarity,
              itemType: embedding.itemType,
            },
          });
        }
      }

    } catch (error) {
      console.error('Error in content-based filtering:', error);
    }

    return recommendations;
  }

  private async getHybridRecommendations(
    userId: string,
    userInteractions: any[],
    request: RecommendationRequest
  ): Promise<any[]> {
    const recommendations = [];

    try {
      // Get both collaborative and content-based recommendations
      const [cfRecs, cbRecs] = await Promise.all([
        this.getCollaborativeFilteringRecommendations(userId, userInteractions, request),
        this.getContentBasedRecommendations(userId, userInteractions, request),
      ]);

      // Combine scores using weighted average
      const combinedScores = new Map<string, {
        cfScore: number;
        cbScore: number;
        finalScore: number;
        reasons: string[];
      }>();

      // Process collaborative filtering recommendations
      for (const rec of cfRecs) {
        if (combinedScores.has(rec.itemId)) {
          const existing = combinedScores.get(rec.itemId)!;
          existing.cfScore = rec.score;
          existing.finalScore = (existing.cfScore * 0.6 + existing.cbScore * 0.4);
          existing.reasons.push(`Collaborative: ${rec.reason}`);
        } else {
          combinedScores.set(rec.itemId, {
            cfScore: rec.score,
            cbScore: 0,
            finalScore: rec.score * 0.6, // Weight towards collaborative
            reasons: [`Collaborative: ${rec.reason}`],
          });
        }
      }

      // Process content-based recommendations
      for (const rec of cbRecs) {
        if (combinedScores.has(rec.itemId)) {
          const existing = combinedScores.get(rec.itemId)!;
          existing.cbScore = rec.score;
          existing.finalScore = (existing.cfScore * 0.6 + existing.cbScore * 0.4);
          existing.reasons.push(`Content-based: ${rec.reason}`);
        } else {
          combinedScores.set(rec.itemId, {
            cfScore: 0,
            cbScore: rec.score,
            finalScore: rec.score * 0.4, // Weight towards collaborative
            reasons: [`Content-based: ${rec.reason}`],
          });
        }
      }

      // Convert to recommendation format
      for (const [itemId, data] of combinedScores.entries()) {
        recommendations.push({
          itemId,
          score: data.finalScore,
          confidence: Math.min(1, (data.cfScore + data.cbScore) / 2),
          algorithm: 'hybrid',
          reason: data.reasons.join('; '),
          metadata: {
            cfScore: data.cfScore,
            cbScore: data.cbScore,
            hybridScore: data.finalScore,
          },
        });
      }

    } catch (error) {
      console.error('Error in hybrid recommendations:', error);
    }

    return recommendations;
  }

  private async getExplorationRecommendations(
    userId: string,
    userInteractions: any[],
    request: RecommendationRequest
  ): Promise<any[]> {
    const recommendations = [];

    try {
      // Get user's content preferences
      const userProfile = this.userProfiles.get(userId);
      if (!userProfile) return recommendations;

      // Find items that are different from user's usual preferences
      const usualTypes = new Set(userInteractions.map(i => i.itemType));
      const usualTopics = new Set();

      for (const interaction of userInteractions) {
        if (interaction.context?.topics) {
          interaction.context.topics.forEach((topic: string) => usualTopics.add(topic));
        }
      }

      // Get diverse content
      const diverseItems = await ContentItem.find({
        $or: [
          { type: { $nin: Array.from(usualTypes) } },
          { topics: { $nin: Array.from(usualTopics) } }
        ]
      }).limit(50);

      for (const item of diverseItems) {
        // Calculate exploration score based on novelty
        const typeNovelty = usualTypes.has(item.type) ? 0.3 : 1.0;
        const topicNovelty = item.topics?.some((topic: string) => !usualTopics.has(topic)) ? 1.0 : 0.3;

        const explorationScore = (typeNovelty + topicNovelty) / 2;
        const finalScore = explorationScore * this.EXPLORATION_WEIGHT;

        recommendations.push({
          itemId: item.id,
          score: finalScore,
          confidence: explorationScore * 0.5, // Lower confidence for exploration
          algorithm: 'exploration',
          reason: `Exploration: ${typeNovelty > 0.5 ? 'New content type' : 'New topics'}`,
          metadata: {
            itemType: item.type,
            topics: item.topics,
            novelty: explorationScore,
          },
        });
      }

    } catch (error) {
      console.error('Error in exploration recommendations:', error);
    }

    return recommendations;
  }

  private async applyFiltersAndDeduplication(
    candidates: any[],
    request: RecommendationRequest,
    userInteractions: any[]
  ): Promise<any[]> {
    const userItemIds = new Set(userInteractions.map(i => i.itemId));
    const recentItemIds = new Set(
      userInteractions
        .slice(0, 20) // Last 20 interactions
        .map(i => i.itemId)
    );

    let filtered = candidates.filter(candidate =>
      !userItemIds.has(candidate.itemId) // Remove already interacted items
    );

    // Apply content type filters
    if (request.filters?.contentTypes && request.filters.contentTypes.length > 0) {
      filtered = filtered.filter(candidate => {
        const item = candidates.find(c => c.itemId === candidate.itemId);
        return request.filters!.contentTypes!.includes(item?.metadata?.itemType || 'unknown');
      });
    }

    // Apply topic filters
    if (request.filters?.topics && request.filters.topics.length > 0) {
      filtered = filtered.filter(candidate => {
        const item = candidates.find(c => c.itemId === candidate.itemId);
        const itemTopics = item?.metadata?.topics || [];
        return request.filters.topics!.some(topic => itemTopics.includes(topic));
      });
    }

    // Apply difficulty filters
    if (request.filters?.difficulty && request.filters.difficulty.length > 0) {
      filtered = filtered.filter(candidate => {
        const item = candidates.find(c => c.itemId === candidate.itemId);
        return request.filters.difficulty!.includes(item?.metadata?.difficulty || 'intermediate');
      });
    }

    // Penalize recently seen items
    filtered = filtered.map(candidate => ({
      ...candidate,
      score: recentItemIds.has(candidate.itemId)
        ? candidate.score * 0.7 // Reduce score for recently seen items
        : candidate.score,
    }));

    return filtered;
  }

  private async applyDiversity(candidates: any[], diversityFactor: number): Promise<any[]> {
    if (candidates.length <= 1 || diversityFactor <= 0) {
      return candidates;
    }

    const diverseCandidates = [];
    const usedTypes = new Set<string>();
    const usedTopics = new Set<string>();

    // Sort by score first
    const sortedCandidates = candidates.sort((a, b) => b.score - a.score);

    for (const candidate of sortedCandidates) {
      const item = candidates.find(c => c.itemId === candidate.itemId);
      const itemType = item?.metadata?.itemType || 'unknown';
      const itemTopics = item?.metadata?.topics || [];

      // Calculate diversity penalty
      let diversityPenalty = 1.0;

      if (usedTypes.has(itemType)) {
        diversityPenalty *= (1 - diversityFactor * 0.3);
      }

      const topicOverlap = itemTopics.filter((topic: string) => usedTopics.has(topic)).length;
      if (topicOverlap > 0) {
        diversityPenalty *= (1 - diversityFactor * 0.2 * topicOverlap);
      }

      // Apply diversity penalty to score
      const adjustedScore = candidate.score * diversityPenalty;

      diverseCandidates.push({
        ...candidate,
        score: adjustedScore,
      });

      // Track used types and topics
      usedTypes.add(itemType);
      itemTopics.forEach((topic: string) => usedTopics.add(topic));
    }

    return diverseCandidates.sort((a, b) => b.score - a.score);
  }

  private calculateAverageVector(vectors: number[][]): number[] {
    if (vectors.length === 0) return [];

    const dimensions = vectors[0].length;
    const average = new Array(dimensions).fill(0);

    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        average[i] += vector[i];
      }
    }

    for (let i = 0; i < dimensions; i++) {
      average[i] /= vectors.length;
    }

    return average;
  }

  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) return 0;

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private async buildUserProfile(userId: string, interactions: any[]): Promise<any> {
    const profile = {
      userId,
      totalInteractions: interactions.length,
      avgWeight: 0,
      preferredTypes: new Map<string, number>(),
      preferredTopics: new Map<string, number>(),
      lastUpdated: new Date(),
    };

    if (interactions.length === 0) return profile;

    // Calculate average weight
    const totalWeight = interactions.reduce((sum, i) => sum + i.weight, 0);
    profile.avgWeight = totalWeight / interactions.length;

    // Calculate type preferences
    const typeCounts: Record<string, number> = {};
    for (const interaction of interactions) {
      const type = interaction.itemType;
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    }

    for (const [type, count] of Object.entries(typeCounts)) {
      profile.preferredTypes.set(type, count / interactions.length);
    }

    return profile;
  }

  private getAlgorithmsUsed(algorithms?: any): string[] {
    const used: string[] = [];

    if (algorithms?.collaborative !== false) used.push('collaborative_filtering');
    if (algorithms?.contentBased !== false) used.push('content_based');
    if (algorithms?.hybrid !== false) used.push('hybrid');
    if (algorithms?.exploration !== false) used.push('exploration');

    return used.length > 0 ? used : ['collaborative_filtering', 'content_based'];
  }

  private calculateDiversityScore(candidates: any[]): number {
    if (candidates.length <= 1) return 0;

    const types = new Set(candidates.map(c => c.metadata?.itemType || 'unknown'));
    const topics = new Set();

    for (const candidate of candidates) {
      if (candidate.metadata?.topics) {
        candidate.metadata.topics.forEach((topic: string) => topics.add(topic));
      }
    }

    // Diversity score based on type and topic variety
    const typeDiversity = types.size / candidates.length;
    const topicDiversity = topics.size / candidates.length;

    return (typeDiversity + topicDiversity) / 2;
  }

  // Matrix factorization training (simplified implementation)
  async trainMatrixFactorization(): Promise<void> {
    try {
      console.log('Starting matrix factorization training...');

      // Get all user-item interactions
      const interactions = await UserItemInteraction.find({
        interactionType: { $in: ['complete', 'rate', 'bookmark'] },
        weight: { $gte: 5 }
      }).limit(10000);

      // Initialize model
      const model: MatrixFactorizationModel = {
        userFactors: new Map(),
        itemFactors: new Map(),
        globalBias: 0,
        userBiases: new Map(),
        itemBiases: new Map(),
        learningRate: this.DEFAULT_LEARNING_RATE,
        regularization: this.DEFAULT_REGULARIZATION,
        factors: this.DEFAULT_FACTORS,
        iterations: this.DEFAULT_ITERATIONS,
        lastUpdated: new Date(),
      };

      // Get unique users and items
      const users = new Set(interactions.map(i => i.userId.toString()));
      const items = new Set(interactions.map(i => i.itemId));

      // Initialize factors randomly
      for (const userId of users) {
        model.userFactors.set(userId, Array.from({ length: this.DEFAULT_FACTORS }, () => Math.random() - 0.5));
        model.userBiases.set(userId, 0);
      }

      for (const itemId of items) {
        model.itemFactors.set(itemId, Array.from({ length: this.DEFAULT_FACTORS }, () => Math.random() - 0.5));
        model.itemBiases.set(itemId, 0);
      }

      // Calculate global bias
      const ratings = interactions.map(i => i.weight);
      model.globalBias = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

      // Train model
      for (let iteration = 0; iteration < this.DEFAULT_ITERATIONS; iteration++) {
        let totalError = 0;

        for (const interaction of interactions) {
          const userId = interaction.userId.toString();
          const itemId = interaction.itemId;
          const rating = interaction.weight;

          const userFactors = model.userFactors.get(userId) || [];
          const itemFactors = model.itemFactors.get(itemId) || [];
          const userBias = model.userBiases.get(userId) || 0;
          const itemBias = model.itemBiases.get(itemId) || 0;

          // Calculate prediction
          let prediction = model.globalBias + userBias + itemBias;
          for (let f = 0; f < this.DEFAULT_FACTORS; f++) {
            prediction += userFactors[f] * itemFactors[f];
          }

          // Calculate error
          const error = rating - prediction;
          totalError += error * error;

          // Update factors
          const learningRate = this.DEFAULT_LEARNING_RATE * (1 - iteration / this.DEFAULT_ITERATIONS);

          // Update biases
          model.userBiases.set(userId, userBias + learningRate * (error - this.DEFAULT_REGULARIZATION * userBias));
          model.itemBiases.set(itemId, itemBias + learningRate * (error - this.DEFAULT_REGULARIZATION * itemBias));

          // Update factors
          for (let f = 0; f < this.DEFAULT_FACTORS; f++) {
            const userUpdate = learningRate * (error * itemFactors[f] - this.DEFAULT_REGULARIZATION * userFactors[f]);
            const itemUpdate = learningRate * (error * userFactors[f] - this.DEFAULT_REGULARIZATION * itemFactors[f]);

            userFactors[f] += userUpdate;
            itemFactors[f] += itemUpdate;
          }
        }

        if (iteration % 10 === 0) {
          console.log(`Iteration ${iteration}, Error: ${totalError.toFixed(4)}`);
        }
      }

      this.mfModel = model;
      console.log('Matrix factorization training completed');

    } catch (error) {
      console.error('Error training matrix factorization:', error);
      throw error;
    }
  }

  async getMatrixFactorizationRecommendations(
    userId: string,
    limit: number = 20
  ): Promise<any[]> {
    if (!this.mfModel) {
      await this.trainMatrixFactorization();
    }

    const recommendations = [];
    const userFactors = this.mfModel?.userFactors.get(userId.toString());

    if (!userFactors) return recommendations;

    // Get all items the user hasn't interacted with
    const userInteractions = await UserItemInteraction.find({ userId });
    const userItemIds = new Set(userInteractions.map(i => i.itemId));

    const allItems = await ItemEmbedding.find({
      itemId: { $nin: Array.from(userItemIds) }
    }).limit(1000);

    for (const item of allItems) {
      const itemFactors = this.mfModel?.itemFactors.get(item.itemId);
      if (!itemFactors) continue;

      // Calculate prediction
      let prediction = this.mfModel!.globalBias;
      const userBias = this.mfModel!.userBiases.get(userId.toString()) || 0;
      const itemBias = this.mfModel!.itemBiases.get(item.itemId) || 0;

      prediction += userBias + itemBias;

      for (let f = 0; f < this.DEFAULT_FACTORS; f++) {
        prediction += userFactors[f] * itemFactors[f];
      }

      recommendations.push({
        itemId: item.itemId,
        score: prediction,
        confidence: 0.8, // High confidence for MF predictions
        algorithm: 'matrix_factorization',
        reason: `Matrix factorization prediction: ${prediction.toFixed(2)}`,
        metadata: {
          prediction,
          itemType: item.itemType,
        },
      });
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}