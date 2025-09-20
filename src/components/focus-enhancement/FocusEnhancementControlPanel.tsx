'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';

interface FocusSession {
  id: string;
  type: 'deep-work' | 'flow-state' | 'meditation' | 'attention-training';
  status: 'active' | 'paused' | 'completed';
  duration: number;
  intensity: number;
  focusMode: string;
}

export function FocusEnhancementControlPanel() {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [sessionType, setSessionType] = useState<FocusSession['type']>('deep-work');
  const [intensity, setIntensity] = useState(5);
  const [duration, setDuration] = useState(60);
  const [focusMode, setFocusMode] = useState('ambient-enhancement');
  const [isLoading, setIsLoading] = useState(false);

  const sessionTypes = [
    { value: 'deep-work', label: 'Deep Work', description: 'Intense focus for complex tasks' },
    { value: 'flow-state', label: 'Flow State', description: 'Optimal performance and creativity' },
    { value: 'meditation', label: 'Meditation', description: 'Mindfulness and mental clarity' },
    { value: 'attention-training', label: 'Attention Training', description: 'Build focus endurance' },
  ];

  const focusModes = [
    { value: 'time-dilation', label: 'Time Dilation', description: 'Perceived time expansion' },
    { value: 'meditation-guided', label: 'Guided Meditation', description: 'Structured mindfulness' },
    { value: 'ambient-enhancement', label: 'Ambient Enhancement', description: 'Environmental optimization' },
    { value: 'distraction-blocking', label: 'Distraction Blocking', description: 'Pure focus isolation' },
  ];

  const startSession = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSession: FocusSession = {
        id: `session_${Date.now()}`,
        type: sessionType,
        status: 'active',
        duration,
        intensity,
        focusMode,
      };

      setCurrentSession(newSession);
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
              Configure your focus enhancement session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Session Type */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2">
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
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs opacity-75">{type.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Mode */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Focus Mode
              </label>
              <div className="grid grid-cols-1 gap-2">
                {focusModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setFocusMode(mode.value)}
                    className={`p-3 rounded-lg text-left transition-colors ${
                      focusMode === mode.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                    }`}
                  >
                    <div className="font-medium">{mode.label}</div>
                    <div className="text-xs opacity-75">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Intensity */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Intensity: {intensity}/10
              </label>
              <Slider
                value={[intensity]}
                onValueChange={(value) => setIntensity(value[0])}
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>Gentle</span>
                <span>Intense</span>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Duration: {duration} minutes
              </label>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                max={480}
                min={5}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 min</span>
                <span>8 hours</span>
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
                    {Math.floor(currentSession.duration / 60)}h {currentSession.duration % 60}m
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Type:</span>
                    <span className="text-white capitalize">{currentSession.type.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Mode:</span>
                    <span className="text-white capitalize">{currentSession.focusMode.replace('-', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">Intensity:</span>
                    <span className="text-white">{currentSession.intensity}/10</span>
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

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Progress</span>
                    <span>Simulated</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: '73%' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-slate-400 mb-4">No active session</div>
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
          { label: 'Sessions Today', value: '3', change: '+1' },
          { label: 'Average Focus Score', value: '87%', change: '+5%' },
          { label: 'Distractions Blocked', value: '24', change: '+12' },
          { label: 'Time in Flow', value: '4.2h', change: '+0.8h' },
        ].map((stat) => (
          <Card key={stat.label} className="bg-slate-700 border-slate-600">
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
              <div className="text-xs text-green-400 mt-1">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}