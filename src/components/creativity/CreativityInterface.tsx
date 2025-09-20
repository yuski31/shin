'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface Idea {
  content: string;
  creativity: number;
  feasibility: number;
  novelty: number;
  relevance: number;
  timestamp: Date;
}

interface GenerationResult {
  ideas: Idea[];
  totalIdeas: number;
  breakthroughIdeas: number;
  inspirationUsed: Array<{
    source: any;
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

interface CreativitySession {
  _id: string;
  title: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  metrics: {
    ideasGenerated: number;
    breakthroughsAchieved: number;
    creativityScore: number;
  };
}

export default function CreativityInterface() {
  const [session, setSession] = useState<CreativitySession | null>(null);
  const [prompt, setPrompt] = useState('');
  const [domain, setDomain] = useState('art');
  const [method, setMethod] = useState<'cross_domain_inspiration' | 'random_association' | 'constraint_based' | 'divergent_thinking' | 'brainstorming_facilitator'>('cross_domain_inspiration');
  const [constraints, setConstraints] = useState({
    timeLimit: 10,
    wordLimit: 50,
    theme: '',
    style: '',
    targetAudience: '',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  const domains = [
    { value: 'art', label: '🎨 Art & Design' },
    { value: 'science', label: '🔬 Science' },
    { value: 'technology', label: '💻 Technology' },
    { value: 'literature', label: '📚 Literature' },
    { value: 'music', label: '🎵 Music' },
    { value: 'business', label: '💼 Business' },
    { value: 'education', label: '🎓 Education' },
    { value: 'philosophy', label: '🤔 Philosophy' },
  ];

  const methods = [
    { value: 'cross_domain_inspiration', label: '🌟 Cross-Domain Inspiration' },
    { value: 'random_association', label: '🎲 Random Association' },
    { value: 'constraint_based', label: '⚡ Constraint-Based Creativity' },
    { value: 'divergent_thinking', label: '🔀 Divergent Thinking' },
    { value: 'brainstorming_facilitator', label: '💡 Brainstorming Facilitator' },
  ];

  const createSession = async () => {
    try {
      const response = await fetch('/api/creativity/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType: 'idea_generation',
          goals: [`Generate creative ideas for: ${prompt}`],
          constraints: constraints,
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSession(newSession);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const generateIdeas = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/creativity/idea-generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          prompt: prompt.trim(),
          domain,
          constraints,
          sessionId: session?._id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.data.result);
        if (data.data.sessionId) {
          setSession(prev => prev ? { ...prev, _id: data.data.sessionId } : null);
        }
        loadHistory();
      }
    } catch (error) {
      console.error('Error generating ideas:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const loadHistory = async () => {
    if (!session?._id) return;

    try {
      const response = await fetch(`/api/creativity/idea-generation?sessionId=${session._id}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.data.ideaGenerations);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const getCreativityColor = (score: number) => {
    if (score >= 8) return 'bg-purple-500';
    if (score >= 6) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getFeasibilityColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          🚀 Creativity Explosion Framework
        </h1>
        <p className="text-lg text-gray-600">
          Unleash your creative potential with AI-powered idea generation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>🎯 Idea Generation Setup</CardTitle>
              <CardDescription>
                Configure your creative session parameters
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Creative Prompt
                </label>
                <Textarea
                  placeholder="What would you like to create ideas for?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Domain
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {domains.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Generation Method
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full p-2 border rounded-md"
                >
                  {methods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Constraints</h4>

                <div>
                  <label className="block text-sm mb-1">
                    Time Limit: {constraints.timeLimit} minutes
                  </label>
                  <Slider
                    value={[constraints.timeLimit]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, timeLimit: value }))}
                    max={60}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-1">
                    Word Limit: {constraints.wordLimit}
                  </label>
                  <Slider
                    value={[constraints.wordLimit]}
                    onValueChange={([value]) => setConstraints(prev => ({ ...prev, wordLimit: value }))}
                    max={200}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <Input
                    placeholder="Theme (optional)"
                    value={constraints.theme}
                    onChange={(e) => setConstraints(prev => ({ ...prev, theme: e.target.value }))}
                  />
                </div>

                <div>
                  <Input
                    placeholder="Style (optional)"
                    value={constraints.style}
                    onChange={(e) => setConstraints(prev => ({ ...prev, style: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={generateIdeas}
                disabled={!prompt.trim() || isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating Ideas...
                  </>
                ) : (
                  '🚀 Generate Ideas'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="results">📝 Generated Ideas</TabsTrigger>
              <TabsTrigger value="history">📚 History</TabsTrigger>
            </TabsList>

            <TabsContent value="results" className="space-y-4">
              {result ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {result.totalIdeas}
                        </div>
                        <div className="text-sm text-gray-600">Total Ideas</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {result.breakthroughIdeas}
                        </div>
                        <div className="text-sm text-gray-600">Breakthroughs</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(result.metrics.averageIdeaQuality * 10) / 10}
                        </div>
                        <div className="text-sm text-gray-600">Avg Quality</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {Math.round(result.metrics.diversityScore * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Diversity</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold">Generated Ideas</h3>
                    {result.ideas.map((idea, index) => (
                      <Card key={index} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="outline">Idea #{index + 1}</Badge>
                            <div className="flex space-x-2">
                              <Badge className={getCreativityColor(idea.creativity)}>
                                🎨 {idea.creativity}/10
                              </Badge>
                              <Badge className={getFeasibilityColor(idea.feasibility)}>
                                ⚙️ {idea.feasibility}/10
                              </Badge>
                            </div>
                          </div>
                          <p className="text-gray-800 mb-3">{idea.content}</p>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Novelty: {idea.novelty}/10</span>
                            <span>Relevance: {idea.relevance}/10</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {result.crossDomainConnections.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold">🔗 Cross-Domain Connections</h3>
                      {result.crossDomainConnections.map((connection, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium">{connection.sourceDomain}</span>
                                <span className="mx-2">→</span>
                                <span className="font-medium">{connection.targetDomain}</span>
                              </div>
                              <Badge variant="secondary">
                                Strength: {connection.connectionStrength}/10
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-2">{connection.insight}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">💡</div>
                    <h3 className="text-lg font-semibold mb-2">Ready to Generate Ideas</h3>
                    <p>Enter a creative prompt and click "Generate Ideas" to get started!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {history.length > 0 ? (
                history.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{item.prompt}</h4>
                          <p className="text-sm text-gray-600">
                            {item.method} • {item.domain} • {item.output.totalIdeas} ideas
                          </p>
                        </div>
                        <Badge variant="outline">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
                    <p>Generate some ideas to see your creative history here!</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}