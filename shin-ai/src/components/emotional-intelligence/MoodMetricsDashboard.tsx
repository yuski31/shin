'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface MoodMetric {
  timestamp: Date;
  metrics: {
    overallMood: number;
    happiness: number;
    anxiety: number;
    stress: number;
    energy: number;
    empathy: number;
    focus: number;
    creativity: number;
  };
  triggers: {
    positive: string[];
    negative: string[];
    neutral: string[];
  };
  context: {
    activity?: string;
    location?: string;
    socialSetting?: string;
    timeOfDay?: string;
  };
}

interface MoodTrend {
  metric: string;
  trend: 'improving' | 'declining' | 'stable';
  change: number;
  confidence: number;
}

export function MoodMetricsDashboard() {
  const [metrics, setMetrics] = useState<MoodMetric[]>([]);
  const [trends, setTrends] = useState<MoodTrend[]>([]);
  const [timeframe, setTimeframe] = useState('7d');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMoodMetrics();
  }, [timeframe]);

  const loadMoodMetrics = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));

      // Generate mock data
      const mockMetrics: MoodMetric[] = [];
      const now = new Date();

      for (let i = 0; i < 20; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        mockMetrics.push({
          timestamp: date,
          metrics: {
            overallMood: Math.floor(Math.random() * 4) + 4, // 4-7
            happiness: Math.floor(Math.random() * 3) + 5, // 5-7
            anxiety: Math.floor(Math.random() * 4) + 3, // 3-6
            stress: Math.floor(Math.random() * 3) + 4, // 4-6
            energy: Math.floor(Math.random() * 4) + 4, // 4-7
            empathy: Math.floor(Math.random() * 3) + 5, // 5-7
            focus: Math.floor(Math.random() * 3) + 5, // 5-7
            creativity: Math.floor(Math.random() * 4) + 4, // 4-7
          },
          triggers: {
            positive: ['Good weather', 'Exercise', 'Social connection'],
            negative: ['Work deadline', 'Poor sleep', 'Conflict'],
            neutral: ['Routine activities', 'Weather change'],
          },
          context: {
            activity: ['Work', 'Exercise', 'Social', 'Rest'][Math.floor(Math.random() * 4)],
            location: ['Home', 'Office', 'Outdoors', 'Social venue'][Math.floor(Math.random() * 4)],
            socialSetting: ['Alone', 'Small group', 'Large group'][Math.floor(Math.random() * 3)],
            timeOfDay: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)],
          },
        });
      }

      setMetrics(mockMetrics);
      calculateTrends(mockMetrics);
    } catch (error) {
      console.error('Failed to load mood metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTrends = (data: MoodMetric[]) => {
    const metrics = ['overallMood', 'anxiety', 'stress', 'energy', 'happiness', 'empathy', 'focus', 'creativity'];

    const trends: MoodTrend[] = metrics.map(metric => {
      if (data.length < 2) {
        return {
          metric,
          trend: 'stable' as const,
          change: 0,
          confidence: 0.5,
        };
      }

      const firstHalf = data.slice(0, Math.floor(data.length / 2));
      const secondHalf = data.slice(Math.floor(data.length / 2));

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.metrics[metric as keyof typeof m.metrics], 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.metrics[metric as keyof typeof m.metrics], 0) / secondHalf.length;

      const change = secondAvg - firstAvg;
      let trend: 'improving' | 'declining' | 'stable' = 'stable';

      if (change > 0.3) trend = 'improving';
      else if (change < -0.3) trend = 'declining';

      return {
        metric,
        trend,
        change: Math.round(change * 100) / 100,
        confidence: 0.7 + Math.random() * 0.3,
      };
    });

    setTrends(trends);
  };

  const getMetricColor = (value: number) => {
    if (value >= 7) return 'text-green-400';
    if (value >= 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'declining': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const formatMetricName = (metric: string) => {
    return metric.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Mood Metrics Dashboard</h2>
          <p className="text-slate-400">Track your emotional patterns and trends</p>
        </div>
        <div className="flex space-x-2">
          {['7d', '30d', '90d', '1y'].map((period) => (
            <Button
              key={period}
              onClick={() => setTimeframe(period)}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              className={timeframe === period ? 'bg-purple-600' : 'border-slate-600'}
            >
              {period}
            </Button>
          ))}
          <Button
            onClick={loadMoodMetrics}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-slate-600"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.metrics.overallMood, 0) / metrics.length * 10) / 10 : 0}
            </div>
            <div className="text-sm text-slate-400">Average Mood</div>
            <div className="text-xs text-green-400 mt-1">
              {trends.find(t => t.metric === 'overallMood')?.trend === 'improving' ? '↗ Improving' : '→ Stable'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.metrics.anxiety, 0) / metrics.length * 10) / 10 : 0}
            </div>
            <div className="text-sm text-slate-400">Average Anxiety</div>
            <div className="text-xs text-red-400 mt-1">
              {trends.find(t => t.metric === 'anxiety')?.trend === 'declining' ? '↘ Improving' : '→ Stable'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.metrics.energy, 0) / metrics.length * 10) / 10 : 0}
            </div>
            <div className="text-sm text-slate-400">Average Energy</div>
            <div className="text-xs text-blue-400 mt-1">
              {trends.find(t => t.metric === 'energy')?.trend === 'improving' ? '↗ Improving' : '→ Stable'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">
              {metrics.length > 0 ? Math.round(metrics.reduce((sum, m) => sum + m.metrics.empathy, 0) / metrics.length * 10) / 10 : 0}
            </div>
            <div className="text-sm text-slate-400">Average Empathy</div>
            <div className="text-xs text-purple-400 mt-1">
              {trends.find(t => t.metric === 'empathy')?.trend === 'improving' ? '↗ Improving' : '→ Stable'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-700 border-slate-600">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Recent Metrics</CardTitle>
              <CardDescription className="text-slate-400">
                Your latest mood measurements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.slice(0, 5).map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-slate-400">
                        {metric.timestamp.toLocaleDateString()}
                      </div>
                      <Badge variant="outline" className="border-slate-500">
                        {metric.context.timeOfDay}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`font-medium ${getMetricColor(metric.metrics.overallMood)}`}>
                          Mood: {metric.metrics.overallMood}
                        </div>
                        <div className="text-xs text-slate-400">
                          Anxiety: {metric.metrics.anxiety} | Energy: {metric.metrics.energy}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500">
                        {metric.context.activity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Mood Trends</CardTitle>
              <CardDescription className="text-slate-400">
                Emotional patterns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trends.map((trend) => (
                  <div key={trend.metric} className="p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-300">
                        {formatMetricName(trend.metric)}
                      </span>
                      <span className="text-lg">
                        {getTrendIcon(trend.trend)}
                      </span>
                    </div>
                    <div className={`text-lg font-bold ${getTrendColor(trend.trend)}`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}
                    </div>
                    <div className="text-xs text-slate-400">
                      {Math.round(trend.confidence * 100)}% confidence
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Positive Triggers</CardTitle>
                <CardDescription className="text-slate-400">
                  What improves your mood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Exercise', 'Social connection', 'Good weather', 'Music', 'Nature', 'Achievement'].map((trigger, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                      <span className="text-sm text-slate-300">{trigger}</span>
                      <Badge variant="outline" className="border-green-500 text-green-400">
                        High
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-700 border-slate-600">
              <CardHeader>
                <CardTitle className="text-white">Negative Triggers</CardTitle>
                <CardDescription className="text-slate-400">
                  What challenges your mood
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Work stress', 'Poor sleep', 'Conflict', 'Deadlines', 'Weather', 'Fatigue'].map((trigger, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-600 rounded">
                      <span className="text-sm text-slate-300">{trigger}</span>
                      <Badge variant="outline" className="border-red-500 text-red-400">
                        Moderate
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Emotional Insights</CardTitle>
              <CardDescription className="text-slate-400">
                AI-powered analysis of your mood patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-600/20 border border-green-600/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-400">✅</span>
                    <div>
                      <div className="text-sm font-medium text-green-400">Positive Trend Detected</div>
                      <div className="text-sm text-slate-300">
                        Your overall mood has improved by 0.8 points over the past week, indicating effective coping strategies.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-yellow-400">⚠️</span>
                    <div>
                      <div className="text-sm font-medium text-yellow-400">Anxiety Pattern Identified</div>
                      <div className="text-sm text-slate-300">
                        Elevated anxiety levels detected during work hours. Consider implementing stress reduction techniques.
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-600/20 border border-blue-600/30 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400">💡</span>
                    <div>
                      <div className="text-sm font-medium text-blue-400">Optimization Opportunity</div>
                      <div className="text-sm text-slate-300">
                        Your energy levels peak in the morning. Schedule important tasks during this optimal window.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}