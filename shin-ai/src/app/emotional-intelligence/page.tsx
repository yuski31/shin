'use client';

import React, { useState } from 'react';
import { EmotionalIntelligenceControlPanel } from '@/components/emotional-intelligence/EmotionalIntelligenceControlPanel';
import { MoodMetricsDashboard } from '@/components/emotional-intelligence/MoodMetricsDashboard';
import { EmpathyAmplifierInterface } from '@/components/emotional-intelligence/EmpathyAmplifierInterface';

export default function EmotionalIntelligencePage() {
  const [activeTab, setActiveTab] = useState<'control' | 'mood' | 'empathy'>('control');

  return (
    <div className="min-h-screen bg-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Emotional Intelligence Maximizer
          </h1>
          <p className="text-xl text-slate-400">
            Phase 34: Cognitive Enhancement & Brain Augmentation
          </p>
          <div className="mt-4 flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">System Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              <span className="text-sm text-blue-400">AI Processing Active</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
              <span className="text-sm text-purple-400">Neural Simulation Ready</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-700 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('control')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'control'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              <span>🎛️</span>
              <span>Control Panel</span>
            </button>
            <button
              onClick={() => setActiveTab('mood')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'mood'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              <span>📊</span>
              <span>Mood Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('empathy')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'empathy'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-600'
              }`}
            >
              <span>🤝</span>
              <span>Empathy Amplifier</span>
            </button>
          </div>
        </div>

        {/* Active Component */}
        <div className="transition-all duration-300">
          {activeTab === 'control' && <EmotionalIntelligenceControlPanel />}
          {activeTab === 'mood' && <MoodMetricsDashboard />}
          {activeTab === 'empathy' && <EmpathyAmplifierInterface />}
        </div>

        {/* Safety Notice */}
        <div className="mt-12 p-4 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
          <div className="flex items-start space-x-3">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div>
              <div className="text-sm font-medium text-yellow-400 mb-1">Safety & Ethics Notice</div>
              <div className="text-sm text-slate-300">
                This Emotional Intelligence Maximizer operates within strict ethical boundaries. All interventions are software-based and focused on behavioral therapy and emotional support. If you experience a mental health crisis, please contact a licensed healthcare professional or emergency services immediately.
              </div>
              <div className="mt-2 text-xs text-slate-400">
                Crisis Resources: National Suicide Prevention Lifeline (988) | Crisis Text Line (Text HOME to 741741)
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700 rounded-lg">
            <div className="text-sm font-medium text-white mb-2">Neural Processing</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Status</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-400">Active</span>
              </div>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Processing Power</span>
                <span>87%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1">
                <div className="bg-green-400 h-1 rounded-full" style={{ width: '87%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-700 rounded-lg">
            <div className="text-sm font-medium text-white mb-2">Emotional Database</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Records</span>
              <span className="text-sm text-blue-400">1,247</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Storage Used</span>
                <span>23%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1">
                <div className="bg-blue-400 h-1 rounded-full" style={{ width: '23%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-700 rounded-lg">
            <div className="text-sm font-medium text-white mb-2">Session Analytics</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">Success Rate</span>
              <span className="text-sm text-purple-400">94%</span>
            </div>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Improvement Trend</span>
                <span>+12%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-1">
                <div className="bg-purple-400 h-1 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}