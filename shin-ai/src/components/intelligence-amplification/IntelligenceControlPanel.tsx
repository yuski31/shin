'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';

interface EnhancementSettings {
  intensity: number;
  frequency: number;
  duration: number;
  focusAreas: string[];
  safetyLimits: {
    maxIntensity: number;
    maxDuration: number;
    minRestPeriod: number;
  };
}

interface CognitiveMetrics {
  neuralActivity: number;
  cognitiveLoad: number;
  performanceScore: number;
  stressLevel: number;
  focusQuality: number;
}

interface SafetyStatus {
  isSafe: boolean;
  warnings: string[];
  emergencyStop: boolean;
  lastSafetyCheck: Date;
}

export default function IntelligenceControlPanel() {
  const [settings, setSettings] = useState<EnhancementSettings>({
    intensity: 5,
    frequency: 10,
    duration: 30,
    focusAreas: ['problem-solving', 'creativity'],
    safetyLimits: {
      maxIntensity: 8,
      maxDuration: 60,
      minRestPeriod: 4
    }
  });

  const [metrics, setMetrics] = useState<CognitiveMetrics>({
    neuralActivity: 0,
    cognitiveLoad: 0,
    performanceScore: 0,
    stressLevel: 0,
    focusQuality: 0
  });

  const [safetyStatus, setSafetyStatus] = useState<SafetyStatus>({
    isSafe: true,
    warnings: [],
    emergencyStop: false,
    lastSafetyCheck: new Date()
  });

  const [isActive, setIsActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<string>('idle');

  // Simulate real-time metrics updates
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        neuralActivity: Math.max(0, Math.min(100, prev.neuralActivity + (Math.random() - 0.5) * 10)),
        cognitiveLoad: Math.max(0, Math.min(100, prev.cognitiveLoad + (Math.random() - 0.5) * 5)),
        performanceScore: Math.max(0, Math.min(100, prev.performanceScore + (Math.random() - 0.3) * 15)),
        stressLevel: Math.max(0, Math.min(100, prev.stressLevel + (Math.random() - 0.5) * 3)),
        focusQuality: Math.max(0, Math.min(100, prev.focusQuality + (Math.random() - 0.4) * 8))
      }));

      // Check safety status
      checkSafetyStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  const checkSafetyStatus = () => {
    const warnings: string[] = [];

    if (metrics.stressLevel > 80) {
      warnings.push('High stress level detected');
    }
    if (metrics.cognitiveLoad > 90) {
      warnings.push('Cognitive overload warning');
    }
    if (settings.intensity > settings.safetyLimits.maxIntensity) {
      warnings.push('Intensity exceeds safety limits');
    }

    setSafetyStatus(prev => ({
      ...prev,
      isSafe: warnings.length === 0,
      warnings,
      lastSafetyCheck: new Date()
    }));
  };

  const handleStartEnhancement = () => {
    setIsActive(true);
    setCurrentPhase('initialization');
    // Simulate phase progression
    setTimeout(() => setCurrentPhase('stimulation'), 3000);
    setTimeout(() => setCurrentPhase('integration'), 8000);
    setTimeout(() => setCurrentPhase('assessment'), 15000);
    setTimeout(() => setCurrentPhase('cooldown'), 20000);
  };

  const handleStopEnhancement = () => {
    setIsActive(false);
    setCurrentPhase('idle');
    setSafetyStatus(prev => ({ ...prev, emergencyStop: true }));
  };

  const handleEmergencyStop = () => {
    setIsActive(false);
    setCurrentPhase('emergency-stop');
    setSafetyStatus(prev => ({ ...prev, emergencyStop: true }));
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Intelligence Amplification Control Panel</h1>
        <div className="flex items-center space-x-4">
          <Badge variant={safetyStatus.isSafe ? "default" : "destructive"}>
            {safetyStatus.isSafe ? "Safe" : "Warning"}
          </Badge>
          <Badge variant={isActive ? "default" : "secondary"}>
            {currentPhase}
          </Badge>
        </div>
      </div>

      {safetyStatus.warnings.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Safety Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside text-yellow-700">
              {safetyStatus.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="controls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="safety">Safety</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="controls" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Enhancement Settings</CardTitle>
                <CardDescription>Configure your intelligence amplification parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Intensity</label>
                  <Slider
                    value={[settings.intensity]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, intensity: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Gentle</span>
                    <span className="font-medium">{settings.intensity}/10</span>
                    <span>Intense</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Frequency (Hz)</label>
                  <Slider
                    value={[settings.frequency]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, frequency: value[0] }))}
                    max={40}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 Hz</span>
                    <span className="font-medium">{settings.frequency} Hz</span>
                    <span>40 Hz</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Slider
                    value={[settings.duration]}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, duration: value[0] }))}
                    max={120}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5 min</span>
                    <span className="font-medium">{settings.duration} min</span>
                    <span>120 min</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Focus Areas</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['problem-solving', 'creativity', 'memory', 'focus', 'learning'].map(area => (
                      <Badge
                        key={area}
                        variant={settings.focusAreas.includes(area) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSettings(prev => ({
                            ...prev,
                            focusAreas: prev.focusAreas.includes(area)
                              ? prev.focusAreas.filter(a => a !== area)
                              : [...prev.focusAreas, area]
                          }));
                        }}
                      >
                        {area}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Session Control</CardTitle>
                <CardDescription>Start, pause, and stop enhancement sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Button
                    onClick={handleStartEnhancement}
                    disabled={isActive || safetyStatus.emergencyStop}
                    className="flex-1"
                  >
                    Start Enhancement
                  </Button>
                  <Button
                    onClick={() => setIsActive(!isActive)}
                    disabled={!isActive}
                    variant="outline"
                  >
                    {isActive ? 'Pause' : 'Resume'}
                  </Button>
                  <Button
                    onClick={handleStopEnhancement}
                    disabled={!isActive}
                    variant="destructive"
                  >
                    Stop
                  </Button>
                </div>

                <Button
                  onClick={handleEmergencyStop}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  Emergency Stop
                </Button>

                <div className="text-sm text-gray-600">
                  <p><strong>Current Phase:</strong> {currentPhase}</p>
                  <p><strong>Duration:</strong> {settings.duration} minutes</p>
                  <p><strong>Focus Areas:</strong> {settings.focusAreas.join(', ')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Neural Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{metrics.neuralActivity.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.neuralActivity}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Cognitive Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{metrics.cognitiveLoad.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.cognitiveLoad}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{metrics.performanceScore.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.performanceScore}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stress Level</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{metrics.stressLevel.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.stressLevel}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Focus Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{metrics.focusQuality.toFixed(1)}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ width: `${metrics.focusQuality}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Real-time Metrics Graph</CardTitle>
              <CardDescription>Live visualization of cognitive enhancement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Advanced visualization component would render here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Safety Limits</CardTitle>
                <CardDescription>Configure safety thresholds for enhancement sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Maximum Intensity</label>
                  <Slider
                    value={[settings.safetyLimits.maxIntensity]}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      safetyLimits: { ...prev.safetyLimits, maxIntensity: value[0] }
                    }))}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{settings.safetyLimits.maxIntensity}/10</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Maximum Duration (minutes)</label>
                  <Slider
                    value={[settings.safetyLimits.maxDuration]}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      safetyLimits: { ...prev.safetyLimits, maxDuration: value[0] }
                    }))}
                    max={180}
                    min={5}
                    step={5}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{settings.safetyLimits.maxDuration} minutes</div>
                </div>

                <div>
                  <label className="text-sm font-medium">Minimum Rest Period (hours)</label>
                  <Slider
                    value={[settings.safetyLimits.minRestPeriod]}
                    onValueChange={(value) => setSettings(prev => ({
                      ...prev,
                      safetyLimits: { ...prev.safetyLimits, minRestPeriod: value[0] }
                    }))}
                    max={24}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="text-xs text-gray-500 mt-1">{settings.safetyLimits.minRestPeriod} hours</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consent & Ethics</CardTitle>
                <CardDescription>Ensure ethical use of intelligence amplification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">I understand the experimental nature of this technology</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">I consent to neural stimulation simulation</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">I agree to stop if I experience discomfort</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">I will not operate heavy machinery during sessions</span>
                  </label>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-600">
                    <strong>Emergency Contacts:</strong><br />
                    Medical: +1 (555) 123-4567<br />
                    Support: +1 (555) 987-6543
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Sessions:</span>
                  <span className="font-medium">24</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Success Rate:</span>
                  <span className="font-medium text-green-600">92%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Avg Improvement:</span>
                  <span className="font-medium text-blue-600">+18%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Total Time:</span>
                  <span className="font-medium">12h 34m</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-gradient-to-t from-green-100 to-blue-100 rounded-lg flex items-end justify-center p-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">↗ 23%</div>
                    <div className="text-xs text-gray-600">This Week</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Achievement Badges</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Badge className="w-full justify-center">🧠 First Session</Badge>
                <Badge className="w-full justify-center">⚡ Intensity Master</Badge>
                <Badge className="w-full justify-center">🎯 Focus Achiever</Badge>
                <Badge className="w-full justify-center">📈 Performance Elite</Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}