'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AmbientEnvironment {
  id: string;
  name: string;
  type: string;
  focusBoost: number;
  stressReduction: number;
  flowInduction: number;
  isSelected: boolean;
}

interface MeditationProtocol {
  id: string;
  name: string;
  duration: number;
  difficulty: string;
  isSelected: boolean;
}

export function DeepWorkEnvironmentInterface() {
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [environments, setEnvironments] = useState<AmbientEnvironment[]>([]);
  const [protocols, setProtocols] = useState<MeditationProtocol[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedProtocol, setSelectedProtocol] = useState<string>('');
  const [timeDilation, setTimeDilation] = useState(1.5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Sample environments
    const sampleEnvironments: AmbientEnvironment[] = [
      {
        id: 'forest-glade',
        name: 'Forest Glade',
        type: 'nature',
        focusBoost: 8,
        stressReduction: 9,
        flowInduction: 9,
        isSelected: true,
      },
      {
        id: 'ocean-depths',
        name: 'Ocean Depths',
        type: 'underwater',
        focusBoost: 7,
        stressReduction: 10,
        flowInduction: 8,
        isSelected: false,
      },
      {
        id: 'space-station',
        name: 'Space Station',
        type: 'space',
        focusBoost: 10,
        stressReduction: 6,
        flowInduction: 7,
        isSelected: false,
      },
      {
        id: 'medieval-library',
        name: 'Medieval Library',
        type: 'medieval',
        focusBoost: 8,
        stressReduction: 7,
        flowInduction: 9,
        isSelected: false,
      },
    ];

    // Sample protocols
    const sampleProtocols: MeditationProtocol[] = [
      {
        id: 'mindful-breathing',
        name: 'Mindful Breathing',
        duration: 10,
        difficulty: 'beginner',
        isSelected: true,
      },
      {
        id: 'deep-focus',
        name: 'Deep Focus Meditation',
        duration: 20,
        difficulty: 'intermediate',
        isSelected: false,
      },
      {
        id: 'flow-induction',
        name: 'Flow State Induction',
        duration: 30,
        difficulty: 'advanced',
        isSelected: false,
      },
    ];

    setEnvironments(sampleEnvironments);
    setProtocols(sampleProtocols);
    setSelectedEnvironment(sampleEnvironments[0].id);
    setSelectedProtocol(sampleProtocols[0].id);
  }, []);

  const startEnvironment = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));

      const environment = environments.find(env => env.id === selectedEnvironment);
      const protocol = protocols.find(p => p.id === selectedProtocol);

      setCurrentSession({
        id: `env_${Date.now()}`,
        environment: environment?.name,
        protocol: protocol?.name,
        timeDilation,
        startTime: new Date(),
        status: 'active',
      });
    } catch (error) {
      console.error('Failed to start environment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const stopEnvironment = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (currentSession) {
        setCurrentSession({
          ...currentSession,
          status: 'completed',
        });
      }

      setTimeout(() => setCurrentSession(null), 2000);
    } catch (error) {
      console.error('Failed to stop environment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentIcon = (type: string) => {
    switch (type) {
      case 'nature': return '🌲';
      case 'underwater': return '🌊';
      case 'space': return '🚀';
      case 'medieval': return '🏰';
      default: return '🏞️';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-600';
      case 'intermediate': return 'bg-yellow-600';
      case 'advanced': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Deep Work Environment</h2>
          <p className="text-slate-400">Immersive environments for enhanced focus and productivity</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Environment Selection */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Choose Environment</CardTitle>
              <CardDescription className="text-slate-300">
                Select an ambient environment for your deep work session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {environments.map((env) => (
                  <div
                    key={env.id}
                    onClick={() => setSelectedEnvironment(env.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedEnvironment === env.id
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{getEnvironmentIcon(env.type)}</span>
                      <Badge className={getDifficultyColor('beginner')}>
                        {env.type}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-white mb-2">{env.name}</h3>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300">Focus:</span>
                        <span className="text-white">{env.focusBoost}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Stress Relief:</span>
                        <span className="text-white">{env.stressReduction}/10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-300">Flow Induction:</span>
                        <span className="text-white">{env.flowInduction}/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Meditation Protocols */}
          <Card className="bg-slate-700 border-slate-600 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Meditation Protocols</CardTitle>
              <CardDescription className="text-slate-300">
                Optional guided meditation for enhanced focus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {protocols.map((protocol) => (
                  <div
                    key={protocol.id}
                    onClick={() => setSelectedProtocol(protocol.id)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedProtocol === protocol.id
                        ? 'bg-purple-600 border-2 border-purple-400'
                        : 'bg-slate-600 hover:bg-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-white">{protocol.name}</h3>
                        <div className="text-sm text-slate-300">
                          {protocol.duration} minutes • {protocol.difficulty}
                        </div>
                      </div>
                      <Badge className={getDifficultyColor(protocol.difficulty)}>
                        {protocol.difficulty}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div>
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Session Control</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time Dilation */}
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Time Dilation: {timeDilation}x
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={timeDilation}
                    onChange={(e) => setTimeDilation(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>1.0x (Real)</span>
                    <span>2.0x (Max)</span>
                  </div>
                </div>
              </div>

              {/* Session Status */}
              {currentSession ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-600">
                        {currentSession.status.toUpperCase()}
                      </Badge>
                      <span className="text-slate-300 text-sm">
                        {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)}m
                      </span>
                    </div>
                    <div className="text-sm text-white">
                      Environment: {currentSession.environment}
                    </div>
                    {currentSession.protocol && (
                      <div className="text-sm text-slate-300">
                        Protocol: {currentSession.protocol}
                      </div>
                    )}
                    <div className="text-sm text-blue-400">
                      Time Dilation: {currentSession.timeDilation}x
                    </div>
                  </div>

                  <Button
                    onClick={stopEnvironment}
                    disabled={isLoading}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    {isLoading ? 'Stopping...' : 'Stop Environment'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={startEnvironment}
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isLoading ? 'Starting...' : 'Start Environment'}
                </Button>
              )}

              {/* Quick Stats */}
              <div className="pt-4 border-t border-slate-600">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Sessions Today:</span>
                    <span className="text-white">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg. Focus Score:</span>
                    <span className="text-green-400">87%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Time Saved:</span>
                    <span className="text-blue-400">2.4h</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}