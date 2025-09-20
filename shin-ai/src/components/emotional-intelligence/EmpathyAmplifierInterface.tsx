'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EmpathyEvent {
  id: string;
  type: 'social_interaction' | 'emotional_contagion' | 'cultural_translation' | 'micro_expression';
  timestamp: Date;
  participants: {
    user: string;
    others: string[];
    roles: string[];
  };
  emotionalData: {
    detectedEmotions: {
      emotion: string;
      intensity: number;
      confidence: number;
    }[];
    sentiment: {
      score: number;
      magnitude: number;
      primaryEmotion: string;
    };
  };
  interactionQuality: {
    empathyLevel: number;
    connectionDepth: number;
    mutualUnderstanding: number;
    outcome: 'positive' | 'negative' | 'neutral' | 'mixed';
  };
  culturalContext: {
    primaryCulture: string;
    translationNeeded: boolean;
    translationAccuracy: number;
  };
  contagionPrediction: {
    predicted: boolean;
    confidence: number;
    direction: 'positive' | 'negative' | 'neutral';
    magnitude: number;
    affectedParticipants: string[];
  };
}

interface EmpathyAnalysis {
  empathyLevel: number;
  emotionalIntelligence: number;
  socialAwareness: number;
  culturalSensitivity: number;
  interactionPatterns: {
    dominantStyle: string;
    strengths: string[];
    improvementAreas: string[];
  };
  insights: string[];
  recommendations: {
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    actions: string[];
  }[];
}

export function EmpathyAmplifierInterface() {
  const [empathyEvents, setEmpathyEvents] = useState<EmpathyEvent[]>([]);
  const [analysis, setAnalysis] = useState<EmpathyAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeMode, setActiveMode] = useState<'detection' | 'training' | 'simulation'>('detection');

  useEffect(() => {
    loadEmpathyData();
  }, []);

  const loadEmpathyData = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Generate mock empathy events
      const mockEvents: EmpathyEvent[] = [];
      const now = new Date();

      const eventTypes: EmpathyEvent['type'][] = ['social_interaction', 'emotional_contagion', 'cultural_translation', 'micro_expression'];
      const emotions = ['happiness', 'sadness', 'anger', 'fear', 'surprise', 'joy', 'anxiety'];
      const outcomes: EmpathyEvent['interactionQuality']['outcome'][] = ['positive', 'negative', 'neutral', 'mixed'];

      for (let i = 0; i < 15; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const primaryEmotion = emotions[Math.floor(Math.random() * emotions.length)];
        const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];

        mockEvents.push({
          id: `empathy_event_${i}`,
          type: eventType,
          timestamp: new Date(now.getTime() - i * 60 * 60 * 1000),
          participants: {
            user: 'You',
            others: ['Alice', 'Bob', 'Charlie'][Math.floor(Math.random() * 3)].split(','),
            roles: ['Friend', 'Colleague', 'Family'],
          },
          emotionalData: {
            detectedEmotions: [
              {
                emotion: primaryEmotion,
                intensity: Math.floor(Math.random() * 4) + 3, // 3-6
                confidence: 0.7 + Math.random() * 0.3,
              },
              {
                emotion: emotions[Math.floor(Math.random() * emotions.length)],
                intensity: Math.floor(Math.random() * 3) + 2,
                confidence: 0.5 + Math.random() * 0.4,
              }
            ],
            sentiment: {
              score: (Math.random() - 0.5) * 2, // -1 to 1
              magnitude: Math.random() * 0.8 + 0.2,
              primaryEmotion,
            },
          },
          interactionQuality: {
            empathyLevel: Math.floor(Math.random() * 4) + 4, // 4-7
            connectionDepth: Math.floor(Math.random() * 3) + 5, // 5-7
            mutualUnderstanding: Math.floor(Math.random() * 3) + 4, // 4-6
            outcome,
          },
          culturalContext: {
            primaryCulture: ['Western', 'Eastern', 'Mediterranean', 'Latin'][Math.floor(Math.random() * 4)],
            translationNeeded: Math.random() > 0.7,
            translationAccuracy: Math.random() * 0.4 + 0.6, // 0.6-1.0
          },
          contagionPrediction: {
            predicted: Math.random() > 0.5,
            confidence: Math.random() * 0.4 + 0.6,
            direction: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)] as 'positive' | 'negative' | 'neutral',
            magnitude: Math.floor(Math.random() * 4) + 2, // 2-5
            affectedParticipants: ['Alice', 'Bob'],
          },
        });
      }

      setEmpathyEvents(mockEvents);
      generateAnalysis(mockEvents);
    } catch (error) {
      console.error('Failed to load empathy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalysis = (events: EmpathyEvent[]) => {
    if (events.length === 0) return;

    const avgEmpathy = events.reduce((sum, e) => sum + e.interactionQuality.empathyLevel, 0) / events.length;
    const avgConnection = events.reduce((sum, e) => sum + e.interactionQuality.connectionDepth, 0) / events.length;
    const positiveOutcomes = events.filter(e => e.interactionQuality.outcome === 'positive').length;
    const positiveRate = positiveOutcomes / events.length;

    const analysis: EmpathyAnalysis = {
      empathyLevel: Math.round(avgEmpathy * 10) / 10,
      emotionalIntelligence: Math.round((avgEmpathy + avgConnection) / 2 * 10) / 10,
      socialAwareness: Math.round(positiveRate * 10 * 10) / 10,
      culturalSensitivity: Math.round(events.reduce((sum, e) => sum + e.culturalContext.translationAccuracy, 0) / events.length * 10) / 10,
      interactionPatterns: {
        dominantStyle: positiveRate > 0.6 ? 'Empathetic' : positiveRate > 0.4 ? 'Balanced' : 'Analytical',
        strengths: [
          'Strong emotional recognition',
          'Good cultural awareness',
          'Effective communication',
        ],
        improvementAreas: [
          'Emotional regulation during stress',
          'Cross-cultural communication',
          'Conflict resolution skills',
        ],
      },
      insights: [
        'Your empathy levels are consistently above average',
        'Cultural sensitivity shows room for improvement',
        'Positive interaction outcomes are trending upward',
        'Micro-expression detection accuracy is improving',
      ],
      recommendations: [
        {
          type: 'cultural_training',
          priority: 'medium',
          description: 'Enhance cultural sensitivity through targeted training',
          actions: [
            'Study cultural differences in emotional expression',
            'Practice cross-cultural communication scenarios',
            'Learn about nonverbal cues across cultures',
          ],
        },
        {
          type: 'empathy_enhancement',
          priority: 'low',
          description: 'Continue building empathy through social interactions',
          actions: [
            'Engage in active listening exercises',
            'Practice perspective-taking activities',
            'Participate in empathy-building workshops',
          ],
        },
      ],
    };

    setAnalysis(analysis);
  };

  const getEmotionColor = (emotion: string) => {
    const colors: { [key: string]: string } = {
      happiness: 'text-yellow-400',
      joy: 'text-yellow-400',
      sadness: 'text-blue-400',
      anger: 'text-red-400',
      fear: 'text-purple-400',
      surprise: 'text-orange-400',
      anxiety: 'text-indigo-400',
    };
    return colors[emotion.toLowerCase()] || 'text-slate-400';
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'positive': return 'text-green-400 bg-green-400/20';
      case 'negative': return 'text-red-400 bg-red-400/20';
      case 'mixed': return 'text-yellow-400 bg-yellow-400/20';
      default: return 'text-slate-400 bg-slate-400/20';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/20';
      case 'medium': return 'border-yellow-500 bg-yellow-500/20';
      case 'low': return 'border-green-500 bg-green-500/20';
      default: return 'border-slate-500 bg-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Empathy Amplifier</h2>
          <p className="text-slate-400">Enhance emotional understanding and social connection</p>
        </div>
        <div className="flex space-x-2">
          {[
            { value: 'detection', label: 'Detection' },
            { value: 'training', label: 'Training' },
            { value: 'simulation', label: 'Simulation' },
          ].map((mode) => (
            <Button
              key={mode.value}
              onClick={() => setActiveMode(mode.value as any)}
              variant={activeMode === mode.value ? 'default' : 'outline'}
              size="sm"
              className={activeMode === mode.value ? 'bg-purple-600' : 'border-slate-600'}
            >
              {mode.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Analysis Overview */}
      {analysis && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{analysis.empathyLevel}</div>
              <div className="text-sm text-slate-400">Empathy Level</div>
              <div className="text-xs text-green-400 mt-1">↗ Improving</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{analysis.emotionalIntelligence}</div>
              <div className="text-sm text-slate-400">EI Score</div>
              <div className="text-xs text-blue-400 mt-1">→ Stable</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{analysis.socialAwareness}</div>
              <div className="text-sm text-slate-400">Social Awareness</div>
              <div className="text-xs text-green-400 mt-1">↗ Improving</div>
            </CardContent>
          </Card>

          <Card className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{analysis.culturalSensitivity}</div>
              <div className="text-sm text-slate-400">Cultural Sensitivity</div>
              <div className="text-xs text-yellow-400 mt-1">⚠ Needs Work</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="bg-slate-700 border-slate-600">
          <TabsTrigger value="events">Recent Events</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Recent Empathy Events</CardTitle>
              <CardDescription className="text-slate-400">
                Your latest social interactions and emotional exchanges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {empathyEvents.slice(0, 8).map((event) => (
                  <div key={event.id} className="p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-slate-500">
                          {event.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {event.timestamp.toLocaleDateString()} {event.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <Badge className={getOutcomeColor(event.interactionQuality.outcome)}>
                        {event.interactionQuality.outcome}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm font-medium text-slate-300 mb-1">Detected Emotions</div>
                        <div className="space-y-1">
                          {event.emotionalData.detectedEmotions.slice(0, 2).map((emotion, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                              <span className={getEmotionColor(emotion.emotion)}>
                                {emotion.emotion}
                              </span>
                              <span className="text-slate-400">
                                {emotion.intensity}/10 ({Math.round(emotion.confidence * 100)}%)
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-slate-300 mb-1">Interaction Quality</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Empathy:</span>
                            <span className="text-white">{event.interactionQuality.empathyLevel}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Connection:</span>
                            <span className="text-white">{event.interactionQuality.connectionDepth}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Understanding:</span>
                            <span className="text-white">{event.interactionQuality.mutualUnderstanding}/10</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-slate-300 mb-1">Cultural Context</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Culture:</span>
                            <span className="text-white">{event.culturalContext.primaryCulture}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Translation:</span>
                            <span className="text-white">
                              {event.culturalContext.translationNeeded ? 'Needed' : 'Not needed'}
                            </span>
                          </div>
                          {event.culturalContext.translationNeeded && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Accuracy:</span>
                              <span className="text-white">
                                {Math.round(event.culturalContext.translationAccuracy * 100)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {analysis && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Interaction Patterns</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Dominant Style</div>
                      <Badge className="bg-purple-600">{analysis.interactionPatterns.dominantStyle}</Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Strengths</div>
                      <div className="space-y-1">
                        {analysis.interactionPatterns.strengths.map((strength, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="text-green-400">✓</span>
                            <span className="text-slate-300">{strength}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-slate-300 mb-2">Areas for Improvement</div>
                      <div className="space-y-1">
                        {analysis.interactionPatterns.improvementAreas.map((area, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <span className="text-yellow-400">⚠</span>
                            <span className="text-slate-300">{area}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-700 border-slate-600">
                  <CardHeader>
                    <CardTitle className="text-white">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.insights.map((insight, index) => (
                        <div key={index} className="p-3 bg-slate-600 rounded-lg">
                          <div className="flex items-start space-x-2">
                            <span className="text-blue-400 mt-1">💡</span>
                            <span className="text-sm text-slate-300">{insight}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-slate-700 border-slate-600">
                <CardHeader>
                  <CardTitle className="text-white">Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                      <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(rec.priority)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-white">{rec.description}</div>
                          <Badge variant="outline" className="border-slate-500">
                            {rec.priority}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="text-xs text-slate-400">Actions:</div>
                          <div className="space-y-1">
                            {rec.actions.map((action, actionIndex) => (
                              <div key={actionIndex} className="flex items-center space-x-2 text-sm">
                                <span className="text-purple-400">•</span>
                                <span className="text-slate-300">{action}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Micro-Expression Training</CardTitle>
                <CardDescription className="text-slate-400">
                  Practice detecting subtle emotional cues
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 bg-slate-600 rounded-lg">
                  <div className="text-4xl mb-2">😊</div>
                  <div className="text-sm text-slate-300">Detect this expression</div>
                </div>
                <div className="space-y-2">
                  {['Happiness', 'Surprise', 'Sadness', 'Neutral'].map((option, index) => (
                    <button
                      key={index}
                      className="w-full p-2 text-left bg-slate-600 hover:bg-slate-500 rounded text-sm text-slate-300"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Cultural Sensitivity Training</CardTitle>
                <CardDescription className="text-slate-400">
                  Learn about emotional expression across cultures
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-slate-600 rounded-lg">
                  <div className="text-sm font-medium text-white mb-2">Scenario: Business Meeting</div>
                  <div className="text-xs text-slate-400 mb-3">
                    A colleague from Japan avoids eye contact during a presentation
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-slate-300">What does this likely mean?</div>
                    <div className="space-y-1">
                      {['Disrespect', 'Cultural norm', 'Anxiety', 'Disagreement'].map((option, index) => (
                        <button
                          key={index}
                          className="w-full p-1 text-left text-xs bg-slate-500 hover:bg-slate-400 rounded text-slate-300"
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}