'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ScheduledSession {
  id: string;
  type: 'deep-work' | 'flow-state' | 'meditation' | 'attention-training';
  date: Date;
  duration: number; // minutes
  focusMode: string;
  intensity: number;
  status: 'scheduled' | 'active' | 'completed' | 'missed';
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[]; // 0-6, Sunday-Saturday
    endDate?: Date;
  };
}

interface TimeSlot {
  hour: number;
  label: string;
  sessions: ScheduledSession[];
}

export function SessionScheduler() {
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);

  // Generate sample scheduled sessions
  useEffect(() => {
    const sampleSessions: ScheduledSession[] = [
      {
        id: '1',
        type: 'deep-work',
        date: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        duration: 90,
        focusMode: 'time-dilation',
        intensity: 8,
        status: 'scheduled',
      },
      {
        id: '2',
        type: 'meditation',
        date: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
        duration: 30,
        focusMode: 'meditation-guided',
        intensity: 5,
        status: 'scheduled',
        recurring: {
          frequency: 'daily',
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      {
        id: '3',
        type: 'flow-state',
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
        duration: 120,
        focusMode: 'ambient-enhancement',
        intensity: 7,
        status: 'scheduled',
      },
    ];

    setScheduledSessions(sampleSessions);
  }, []);

  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const ampm = hour < 12 ? 'AM' : 'PM';

      slots.push({
        hour,
        label: `${hour12}:00 ${ampm}`,
        sessions: scheduledSessions.filter(session =>
          session.date.getHours() === hour &&
          session.date.toDateString() === selectedDate.toDateString()
        ),
      });
    }
    return slots;
  };

  const getStatusColor = (status: ScheduledSession['status']) => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'scheduled': return 'bg-blue-600';
      case 'completed': return 'bg-gray-600';
      case 'missed': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  const getTypeIcon = (type: ScheduledSession['type']) => {
    switch (type) {
      case 'deep-work': return '🎯';
      case 'flow-state': return '🌊';
      case 'meditation': return '🧘';
      case 'attention-training': return '🎪';
      default: return '⚡';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getUpcomingSessions = () => {
    return scheduledSessions
      .filter(session => session.date > new Date())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  };

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
          <p className="text-slate-400">
            Schedule your focus enhancement sessions
          </p>
        </div>
        <Button
          onClick={() => setShowNewSessionModal(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          + New Session
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Schedule */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Daily Schedule</CardTitle>
              <CardDescription className="text-slate-300">
                Your focus sessions for the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {getTimeSlots().map((slot) => (
                  <div key={slot.hour} className="flex items-center space-x-4 p-2 hover:bg-slate-600 rounded-lg">
                    <div className="w-16 text-sm text-slate-400 font-mono">
                      {slot.label}
                    </div>
                    <div className="flex-1">
                      {slot.sessions.length > 0 ? (
                        <div className="space-y-1">
                          {slot.sessions.map((session) => (
                            <div
                              key={session.id}
                              className={`p-2 rounded-lg border-l-4 ${getStatusColor(session.status)} border-purple-500 bg-slate-600`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <span>{getTypeIcon(session.type)}</span>
                                  <span className="font-medium text-white capitalize">
                                    {session.type.replace('-', ' ')}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {session.focusMode}
                                  </Badge>
                                </div>
                                <div className="text-right text-sm">
                                  <div className="text-white">
                                    {formatDuration(session.duration)}
                                  </div>
                                  <div className="text-slate-400">
                                    Intensity: {session.intensity}/10
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500 text-sm italic">
                          No sessions scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">Upcoming</CardTitle>
              <CardDescription className="text-slate-300">
                Next 5 scheduled sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingSessions().map((session) => (
                  <div key={session.id} className="p-3 bg-slate-600 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white">
                        {session.type.replace('-', ' ')}
                      </span>
                      <Badge className={`${getStatusColor(session.status)}`}>
                        {session.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-slate-300">
                      {session.date.toLocaleDateString()} at{' '}
                      {session.date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {formatDuration(session.duration)} • {session.focusMode}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Session Statistics */}
          <Card className="bg-slate-700 border-slate-600">
            <CardHeader>
              <CardTitle className="text-white">This Week</CardTitle>
              <CardDescription className="text-slate-300">
                Session statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-300">Scheduled</span>
                  <span className="text-white font-medium">
                    {scheduledSessions.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Completed</span>
                  <span className="text-green-400 font-medium">
                    {scheduledSessions.filter(s => s.status === 'completed').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Total Time</span>
                  <span className="text-white font-medium">
                    {Math.floor(scheduledSessions.reduce((sum, s) => sum + s.duration, 0) / 60)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Success Rate</span>
                  <span className="text-blue-400 font-medium">
                    85%
                  </span>
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
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Add logic for deep work session
                  }}
                >
                  🎯 Quick Deep Work (25m)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Add logic for meditation session
                  }}
                >
                  🧘 Quick Meditation (10m)
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    // Add logic for break reminder
                  }}
                >
                  ⏰ Schedule Break
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}