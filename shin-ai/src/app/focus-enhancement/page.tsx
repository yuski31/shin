'use client';

import React, { useState, useEffect } from 'react';
import { FocusEnhancementControlPanel } from '../../components/focus-enhancement/FocusEnhancementControlPanel';
import { AttentionMetricsDashboard } from '../../components/focus-enhancement/AttentionMetricsDashboard';
import { SessionScheduler } from '../../components/focus-enhancement/SessionScheduler';
import { DistractionBlockerInterface } from '../../components/focus-enhancement/DistractionBlockerInterface';
import { DeepWorkEnvironmentInterface } from '../../components/focus-enhancement/DeepWorkEnvironmentInterface';

export default function FocusEnhancementPage() {
  const [activeTab, setActiveTab] = useState<'control' | 'dashboard' | 'scheduler' | 'blocking' | 'environment'>('control');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Focus Enhancement Protocol
          </h1>
          <p className="text-slate-300 text-lg">
            Advanced cognitive tools for achieving deep work and flow states
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-8 bg-slate-800 p-1 rounded-lg">
          {[
            { id: 'control', label: 'Control Panel', icon: '🎛️' },
            { id: 'dashboard', label: 'Metrics Dashboard', icon: '📊' },
            { id: 'scheduler', label: 'Session Scheduler', icon: '⏰' },
            { id: 'blocking', label: 'Distraction Blocker', icon: '🚫' },
            { id: 'environment', label: 'Deep Work Environment', icon: '🌊' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-200 flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Active Component */}
        <div className="bg-slate-800 rounded-xl p-6 shadow-2xl">
          {activeTab === 'control' && <FocusEnhancementControlPanel />}
          {activeTab === 'dashboard' && <AttentionMetricsDashboard />}
          {activeTab === 'scheduler' && <SessionScheduler />}
          {activeTab === 'blocking' && <DistractionBlockerInterface />}
          {activeTab === 'environment' && <DeepWorkEnvironmentInterface />}
        </div>
      </div>
    </div>
  );
}