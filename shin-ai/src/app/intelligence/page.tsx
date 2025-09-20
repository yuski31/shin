'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import IntelligenceControlPanel from '@/components/intelligence-amplification/IntelligenceControlPanel';

interface Protocol {
  _id: string;
  name: string;
  description: string;
  category: string;
  effectiveness: {
    averageImprovement: number;
    userRating: number;
    totalSessions: number;
  };
  metadata?: {
    difficulty?: string;
  };
}

interface Session {
  _id: string;
  sessionType: string;
  status: string;
  startTime: string;
  duration: number;
  results?: {
    improvementScore: number;
  };
}

export default function IntelligenceAmplificationPage() {
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProtocol, setSelectedProtocol] = useState<Protocol | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch protocols
      const protocolsRes = await fetch('/api/intelligence/protocols');
      if (protocolsRes.ok) {
        const protocolsData = await protocolsRes.json();
        setProtocols(protocolsData.protocols);
      }

      // Fetch recent sessions
      const sessionsRes = await fetch('/api/intelligence/session');
      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData.sessions);
      }
    } catch (error) {
      console.error('Error fetching intelligence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (protocol: Protocol) => {
    try {
      const response = await fetch('/api/intelligence/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          protocolId: protocol._id,
          sessionType: protocol.category === 'iq-boost' ? 'iq-boost' : 'math-intuition',
          settings: {
            intensity: 5,
            frequency: 10,
            duration: 30,
            focusAreas: ['general']
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Session started successfully! Session ID: ${result.session._id}`);
        fetchData(); // Refresh data
      } else {
        const error = await response.json();
        alert(`Error starting session: ${error.error}`);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      alert('Error starting session');
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'iq-boost': return '🧠';
      case 'math-intuition': return '🔢';
      case 'creative-enhancement': return '🎨';
      case 'pattern-recognition': return '🔍';
      case 'synesthetic-learning': return '🌈';
      case 'memory-optimization': return '💾';
      default: return '⚡';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading Intelligence Amplification System...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Intelligence Amplification System
          </h1>
          <p className="text-xl text-gray-600">
            Phase 34: Cognitive Enhancement & Brain Augmentation
          </p>
          <p className="text-gray-500 mt-2">
            Enhance your cognitive abilities through simulated neural stimulation and mathematical intuition development
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-blue-600">{protocols.length}</div>
              <p className="text-gray-600">Available Protocols</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">{sessions.length}</div>
              <p className="text-gray-600">Total Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                {sessions.filter(s => s.status === 'completed').length}
              </div>
              <p className="text-gray-600">Completed Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(sessions.reduce((acc, s) => acc + (s.results?.improvementScore || 0), 0) / sessions.length)}%
              </div>
              <p className="text-gray-600">Average Improvement</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="protocols" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="protocols">Available Protocols</TabsTrigger>
            <TabsTrigger value="sessions">Session History</TabsTrigger>
            <TabsTrigger value="controls">Control Panel</TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {protocols.map((protocol) => (
                <Card key={protocol._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="text-2xl">{getCategoryIcon(protocol.category)}</div>
                      <Badge className={getDifficultyColor(protocol.metadata?.difficulty)}>
                        {protocol.metadata?.difficulty || 'intermediate'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{protocol.name}</CardTitle>
                    <CardDescription>{protocol.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Category:</span>
                      <Badge variant="outline">{protocol.category}</Badge>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Avg Improvement:</span>
                      <span className="font-medium text-green-600">
                        +{protocol.effectiveness.averageImprovement.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>User Rating:</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-1">{protocol.effectiveness.userRating.toFixed(1)}</span>
                        <span>⭐</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Total Sessions:</span>
                      <span className="font-medium">{protocol.effectiveness.totalSessions}</span>
                    </div>
                    <Button
                      onClick={() => startSession(protocol)}
                      className="w-full"
                      disabled={protocol.category === 'memory-optimization'}
                    >
                      Start Session
                    </Button>
                    {protocol.category === 'memory-optimization' && (
                      <p className="text-xs text-gray-500 text-center">
                        Coming soon in Phase 35
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="space-y-4">
              {sessions.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">No sessions found. Start your first intelligence enhancement session!</p>
                  </CardContent>
                </Card>
              ) : (
                sessions.map((session) => (
                  <Card key={session._id}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{getCategoryIcon(session.sessionType)}</div>
                          <div>
                            <h3 className="font-semibold">{session.sessionType.replace('-', ' ').toUpperCase()}</h3>
                            <p className="text-sm text-gray-600">
                              Started: {new Date(session.startTime).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge
                            variant={session.status === 'completed' ? 'default' :
                                   session.status === 'active' ? 'default' : 'secondary'}
                          >
                            {session.status}
                          </Badge>
                          {session.results?.improvementScore && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-green-600">
                                +{session.results.improvementScore.toFixed(1)}% improvement
                              </p>
                              <p className="text-xs text-gray-500">
                                Duration: {session.duration} min
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <IntelligenceControlPanel />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            ⚠️ <strong>Important:</strong> This system provides simulated cognitive enhancement.
            Always consult with healthcare professionals before using any cognitive enhancement techniques.
          </p>
          <p className="mt-2">
            For technical support, contact: support@shin-ai.com | Emergency: +1 (555) 123-4567
          </p>
        </div>
      </div>
    </div>
  );
}