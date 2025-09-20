'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  Activity,
  TrendingUp,
  AlertCircle,
  Play,
  Pause,
  Square,
  Settings,
  Download,
  RefreshCw,
  Users,
  Clock,
  Target,
  Zap
} from 'lucide-react';

interface BCISession {
  id: string;
  userId: string;
  organization: string;
  sessionType: string;
  status: 'active' | 'completed' | 'paused' | 'error';
  deviceInfo: {
    deviceType: string;
    model: string;
    serialNumber: string;
    channels: string[];
    samplingRate: number;
    connectionType: string;
  };
  metrics: {
    attention: { score: number; trend: string; baseline: number };
    relaxation: { score: number; trend: string; baseline: number };
    cognitiveLoad: { score: number; trend: string; baseline: number };
    stress: { score: number; trend: string; baseline: number };
    focus: { score: number; trend: string; baseline: number };
  };
  analysis: {
    cognitiveState: string;
    recommendations: string[];
    insights: any[];
    biomarkers: any;
  };
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  endedAt?: string;
  duration?: number;
}

interface BCIMetrics {
  attention: { score: number; trend: string; baseline: number };
  relaxation: { score: number; trend: string; baseline: number };
  cognitiveLoad: { score: number; trend: string; baseline: number };
  stress: { score: number; trend: string; baseline: number };
  focus: { score: number; trend: string; baseline: number };
}

const BCIDashboard = () => {
  const [sessions, setSessions] = useState<BCISession[]>([]);
  const [selectedSession, setSelectedSession] = useState<BCISession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<BCISession | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<BCIMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (activeSession) {
      const interval = setInterval(() => {
        // Mock real-time data updates
        setRealTimeMetrics({
          attention: { score: Math.floor(Math.random() * 40) + 60, trend: 'increasing', baseline: 65 },
          relaxation: { score: Math.floor(Math.random() * 30) + 50, trend: 'stable', baseline: 60 },
          cognitiveLoad: { score: Math.floor(Math.random() * 30) + 30, trend: 'decreasing', baseline: 50 },
          stress: { score: Math.floor(Math.random() * 20) + 15, trend: 'decreasing', baseline: 30 },
          focus: { score: Math.floor(Math.random() * 30) + 70, trend: 'increasing', baseline: 75 },
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [activeSession]);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/bci/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        const active = data.find((s: BCISession) => s.status === 'active');
        setActiveSession(active || null);
      }
    } catch (error) {
      console.error('Error fetching BCI sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startSession = async () => {
    try {
      const response = await fetch('/api/bci/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionType: 'cognitive-assessment',
          deviceInfo: {
            deviceType: 'eeg-headset',
            model: 'NeuroSky MindWave',
            serialNumber: 'NS2024001',
            channels: ['Fp1', 'Fp2', 'F3', 'F4'],
            samplingRate: 512,
            connectionType: 'bluetooth',
          },
          settings: {
            realTimeProcessing: true,
            artifactDetection: true,
            adaptiveThresholds: true,
          },
        }),
      });

      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setActiveSession(newSession);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error starting BCI session:', error);
    }
  };

  const pauseSession = () => {
    if (activeSession) {
      setActiveSession({ ...activeSession, status: 'paused' });
      setIsConnected(false);
    }
  };

  const resumeSession = () => {
    if (activeSession) {
      setActiveSession({ ...activeSession, status: 'active' });
      setIsConnected(true);
    }
  };

  const stopSession = () => {
    if (activeSession) {
      setActiveSession({ ...activeSession, status: 'completed', endedAt: new Date().toISOString() });
      setIsConnected(false);
    }
  };

  const getMetricColor = (score: number, baseline: number) => {
    const diff = score - baseline;
    if (diff > 10) return 'text-green-600';
    if (diff < -10) return 'text-red-600';
    return 'text-blue-600';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'decreasing': return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const MetricCard = ({ title, metric, icon: Icon }: {
    title: string;
    metric: { score: number; trend: string; baseline: number };
    icon: any;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          <span className={getMetricColor(metric.score, metric.baseline)}>
            {metric.score}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          {getTrendIcon(metric.trend)}
          <span>Baseline: {metric.baseline}</span>
        </div>
        <Progress
          value={metric.score}
          className="mt-2"
          style={{
            backgroundColor: metric.score > metric.baseline ? '#dcfce7' : '#fef2f2'
          }}
        />
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brain-Computer Interface</h1>
          <p className="text-muted-foreground">
            Real-time brainwave monitoring and cognitive analysis
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Disconnected"}
          </Badge>
          <Button onClick={fetchSessions} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Session Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Session Control</span>
          </CardTitle>
          <CardDescription>
            Start, pause, or stop BCI monitoring sessions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {!activeSession ? (
              <Button onClick={startSession} className="flex items-center space-x-2">
                <Play className="w-4 h-4" />
                <span>Start Session</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <Button
                  onClick={activeSession.status === 'paused' ? resumeSession : pauseSession}
                  variant="outline"
                  className="flex items-center space-x-2"
                >
                  {activeSession.status === 'paused' ? (
                    <Play className="w-4 h-4" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  <span>{activeSession.status === 'paused' ? 'Resume' : 'Pause'}</span>
                </Button>
                <Button onClick={stopSession} variant="destructive" className="flex items-center space-x-2">
                  <Square className="w-4 h-4" />
                  <span>Stop Session</span>
                </Button>
              </div>
            )}
            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Real-time Metrics</TabsTrigger>
          <TabsTrigger value="sessions">Session History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {activeSession && realTimeMetrics ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                title="Attention"
                metric={realTimeMetrics.attention}
                icon={Target}
              />
              <MetricCard
                title="Relaxation"
                metric={realTimeMetrics.relaxation}
                icon={Activity}
              />
              <MetricCard
                title="Cognitive Load"
                metric={realTimeMetrics.cognitiveLoad}
                icon={Brain}
              />
              <MetricCard
                title="Stress Level"
                metric={realTimeMetrics.stress}
                icon={AlertCircle}
              />
              <MetricCard
                title="Focus"
                metric={realTimeMetrics.focus}
                icon={Zap}
              />
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No active session. Start a new session to view real-time metrics.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <Card key={session.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.sessionType}</CardTitle>
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {session.deviceInfo.model} • {session.deviceInfo.channels.length} channels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Duration</span>
                        <div className="font-medium">
                          {session.duration ? `${session.duration} min` : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Attention</span>
                        <div className="font-medium">
                          {session.metrics.attention.score}/100
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Focus</span>
                        <div className="font-medium">
                          {session.metrics.focus.score}/100
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Stress</span>
                        <div className="font-medium">
                          {session.metrics.stress.score}/100
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Session Statistics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total Sessions</span>
                    <span className="font-medium">{sessions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-medium">
                      {sessions.filter(s => s.status === 'active').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed Sessions</span>
                    <span className="font-medium">
                      {sessions.filter(s => s.status === 'completed').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Duration</span>
                    <span className="font-medium">
                      {sessions.length > 0
                        ? Math.round(sessions.reduce((acc, s) => acc + (s.duration || 0), 0) / sessions.length)
                        : 0} min
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session) => (
                    <div key={session.id} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{session.sessionType}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(session.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {session.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BCIDashboard;