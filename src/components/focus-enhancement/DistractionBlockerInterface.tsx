'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface BlockingRule {
  id: string;
  name: string;
  type: 'notification' | 'app' | 'website' | 'keyword';
  target: string;
  enabled: boolean;
  priority: 'low' | 'medium' | 'high';
  blockedCount: number;
}

interface DistractionEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  action: 'blocked' | 'allowed' | 'postponed';
  reason?: string;
}

export function DistractionBlockerInterface() {
  const [blockingRules, setBlockingRules] = useState<BlockingRule[]>([]);
  const [recentEvents, setRecentEvents] = useState<DistractionEvent[]>([]);
  const [isBlockingEnabled, setIsBlockingEnabled] = useState(true);
  const [currentStats, setCurrentStats] = useState({
    blockedToday: 0,
    allowedToday: 0,
    postponedToday: 0,
    effectiveness: 0,
  });

  useEffect(() => {
    // Sample data
    const sampleRules: BlockingRule[] = [
      {
        id: '1',
        name: 'Social Media Block',
        type: 'website',
        target: 'facebook.com, instagram.com, twitter.com',
        enabled: true,
        priority: 'high',
        blockedCount: 15,
      },
      {
        id: '2',
        name: 'Work Email Only',
        type: 'app',
        target: 'outlook.exe, gmail.com',
        enabled: true,
        priority: 'medium',
        blockedCount: 8,
      },
      {
        id: '3',
        name: 'Entertainment Sites',
        type: 'website',
        target: 'youtube.com, netflix.com',
        enabled: true,
        priority: 'high',
        blockedCount: 23,
      },
      {
        id: '4',
        name: 'News Notifications',
        type: 'notification',
        target: 'news, alerts, breaking',
        enabled: false,
        priority: 'low',
        blockedCount: 0,
      },
    ];

    const sampleEvents: DistractionEvent[] = [
      {
        id: '1',
        type: 'website',
        source: 'facebook.com',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        action: 'blocked',
        reason: 'Social Media Block rule',
      },
      {
        id: '2',
        type: 'notification',
        source: 'Slack',
        timestamp: new Date(Date.now() - 12 * 60 * 1000),
        action: 'allowed',
        reason: 'Work-related communication',
      },
      {
        id: '3',
        type: 'app',
        source: 'YouTube',
        timestamp: new Date(Date.now() - 18 * 60 * 1000),
        action: 'blocked',
        reason: 'Entertainment Sites rule',
      },
      {
        id: '4',
        type: 'website',
        source: 'github.com',
        timestamp: new Date(Date.now() - 25 * 60 * 1000),
        action: 'allowed',
        reason: 'Development work',
      },
    ];

    setBlockingRules(sampleRules);
    setRecentEvents(sampleEvents);
    setCurrentStats({
      blockedToday: 47,
      allowedToday: 12,
      postponedToday: 8,
      effectiveness: 85,
    });
  }, []);

  const toggleRule = (ruleId: string) => {
    setBlockingRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-slate-600';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'blocked': return 'text-red-400';
      case 'allowed': return 'text-green-400';
      case 'postponed': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Distraction Blocker</h2>
          <p className="text-slate-400">Manage distraction blocking rules and monitor effectiveness</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300">Blocking:</span>
            <Button
              onClick={() => setIsBlockingEnabled(!isBlockingEnabled)}
              variant={isBlockingEnabled ? 'default' : 'outline'}
              className={isBlockingEnabled ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isBlockingEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Statistics */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Today's Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-300">Blocked</span>
                <span className="text-red-400 font-medium">{currentStats.blockedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Allowed</span>
                <span className="text-green-400 font-medium">{currentStats.allowedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Postponed</span>
                <span className="text-yellow-400 font-medium">{currentStats.postponedToday}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Effectiveness</span>
                <span className="text-blue-400 font-medium">{currentStats.effectiveness}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button className="w-full justify-start bg-purple-600 hover:bg-purple-700">
                + New Rule
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📊 View Analytics
              </Button>
              <Button variant="outline" className="w-full justify-start">
                ⚙️ Advanced Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                📋 Export Report
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Blocked Sources */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Top Blocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockingRules
                .filter(rule => rule.blockedCount > 0)
                .sort((a, b) => b.blockedCount - a.blockedCount)
                .slice(0, 4)
                .map((rule) => (
                  <div key={rule.id} className="flex justify-between items-center">
                    <span className="text-slate-300 text-sm">{rule.name}</span>
                    <Badge className="bg-red-600">{rule.blockedCount}</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocking Rules */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Blocking Rules</CardTitle>
            <CardDescription className="text-slate-300">
              Manage your distraction blocking rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {blockingRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-600 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Button
                      onClick={() => toggleRule(rule.id)}
                      variant="outline"
                      size="sm"
                      className={`w-8 h-8 p-0 ${rule.enabled ? 'bg-green-600' : 'bg-slate-500'}`}
                    >
                      {rule.enabled ? '✓' : '✗'}
                    </Button>
                    <div>
                      <div className="font-medium text-white">{rule.name}</div>
                      <div className="text-xs text-slate-400">{rule.target}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(rule.priority)}>
                      {rule.priority}
                    </Badge>
                    <span className="text-sm text-slate-400">
                      {rule.blockedCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-300">
              Latest distraction blocking events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentEvents.map((event) => (
                <div key={event.id} className="p-3 bg-slate-600 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{event.source}</span>
                    <span className={`text-sm ${getActionColor(event.action)}`}>
                      {event.action}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {event.timestamp.toLocaleTimeString()}
                  </div>
                  {event.reason && (
                    <div className="text-xs text-slate-500 mt-1">
                      {event.reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}