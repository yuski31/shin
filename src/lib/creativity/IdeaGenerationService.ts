import { IIdeaGeneration, ICreativeSession, IInspirationSource } from '@/models/creativity';
import { CreativeSession, IdeaGeneration, InspirationSource } from '@/models/creativity';

export interface IdeaGenerationInput {
  userId: string;
  sessionId: string;
  method: 'cross_domain_inspiration' | 'random_association' | 'constraint_based' | 'divergent_thinking' | 'brainstorming_facilitator';
  prompt: string;
  domain: string;
  constraints?: {
    timeLimit?: number;
    wordLimit?: number;
    theme?: string;
    style?: string;
    targetAudience?: string;
  };
}

export interface IdeaGenerationOutput {
  ideas: Array<{
    content: string;
    creativity: number;
    feasibility: number;
    novelty: number;
    relevance: number;
    timestamp: Date;
  }>;
  totalIdeas: number;
  breakthroughIdeas: number;
  inspirationUsed: Array<{
    source: IInspirationSource;
    relevance: number;
    connectionType: string;
  }>;
  crossDomainConnections: Array<{
    sourceDomain: string;
    targetDomain: string;
    connectionStrength: number;
    insight: string;
  }>;
  metrics: {
    generationTime: number;
    averageIdeaQuality: number;
    diversityScore: number;
    constraintAdherence: number;
  };
}

export class IdeaGenerationService {
  private knowledgeDomains = [
    'art', 'science', 'technology', 'literature', 'music', 'philosophy',
    'psychology', 'history', 'nature', 'mathematics', 'engineering',
    'medicine', 'architecture', 'design', 'business', 'education'
  ];

  private inspirationGraph: Map<string, IInspirationSource[]> = new Map();

  constructor() {
    this.initializeKnowledgeGraph();
  }

  private async initializeKnowledgeGraph() {
    // Initialize knowledge graph with sample inspiration sources
    // In a real implementation, this would load from database
    for (const domain of this.knowledgeDomains) {
      this.inspirationGraph.set(domain, []);
    }
  }

  async generateIdeas(input: IdeaGenerationInput): Promise<IdeaGenerationOutput> {
    const startTime = Date.now();

    // Create idea generation record
    const ideaGenRecord = await IdeaGeneration.create({
      userId: input.userId,
      sessionId: input.sessionId,
      timestamp: new Date(),
      method: input.method,
      prompt: input.prompt,
      domain: input.domain,
      constraints: input.constraints || {},
      inspiration: { sources: [], crossDomainConnections: [] },
      output: { ideas: [], totalIdeas: 0, breakthroughIdeas: 0 },
      metrics: { generationTime: 0, averageIdeaQuality: 0, diversityScore: 0, constraintAdherence: 0 },
      userFeedback: {},
    });

    try {
      let ideas: IdeaGenerationOutput['ideas'] = [];
      let inspirationUsed: IdeaGenerationOutput['inspirationUsed'] = [];
      let crossDomainConnections: IdeaGenerationOutput['crossDomainConnections'] = [];

      switch (input.method) {
        case 'cross_domain_inspiration':
          const result = await this.crossDomainInspiration(input);
          ideas = result.ideas;
          inspirationUsed = result.inspirationUsed;
          crossDomainConnections = result.crossDomainConnections;
          break;

        case 'random_association':
          ideas = await this.randomAssociation(input);
          break;

        case 'constraint_based':
          ideas = await this.constraintBasedCreativity(input);
          break;

        case 'divergent_thinking':
          ideas = await this.divergentThinking(input);
          break;

        case 'brainstorming_facilitator':
          ideas = await this.brainstormingFacilitator(input);
          break;
      }

      const generationTime = Date.now() - startTime;
      const averageIdeaQuality = ideas.reduce((sum, idea) => sum + idea.creativity, 0) / ideas.length || 0;
      const diversityScore = this.calculateDiversityScore(ideas);
      const constraintAdherence = this.evaluateConstraintAdherence(ideas, input.constraints);

      // Update the record with results
      await IdeaGeneration.findByIdAndUpdate(ideaGenRecord._id, {
        'inspiration.sources': inspirationUsed.map(i => ({
          domain: i.source.domain,
          concept: i.source.name,
          relevance: i.relevance,
        })),
        'inspiration.crossDomainConnections': crossDomainConnections,
        'output.ideas': ideas,
        'output.totalIdeas': ideas.length,
        'output.breakthroughIdeas': ideas.filter(i => i.creativity >= 8).length,
        'metrics.generationTime': generationTime,
        'metrics.averageIdeaQuality': averageIdeaQuality,
        'metrics.diversityScore': diversityScore,
        'metrics.constraintAdherence': constraintAdherence,
      });

      return {
        ideas,
        totalIdeas: ideas.length,
        breakthroughIdeas: ideas.filter(i => i.creativity >= 8).length,
        inspirationUsed,
        crossDomainConnections,
        metrics: {
          generationTime,
          averageIdeaQuality,
          diversityScore,
          constraintAdherence,
        },
      };
    } catch (error) {
      console.error('Error generating ideas:', error);
      throw error;
    }
  }

  private async crossDomainInspiration(input: IdeaGenerationInput): Promise<{
    ideas: IdeaGenerationOutput['ideas'];
    inspirationUsed: IdeaGenerationOutput['inspirationUsed'];
    crossDomainConnections: IdeaGenerationOutput['crossDomainConnections'];
  }> {
    // Find inspiration sources from different domains
    const inspirationSources = await this.findCrossDomainInspiration(input.domain, input.prompt);

    // Generate connections between domains
    const crossDomainConnections = this.generateCrossDomainConnections(
      input.domain,
      inspirationSources.map(i => i.domain)
    );

    // Generate ideas based on cross-domain inspiration
    const ideas = await this.generateCrossDomainIdeas(input.prompt, inspirationSources, crossDomainConnections);

    return {
      ideas,
      inspirationUsed: inspirationSources.map(source => ({
        source,
        relevance: Math.floor(Math.random() * 4) + 7, // 7-10 scale
        connectionType: 'cross_domain_transfer',
      })),
      crossDomainConnections,
    };
  }

  private async findCrossDomainInspiration(targetDomain: string, prompt: string): Promise<IInspirationSource[]> {
    // In a real implementation, this would search the database for relevant inspiration sources
    // For now, return mock inspiration sources from different domains
    const mockSources: IInspirationSource[] = [
      {
        _id: '507f1f77bcf86cd799439011' as any,
        userId: '507f1f77bcf86cd799439011' as any,
        name: 'Fractal Patterns in Nature',
        domain: 'nature',
        sourceType: 'concept',
        tags: ['fractals', 'patterns', 'nature'],
        metadata: {},
        content: {
          keyConcepts: ['self-similarity', 'recursive patterns', 'natural algorithms'],
          themes: ['beauty', 'complexity', 'emergence'],
          complexity: 7,
        },
        connections: {
          relatedDomains: ['mathematics', 'art', 'design'],
          crossReferences: [],
        },
        usage: {
          timesReferenced: 0,
          lastUsed: new Date(),
          mostSuccessfulContext: null,
          averageImpact: 5,
        },
        rating: {
          userRating: 8,
          systemRating: 7,
          communityRating: null,
        },
        accessibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439012' as any,
        userId: '507f1f77bcf86cd799439011' as any,
        name: 'Quantum Entanglement',
        domain: 'physics',
        sourceType: 'concept',
        tags: ['quantum', 'physics', 'entanglement'],
        metadata: {},
        content: {
          keyConcepts: ['non-locality', 'instantaneous connection', 'quantum correlation'],
          themes: ['connection', 'interdependence', 'hidden relationships'],
          complexity: 9,
        },
        connections: {
          relatedDomains: ['philosophy', 'technology', 'communication'],
          crossReferences: [],
        },
        usage: {
          timesReferenced: 0,
          lastUsed: new Date(),
          mostSuccessfulContext: null,
          averageImpact: 5,
        },
        rating: {
          userRating: 9,
          systemRating: 8,
          communityRating: null,
        },
        accessibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        _id: '507f1f77bcf86cd799439013' as any,
        userId: '507f1f77bcf86cd799439011' as any,
        name: 'Jazz Improvisation',
        domain: 'music',
        sourceType: 'artwork',
        tags: ['jazz', 'improvisation', 'music'],
        metadata: {},
        content: {
          keyConcepts: ['spontaneous creation', 'rule-breaking', 'emotional expression'],
          themes: ['freedom', 'risk-taking', 'authenticity'],
          complexity: 6,
        },
        connections: {
          relatedDomains: ['art', 'psychology', 'performance'],
          crossReferences: [],
        },
        usage: {
          timesReferenced: 0,
          lastUsed: new Date(),
          mostSuccessfulContext: undefined,
          averageImpact: 5,
        },
        rating: {
          userRating: 8,
          systemRating: 7,
          communityRating: undefined,
        },
        accessibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    return mockSources;
  }

  private generateCrossDomainConnections(sourceDomain: string, targetDomains: string[]): IdeaGenerationOutput['crossDomainConnections'] {
    const connections: IdeaGenerationOutput['crossDomainConnections'] = [];

    targetDomains.forEach(targetDomain => {
      if (sourceDomain !== targetDomain) {
        connections.push({
          sourceDomain,
          targetDomain,
          connectionStrength: Math.floor(Math.random() * 4) + 7, // 7-10 scale
          insight: this.generateConnectionInsight(sourceDomain, targetDomain),
        });
      }
    });

    return connections;
  }

  private generateConnectionInsight(sourceDomain: string, targetDomain: string): string {
    const insights = [
      `Apply ${sourceDomain} principles to ${targetDomain} contexts`,
      `Use ${sourceDomain} structures as metaphors for ${targetDomain} challenges`,
      `Adapt ${sourceDomain} patterns to solve ${targetDomain} problems`,
      `Combine ${sourceDomain} aesthetics with ${targetDomain} functionality`,
      `Translate ${sourceDomain} concepts into ${targetDomain} applications`,
    ];

    return insights[Math.floor(Math.random() * insights.length)];
  }

  private async generateCrossDomainIdeas(prompt: string, inspirations: IInspirationSource[], connections: IdeaGenerationOutput['crossDomainConnections']): Promise<IdeaGenerationOutput['ideas']> {
    const ideas: IdeaGenerationOutput['ideas'] = [];

    // Generate ideas based on cross-domain connections
    connections.forEach((connection, index) => {
      const inspiration = inspirations[index % inspirations.length];
      const idea = this.createIdeaFromConnection(prompt, connection, inspiration);
      ideas.push(idea);
    });

    return ideas;
  }

  private createIdeaFromConnection(prompt: string, connection: IdeaGenerationOutput['crossDomainConnections'][0], inspiration: IInspirationSource): IdeaGenerationOutput['ideas'][0] {
    return {
      content: `Apply ${connection.insight} using principles from ${inspiration.name}`,
      creativity: Math.floor(Math.random() * 3) + 8, // 8-10 scale for cross-domain ideas
      feasibility: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      novelty: Math.floor(Math.random() * 3) + 8, // 8-10 scale
      relevance: Math.floor(Math.random() * 3) + 7, // 7-9 scale
      timestamp: new Date(),
    };
  }

  private async randomAssociation(input: IdeaGenerationInput): Promise<IdeaGenerationOutput['ideas']> {
    const ideas: IdeaGenerationOutput['ideas'] = [];

    for (let i = 0; i < 10; i++) {
      const randomConcepts = this.getRandomConcepts(3);
      const idea = this.combineRandomConcepts(randomConcepts, input.prompt);
      ideas.push(idea);
    }

    return ideas;
  }

  private getRandomConcepts(count: number): string[] {
    const concepts = [
      'water', 'fire', 'air', 'earth', 'time', 'space', 'light', 'shadow',
      'growth', 'decay', 'connection', 'isolation', 'chaos', 'order',
      'simplicity', 'complexity', 'movement', 'stillness', 'sound', 'silence'
    ];

    const shuffled = [...concepts].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private combineRandomConcepts(concepts: string[], prompt: string): IdeaGenerationOutput['ideas'][0] {
    const combination = concepts.join(' + ');
    return {
      content: `${prompt} through the lens of ${combination}`,
      creativity: Math.floor(Math.random() * 4) + 7, // 7-10 scale
      feasibility: Math.floor(Math.random() * 3) + 5, // 5-7 scale
      novelty: Math.floor(Math.random() * 4) + 7, // 7-10 scale
      relevance: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      timestamp: new Date(),
    };
  }

  private async constraintBasedCreativity(input: IdeaGenerationInput): Promise<IdeaGenerationOutput['ideas']> {
    const ideas: IdeaGenerationOutput['ideas'] = [];

    // Generate ideas within constraints
    const constraintPrompts = this.generateConstraintPrompts(input.constraints);

    for (const constraintPrompt of constraintPrompts) {
      const idea = this.generateConstrainedIdea(constraintPrompt, input.prompt);
      ideas.push(idea);
    }

    return ideas;
  }

  private generateConstraintPrompts(constraints?: IdeaGenerationInput['constraints']): string[] {
    const prompts = [
      'What if time was limited to 5 minutes?',
      'What if you could only use 10 words?',
      'What if this had to appeal to children?',
      'What if this needed to be universally understood?',
      'What if resources were extremely limited?',
    ];

    return prompts.slice(0, 5);
  }

  private generateConstrainedIdea(constraintPrompt: string, originalPrompt: string): IdeaGenerationOutput['ideas'][0] {
    return {
      content: `${originalPrompt} - ${constraintPrompt}`,
      creativity: Math.floor(Math.random() * 3) + 7, // 7-9 scale
      feasibility: Math.floor(Math.random() * 4) + 6, // 6-9 scale
      novelty: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      relevance: Math.floor(Math.random() * 3) + 8, // 8-10 scale
      timestamp: new Date(),
    };
  }

  private async divergentThinking(input: IdeaGenerationInput): Promise<IdeaGenerationOutput['ideas']> {
    const ideas: IdeaGenerationOutput['ideas'] = [];

    // Generate divergent ideas by exploring different dimensions
    const dimensions = ['function', 'form', 'process', 'context', 'scale', 'perspective'];

    for (const dimension of dimensions) {
      const idea = this.generateDivergentIdea(input.prompt, dimension);
      ideas.push(idea);
    }

    return ideas;
  }

  private generateDivergentIdea(prompt: string, dimension: string): IdeaGenerationOutput['ideas'][0] {
    const transformations = {
      function: 'change the purpose of',
      form: 'alter the physical shape of',
      process: 'modify how we create',
      context: 'place in a different environment',
      scale: 'dramatically increase or decrease the size of',
      perspective: 'view from a completely different angle',
    };

    return {
      content: `${transformations[dimension as keyof typeof transformations]} ${prompt}`,
      creativity: Math.floor(Math.random() * 3) + 7, // 7-9 scale
      feasibility: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      novelty: Math.floor(Math.random() * 3) + 8, // 8-10 scale
      relevance: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      timestamp: new Date(),
    };
  }

  private async brainstormingFacilitator(input: IdeaGenerationInput): Promise<IdeaGenerationOutput['ideas']> {
    const ideas: IdeaGenerationOutput['ideas'] = [];

    // Facilitate brainstorming with guided prompts
    const brainstormingPrompts = this.generateBrainstormingPrompts(input.prompt);

    for (const brainstormPrompt of brainstormingPrompts) {
      const idea = this.generateFacilitatedIdea(brainstormPrompt);
      ideas.push(idea);
    }

    return ideas;
  }

  private generateBrainstormingPrompts(originalPrompt: string): string[] {
    return [
      `How might we ${originalPrompt}?`,
      `What if we eliminated all assumptions about ${originalPrompt}?`,
      `What would happen if we exaggerated ${originalPrompt}?`,
      `How could we combine ${originalPrompt} with something unexpected?`,
      `What opposite approach to ${originalPrompt} might work?`,
    ];
  }

  private generateFacilitatedIdea(prompt: string): IdeaGenerationOutput['ideas'][0] {
    return {
      content: prompt,
      creativity: Math.floor(Math.random() * 3) + 7, // 7-9 scale
      feasibility: Math.floor(Math.random() * 3) + 7, // 7-9 scale
      novelty: Math.floor(Math.random() * 3) + 6, // 6-8 scale
      relevance: Math.floor(Math.random() * 3) + 8, // 8-10 scale
      timestamp: new Date(),
    };
  }

  private calculateDiversityScore(ideas: IdeaGenerationOutput['ideas']): number {
    if (ideas.length < 2) return 0;

    // Simple diversity calculation based on idea length variance
    const lengths = ideas.map(idea => idea.content.length);
    const mean = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;

    return Math.min(variance / 1000, 1); // Normalize to 0-1 scale
  }

  private evaluateConstraintAdherence(ideas: IdeaGenerationOutput['ideas'], constraints?: IdeaGenerationInput['constraints']): number {
    if (!constraints) return 1;

    let adherenceScore = 1;

    ideas.forEach(idea => {
      // Simple constraint checking
      if (constraints.timeLimit && idea.content.length > constraints.timeLimit * 10) {
        adherenceScore -= 0.1;
      }
      if (constraints.wordLimit && idea.content.split(' ').length > constraints.wordLimit) {
        adherenceScore -= 0.1;
      }
    });

    return Math.max(adherenceScore, 0);
  }
}

export default new IdeaGenerationService();