'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

interface AttentionMetric {
  id: string;
  type: 'attention-span' | 'focus-quality' | 'distraction-resistance' | 'flow-state';
  value: number;
  timestamp: Date;
  trend: 'up' | 'down' | 'stable';
}

interface FocusAnalytics {
  currentScore: number;
  averageScore: number;
  bestScore: number;
  improvement: number;
  timeInFlow: number;
  distractionsBlocked: number;
  productivityIndex: number;
}

export function AttentionMetricsDashboard() {
  const [metrics, setMetrics] = useState<AttentionMetric[]>([]);
  const [analytics, setAnalytics] = useState<FocusAnalytics>({
    currentScore: 0,
    averageScore: 0,
    bestScore: 0,
    improvement: 0,
    timeInFlow: 0,
    distractionsBlocked: 0,
    productivityIndex: 0,
  });
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

  // Simulate real-time data updates
  useEffect(() => {
    const generateSampleData = () => {
      const sampleMetrics: AttentionMetric[] = [
        {
          id: '1',
          type: 'attention-span',
          value: 85,
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          trend: 'up',
        },
        {
          id: '2',
          type: 'focus-quality',
          value: 92,
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          trend: 'up',
        },
        {
          id: '3',
          type: 'distraction-resistance',
          value: 78,
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          trend: 'stable',
        },
        {
          id: '4',
          type: 'flow-state',
          value: 88,
          timestamp: new Date(),
          trend: 'up',
        },
      ];

      setMetrics(sampleMetrics);

      // Calculate analytics
      const currentScore = sampleMetrics[sampleMetrics.length - 1]?.value || 0;
      const averageScore = sampleMetrics.reduce((sum, m) => sum + m.value, 0) / sampleMetrics.length;
      const bestScore = Math.max(...sampleMetrics.map(m => m.value));
      const improvement = currentScore - (sampleMetrics[0]?.value || 0);

      setAnalytics({
        currentScore,
        averageScore,
        bestScore,
        improvement,
        timeInFlow: Math.floor(averageScore / 100 * 240), // 4 hours max
        distractionsBlocked: Math.floor(averageScore / 100 * 15),
        productivityIndex: Math.floor((currentScore + averageScore) / 2),
      });
    };

    generateSampleData();

    // Update every 30 seconds
    const interval = setInterval(generateSampleData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{analytics.currentScore}%</div>
            <div className="text-sm text-slate-400">Current Focus</div>
            <div className="text-xs text-green-400 mt-1">
              +{analytics.improvement}% from start
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{analytics.averageScore.toFixed(1)}%</div>
            <div className="text-sm text-slate-400">Average Score</div>
            <div className="text-xs text-slate-400 mt-1">
              Last {timeRange}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{analytics.timeInFlow}m</div>
            <div className="text-sm text-slate-400">Time in Flow</div>
            <div className="text-xs text-blue-400 mt-1">
              Peak performance
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-700 border-slate-600">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{analytics.productivityIndex}%</div>
            <div className="text-sm text-slate-400">Productivity</div>
            <div className="text-xs text-purple-400 mt-1">
              Overall efficiency
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Metrics */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Real-time Metrics</CardTitle>
            <CardDescription className="text-slate-300">
              Live attention and focus measurements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                  <div>
                    <div className="font-medium text-white capitalize">
                      {metric.type.replace('-', ' ')}
                    </div>
                    <div className="text-sm text-slate-400">
                      {metric.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xl font-bold ${getMetricColor(metric.value)}`}>
                      {metric.value}%
                    </div>
                    <div className="text-sm text-slate-400">
                      {getTrendIcon(metric.trend)} {metric.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Focus Quality Chart */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Focus Quality Trend</CardTitle>
            <CardDescription className="text-slate-300">
              Attention metrics over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['attention-span', 'focus-quality', 'flow-state', 'distraction-resistance'].map((metricType) => {
                const metric = metrics.find(m => m.type === metricType);
                if (!metric) return null;

                return (
                  <div key={metricType} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 capitalize">
                        {metricType.replace('-', ' ')}
                      </span>
                      <span className={`font-medium ${getMetricColor(metric.value)}`}>
                        {metric.value}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-1000 ${
                          metric.value >= 80 ? 'bg-green-500' :
                          metric.value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Range Selector */}
      <div className="flex justify-center">
        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
          {[
            { value: '1h', label: '1 Hour' },
            { value: '24h', label: '24 Hours' },
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as any)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                timeRange === range.value
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement Badges */}
      <Card className="bg-slate-700 border-slate-600">
        <CardHeader>
          <CardTitle className="text-white">Recent Achievements</CardTitle>
          <CardDescription className="text-slate-300">
            Focus milestones and improvements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-green-600 hover:bg-green-700">
              🎯 Flow State Master
            </Badge>
            <Badge className="bg-blue-600 hover:bg-blue-700">
              🚫 Distraction Destroyer
            </Badge>
            <Badge className="bg-purple-600 hover:bg-purple-700">
              ⏰ Time Bender
            </Badge>
            <Badge className="bg-yellow-600 hover:bg-yellow-700">
              🧘 Zen Master
            </Badge>
            <Badge className="bg-pink-600 hover:bg-pink-700">
              📈 Productivity Pro
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}