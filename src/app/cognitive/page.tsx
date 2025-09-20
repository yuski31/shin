'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  GitBranch,
  Heart,
  Eye,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Network,
  MessageSquare,
  TrendingUp
} from 'lucide-react';

interface CognitiveMetrics {
  reasoningAccuracy: number;
  knowledgeGraphNodes: number;
  emotionAnalysisScore: number;
  biasDetectionRate: number;
  causalInferenceScore: number;
  symbolicReasoningScore: number;
}

interface RecentAnalysis {
  id: string;
  type: 'reasoning' | 'knowledge' | 'emotion' | 'bias' | 'causal';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
  confidence: number;
}

export default function CognitiveComputingPage() {
  const [metrics, setMetrics] = useState<CognitiveMetrics>({
    reasoningAccuracy: 0,
    knowledgeGraphNodes: 0,
    emotionAnalysisScore: 0,
    biasDetectionRate: 0,
    causalInferenceScore: 0,
    symbolicReasoningScore: 0
  });

  const [recentAnalyses, setRecentAnalyses] = useState<RecentAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCognitiveMetrics();
    fetchRecentAnalyses();
  }, []);

  const fetchCognitiveMetrics = async () => {
    try {
      const response = await fetch('/api/cognitive/metrics');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Failed to fetch cognitive metrics:', error);
    }
  };

  const fetchRecentAnalyses = async () => {
    try {
      const response = await fetch('/api/cognitive/analyses');
      if (response.ok) {
        const data = await response.json();
        setRecentAnalyses(data);
      }
    } catch (error) {
      console.error('Failed to fetch recent analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisIcon = (type: RecentAnalysis['type']) => {
    switch (type) {
      case 'reasoning':
        return <Brain className="h-4 w-4" />;
      case 'knowledge':
        return <GitBranch className="h-4 w-4" />;
      case 'emotion':
        return <Heart className="h-4 w-4" />;
      case 'bias':
        return <Eye className="h-4 w-4" />;
      case 'causal':
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getAnalysisColor = (status: RecentAnalysis['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: RecentAnalysis['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cognitive Computing</h1>
          <p className="text-gray-600 mt-2">
            Symbolic reasoning, knowledge graphs, and causal inference
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Network className="h-4 w-4 mr-2" />
            Build Graph
          </Button>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Analyze Text
          </Button>
          <Button size="sm">
            <Brain className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reasoning Accuracy</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.reasoningAccuracy}%</div>
            <Progress value={metrics.reasoningAccuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+2.3%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Knowledge Graph</CardTitle>
            <GitBranch className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.knowledgeGraphNodes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1,247</span> nodes added
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emotion Analysis</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.emotionAnalysisScore}%</div>
            <Progress value={metrics.emotionAnalysisScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+5.1%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bias Detection</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.biasDetectionRate}%</div>
            <Progress value={metrics.biasDetectionRate} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+1.8%</span> accuracy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Causal Inference</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.causalInferenceScore}%</div>
            <Progress value={metrics.causalInferenceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+3.2%</span> from baseline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Symbolic Reasoning</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.symbolicReasoningScore}%</div>
            <Progress value={metrics.symbolicReasoningScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+4.7%</span> improvement
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="emotion">Emotion</TabsTrigger>
          <TabsTrigger value="bias">Bias Detection</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Analyses</CardTitle>
                <CardDescription>Latest cognitive computing analyses and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentAnalyses.slice(0, 5).map((analysis) => (
                    <div key={analysis.id} className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getAnalysisColor(analysis.status)}`}>
                        {getAnalysisIcon(analysis.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {analysis.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {analysis.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {getStatusIcon(analysis.status)}
                            <span className="ml-1 capitalize">{analysis.status}</span>
                          </Badge>
                          <span className={`text-xs ${getConfidenceColor(analysis.confidence)}`}>
                            {analysis.confidence}% confidence
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {analysis.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common cognitive computing tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Brain className="h-6 w-6 mb-2" />
                    <span className="text-sm">Symbolic Reasoning</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <GitBranch className="h-6 w-6 mb-2" />
                    <span className="text-sm">Build Graph</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Heart className="h-6 w-6 mb-2" />
                    <span className="text-sm">Emotion Analysis</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Eye className="h-6 w-6 mb-2" />
                    <span className="text-sm">Bias Detection</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reasoning">
          <Card>
            <CardHeader>
              <CardTitle>Symbolic Reasoning Engine</CardTitle>
              <CardDescription>Advanced logical reasoning and inference capabilities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No reasoning sessions yet</h3>
                <p className="text-gray-600 mb-4">
                  Start a symbolic reasoning session to analyze complex logical problems
                </p>
                <Button>
                  <Brain className="h-4 w-4 mr-2" />
                  Start Reasoning
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Graph Builder</CardTitle>
              <CardDescription>Construct and explore interconnected knowledge networks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GitBranch className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No knowledge graphs yet</h3>
                <p className="text-gray-600 mb-4">
                  Create knowledge graphs from documents and data sources
                </p>
                <Button>
                  <Network className="h-4 w-4 mr-2" />
                  Build Graph
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emotion">
          <Card>
            <CardHeader>
              <CardTitle>Emotion Analysis</CardTitle>
              <CardDescription>Deep emotional intelligence and sentiment analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No emotion analyses yet</h3>
                <p className="text-gray-600 mb-4">
                  Analyze text and conversations for emotional content and sentiment
                </p>
                <Button>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Analyze Text
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bias">
          <Card>
            <CardHeader>
              <CardTitle>Bias Detection Engine</CardTitle>
              <CardDescription>Identify and mitigate cognitive biases in decision-making</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bias analyses yet</h3>
                <p className="text-gray-600 mb-4">
                  Detect cognitive biases in text, decisions, and reasoning processes
                </p>
                <Button>
                  <Target className="h-4 w-4 mr-2" />
                  Detect Bias
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}