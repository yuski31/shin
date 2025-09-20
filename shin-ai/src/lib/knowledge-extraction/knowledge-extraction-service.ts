import { BaseKnowledgeExtractionService } from './base-service';
import {
  IKnowledgeDocument,
  IKnowledgeConcept,
  IKnowledgeTopic,
  IKnowledgeInsight,
  KnowledgeDocument,
  KnowledgeConcept,
  KnowledgeTopic,
  KnowledgeInsight
} from '@/models/knowledge';
import { ILearningContent, ILearningCompetency } from '@/models/learning';
import { providerFactory } from '@/lib/providers/provider-factory';
import { ProviderConfig } from '@/lib/providers/base-provider';
import connectDB from '@/lib/mongodb';
import { Types } from 'mongoose';

export class KnowledgeExtractionService extends BaseKnowledgeExtractionService {
  private providerConfig: ProviderConfig;

  constructor(providerConfig: ProviderConfig, config?: Partial<KnowledgeExtractionConfig>) {
    super(config);
    this.providerConfig = providerConfig;
  }

  async processDocument(
    document: Partial<IKnowledgeDocument>,
    organizationId: string,
    userId: string
  ): Promise<DocumentProcessingResult> {
    const startTime = new Date();

    try {
      // Validate document
      if (!this.validateDocument(document)) {
        throw new Error('Invalid document provided');
      }

      // Connect to database
      await connectDB();

      // Create document record
      const documentRecord = await KnowledgeDocument.create({
        ...document,
        organizationId,
        uploadedBy: userId,
        processingStatus: 'processing',
      });

      // Extract concepts
      const concepts = await this.extractConcepts(
        document.content!,
        document.metadata?.tags?.join(' ') || undefined
      );

      // Model topics
      const existingDocuments = await KnowledgeDocument.find({
        organizationId,
        processingStatus: 'completed'
      }).limit(100);

      const topics = await this.modelTopics([
        documentRecord,
        ...existingDocuments
      ]);

      // Generate insights if enabled
      const insights: IKnowledgeInsight[] = [];
      if (this.config.insightGenerationEnabled) {
        const insightResults = await this.generateInsights(
          [documentRecord],
          concepts.map(c => ({ ...c, _id: new Types.ObjectId() } as IKnowledgeConcept)),
          topics.map(t => ({ ...t, _id: new Types.ObjectId() } as IKnowledgeTopic))
        );

        for (const insight of insightResults) {
          const insightRecord = await KnowledgeInsight.create({
            ...insight,
            sourceDocuments: [documentRecord._id],
            organizationId,
          });
          insights.push(insightRecord);
        }
      }

      // Update document with extracted knowledge
      await KnowledgeDocument.findByIdAndUpdate(documentRecord._id, {
        processingStatus: 'completed',
        extractedConcepts: concepts.map(c => new Types.ObjectId()),
        topics: topics.map(t => new Types.ObjectId()),
        insights: insights.map(i => i._id),
      });

      // Calculate metrics
      const { processingTime, metadata } = this.calculateMetrics(
        startTime,
        document.content!.length,
        concepts.length,
        topics.length,
        insights.length
      );

      return {
        document: documentRecord,
        concepts: concepts.map(c => ({ ...c, _id: new Types.ObjectId() } as IKnowledgeConcept)),
        topics: topics.map(t => ({ ...t, _id: new Types.ObjectId() } as IKnowledgeTopic)),
        insights,
        processingTime,
        metadata,
      };

    } catch (error) {
      // Update document status to failed
      if (document._id) {
        await KnowledgeDocument.findByIdAndUpdate(document._id, {
          processingStatus: 'failed',
        });
      }

      throw error;
    }
  }

  async extractConcepts(text: string, domain?: string): Promise<ConceptExtractionResult[]> {
    try {
      const provider = providerFactory.createProvider(this.providerConfig, {
        type: 'openai', // Default to OpenAI for concept extraction
        baseUrl: this.providerConfig.baseUrl,
        apiKey: this.providerConfig.apiKey,
      });

      const prompt = `Extract key concepts from the following text. For each concept, provide:
1. Name of the concept
2. Brief description
3. Confidence score (0-1)
4. Domain/category
5. Related concepts and their relationship type

Text: ${text.substring(0, 8000)} // Limit text length

${domain ? `Focus on domain: ${domain}` : ''}

Return the results as a JSON array of concepts.`;

      const response = await provider.generateText({
        prompt,
        maxTokens: 2000,
        temperature: 0.3,
      });

      // Parse the response to extract concepts
      const concepts = this.parseConceptExtractionResponse(response);

      return concepts.filter(c => c.confidence >= this.config.minConceptConfidence)
                   .slice(0, this.config.maxConceptsPerDocument);

    } catch (error) {
      console.error('Error extracting concepts:', error);
      return [];
    }
  }

  async modelTopics(
    documents: IKnowledgeDocument[],
    domain?: string
  ): Promise<TopicModelingResult[]> {
    try {
      const provider = providerFactory.createProvider(this.providerConfig, {
        type: 'openai',
        baseUrl: this.providerConfig.baseUrl,
        apiKey: this.providerConfig.apiKey,
      });

      const documentsText = documents.map(doc =>
        `Title: ${doc.title}\nContent: ${doc.content.substring(0, 1000)}`
      ).join('\n\n');

      const prompt = `Perform topic modeling on the following documents. Identify main topics and provide:
1. Topic name
2. Brief description
3. Confidence score (0-1)
4. Key words/phrases
5. Related topics

Documents:
${documentsText.substring(0, 6000)}

${domain ? `Focus on domain: ${domain}` : ''}

Return the results as a JSON array of topics.`;

      const response = await provider.generateText({
        prompt,
        maxTokens: 1500,
        temperature: 0.2,
      });

      const topics = this.parseTopicModelingResponse(response);

      return topics.filter(t => t.confidence >= this.config.topicModelingThreshold);

    } catch (error) {
      console.error('Error modeling topics:', error);
      return [];
    }
  }

  async generateInsights(
    documents: IKnowledgeDocument[],
    concepts: IKnowledgeConcept[],
    topics: IKnowledgeTopic[]
  ): Promise<InsightGenerationResult[]> {
    try {
      const provider = providerFactory.createProvider(this.providerConfig, {
        type: 'openai',
        baseUrl: this.providerConfig.baseUrl,
        apiKey: this.providerConfig.apiKey,
      });

      const prompt = `Generate insights from the provided knowledge. Consider:
1. Patterns and trends
2. Anomalies or interesting observations
3. Recommendations based on the content
4. Predictions or future implications

Knowledge Summary:
- Documents: ${documents.length}
- Concepts: ${concepts.map(c => c.name).join(', ')}
- Topics: ${topics.map(t => t.name).join(', ')}

Provide insights as a JSON array with type, title, content, confidence, impact, and tags.`;

      const response = await provider.generateText({
        prompt,
        maxTokens: 2000,
        temperature: 0.4,
      });

      return this.parseInsightGenerationResponse(response);

    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  async identifyExperts(
    domain: string,
    organizationId: string
  ): Promise<ExpertIdentificationResult[]> {
    try {
      await connectDB();

      // Find users who have contributed to documents in this domain
      const experts = await KnowledgeDocument.aggregate([
        {
          $match: {
            organizationId: new Types.ObjectId(organizationId),
            'metadata.tags': { $in: [domain] }
          }
        },
        {
          $group: {
            _id: '$uploadedBy',
            documentCount: { $sum: 1 },
            concepts: { $addToSet: '$extractedConcepts' },
            topics: { $addToSet: '$topics' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        },
        {
          $project: {
            userId: '$_id',
            name: '$user.name',
            expertise: [domain],
            confidence: {
              $divide: ['$documentCount', 10] // Normalize confidence
            },
            documentCount: 1,
            conceptCount: { $size: '$concepts' },
            reputation: {
              $add: ['$documentCount', { $size: '$concepts' }]
            }
          }
        },
        {
          $match: {
            confidence: { $gte: 0.3 }
          }
        },
        {
          $sort: { reputation: -1 }
        },
        {
          $limit: 20
        }
      ]);

      return experts.map((expert: any) => ({
        userId: expert.userId.toString(),
        name: expert.name,
        expertise: expert.expertise,
        confidence: Math.min(expert.confidence, 1),
        documentCount: expert.documentCount,
        conceptCount: expert.conceptCount,
        reputation: expert.reputation,
      }));

    } catch (error) {
      console.error('Error identifying experts:', error);
      return [];
    }
  }

  async analyzeTrends(
    topic: string,
    organizationId: string,
    timeframe?: { start: Date; end: Date }
  ): Promise<TrendAnalysisResult> {
    try {
      await connectDB();

      const matchStage: any = {
        organizationId: new Types.ObjectId(organizationId),
        'topics.name': topic,
        createdAt: {
          $gte: timeframe?.start || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        }
      };

      if (timeframe?.end) {
        matchStage.createdAt.$lte = timeframe.end;
      }

      const trendData = await KnowledgeDocument.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 },
            documents: { $push: '$$ROOT' }
          }
        },
        {
          $sort: { '_id': 1 }
        }
      ]);

      // Calculate trend
      const dataPoints = trendData.map((point: any) => ({
        date: new Date(point._id),
        value: point.count,
        source: 'document_count'
      }));

      const values = dataPoints.map(p => p.value);
      const trend = this.calculateTrend(values);

      return {
        topic,
        trend,
        confidence: 0.7,
        dataPoints,
      };

    } catch (error) {
      console.error('Error analyzing trends:', error);
      return {
        topic,
        trend: 'stable',
        confidence: 0,
        dataPoints: [],
      };
    }
  }

  private parseConceptExtractionResponse(response: string): ConceptExtractionResult[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing concept extraction response:', error);
      return [];
    }
  }

  private parseTopicModelingResponse(response: string): TopicModelingResult[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing topic modeling response:', error);
      return [];
    }
  }

  private parseInsightGenerationResponse(response: string): InsightGenerationResult[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Error parsing insight generation response:', error);
      return [];
    }
  }

  private calculateTrend(values: number[]): 'rising' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = (secondAvg - firstAvg) / firstAvg;

    if (change > 0.1) return 'rising';
    if (change < -0.1) return 'declining';
    return 'stable';
  }
}