'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface EmotionalSession {
  id: string;
  type: 'empathy' | 'mood_optimization' | 'resilience_training' | 'therapeutic_narrative';
  status: 'active' | 'paused' | 'completed';
  startTime: Date;
  endTime?: Date;
  duration: number;
  emotionalState: {
    baseline: { mood: number; anxiety: number; stress: number; empathy: number };
    current: { mood: number; anxiety: number; stress: number; empathy: number };
    target: { mood: number; anxiety: number; stress: number; empathy: number };
  };
}

export function EmotionalIntelligenceControlPanel() {
  const [currentSession, setCurrentSession] = useState<EmotionalSession | null>(null);
  const [sessionType, setSessionType] = useState<EmotionalSession['type']>('mood_optimization');
  const [moodTarget, setMoodTarget] = useState(8);
  const [anxietyTarget, setAnxietyTarget] = useState(3);
  const [stressTarget, setStressTarget] = useState(3);
  const [empathyTarget, setEmpathyTarget] = useState(7);
  const [isLoading, setIsLoading] = useState(false);

  const sessionTypes = [
    {
      value: 'mood_optimization',
      label: 'Mood Optimization',
      description: 'Enhance mood through targeted interventions',
      icon: '😊'
    },
    {
      value: 'empathy',
      label: 'Empathy Training',
      description: 'Develop emotional understanding and connection',
      icon: '🤝'
    },
    {
      value: 'resilience_training',
      label: 'Resilience Building',
      description: 'Strengthen emotional resilience and coping skills',
      icon: '💪'
    },
    {
      value: 'therapeutic_narrative',
      label: 'Therapeutic Narrative',
      description: 'Process emotions through guided storytelling',
      icon: '📖'
    },
  ];

  const startSession = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSession: EmotionalSession = {
        id: `ei_session_${Date.now()}`,
        type: sessionType,
        status: 'active',
        startTime: new Date(),
        duration: 0,
        emotionalState: {
          baseline: { mood: 5, anxiety: 5, stress: 5, empathy: 5 }, // Would be measured
          current: { mood: 5, anxiety: 5, stress: 5, empathy: 5 },
          target: {
            mood: moodTarget,
            anxiety: anxietyTarget,
            stress: stressTarget,
            empathy: empathyTarget
          },
        },
      };

      setCurrentSession(newSession);

      // Start session timer
      const interval = setInterval(() => {
        setCurrentSession(prev => {
          if (!prev || prev.status !== 'active') {
            clearInterval(interval);
            return prev;
          }

          const newDuration = Math.floor((Date.now() - prev.startTime.getTime()) / 1000 / 60);
          return { ...prev, duration: newDuration };
        });
      }, 1000);

    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const pauseSession = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentSession({
        ...currentSession,
        status: 'paused',
        endTime: new Date(),
      });
    } catch (error) {
      console.error('Failed to pause session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resumeSession = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentSession({
        ...currentSession,
        status: 'active',
        endTime: undefined,
      });
    } catch (error) {
      console.error('Failed to resume session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopSession = async () => {
    if (!currentSession) return;

    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      setCurrentSession({
        ...currentSession,
        status: 'completed',
        endTime: new Date(),
      });

      // Clear session after a delay
      setTimeout(() => setCurrentSession(null), 2000);
    } catch (error) {
      console.error('Failed to stop session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Configuration */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Session Configuration</CardTitle>
            <CardDescription className="text-slate-300">
              Configure your emotional intelligence session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Type */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Session Type
              </label>
              <div className="grid grid-cols-1 gap-2">
                {sessionTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSessionType(type.value)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      sessionType === type.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{type.icon}</span>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs opacity-75">{type.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Target Settings */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Target Mood: {moodTarget}/10
                </label>
                <Slider
                  value={[moodTarget]}
                  onValueChange={(value) => setMoodTarget(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Target Anxiety: {anxietyTarget}/10
                </label>
                <Slider
                  value={[anxietyTarget]}
                  onValueChange={(value) => setAnxietyTarget(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Target Stress: {stressTarget}/10
                </label>
                <Slider
                  value={[stressTarget]}
                  onValueChange={(value) => setStressTarget(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Target Empathy: {empathyTarget}/10
                </label>
                <Slider
                  value={[empathyTarget]}
                  onValueChange={(value) => setEmpathyTarget(value[0])}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Session Status */}
        <Card className="bg-slate-700 border-slate-600">
          <CardHeader>
            <CardTitle className="text-white">Session Status</CardTitle>
            <CardDescription className="text-slate-300">
              Current session information and controls
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge
                    variant={currentSession.status === 'active' ? 'default' : 'secondary'}
                    className={
                      currentSession.status === 'active'
                        ? 'bg-green-600'
                        : currentSession.status === 'paused'
                        ? 'bg-yellow-600'
                        : 'bg-blue-600'
                    }
                  >
                    {currentSession.status.toUpperCase()}
                  </Badge>
                  <span className="text-slate-300 text-sm">
                    {currentSession.duration}m
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Type:</span>
                    <span className="text-white capitalize flex items-center">
                      <span className="mr-1">{sessionTypes.find(t => t.value === currentSession.type)?.icon}</span>
                      {currentSession.type.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Mood:</span>
                      <span className="text-white">
                        {currentSession.emotionalState.baseline.mood} → {currentSession.emotionalState.target.mood}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Anxiety:</span>
                      <span className="text-white">
                        {currentSession.emotionalState.baseline.anxiety} → {currentSession.emotionalState.target.anxiety}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Stress:</span>
                      <span className="text-white">
                        {currentSession.emotionalState.baseline.stress} → {currentSession.emotionalState.target.stress}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Session Controls */}
                <div className="flex space-x-2 pt-4">
                  {currentSession.status === 'active' && (
                    <Button
                      onClick={pauseSession}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700"
                    >
                      {isLoading ? 'Pausing...' : 'Pause'}
                    </Button>
                  )}
                  {currentSession.status === 'paused' && (
                    <Button
                      onClick={resumeSession}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? 'Resuming...' : 'Resume'}
                    </Button>
                  )}
                  <Button
                    onClick={stopSession}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? 'Stopping...' : 'Stop'}
                  </Button>
                </div>

                {/* Progress Visualization */}
                <div className="space-y-2">
                  <div className="text-xs text-slate-400">Emotional Progress</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-400">
                        {Math.round(((currentSession.emotionalState.target.mood - currentSession.emotionalState.baseline.mood) / currentSession.emotionalState.baseline.mood) * 100)}%
                      </div>
                      <div className="text-xs text-slate-400">Mood Improvement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-400">
                        {currentSession.duration}m
                      </div>
                      <div className="text-xs text-slate-400">Duration</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">No active emotional intelligence session</div>
                <Button
                  onClick={startSession}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Starting...' : 'Start Session'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Sessions Today', value: '2', change: '+1', icon: '🎯' },
          { label: 'Avg Mood Score', value: '7.8', change: '+0.5', icon: '😊' },
          { label: 'Anxiety Reduction', value: '23%', change: '+8%', icon: '🧘' },
          { label: 'Empathy Growth', value: '15%', change: '+5%', icon: '🤝' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-slate-400">{stat.label}</div>
                  <div className="text-xs text-green-400 mt-1">{stat.change}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}