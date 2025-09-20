'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface XRSession {
  id: string;
  title: string;
  description?: string;
  sessionType: 'mixed-reality' | 'haptic-feedback' | 'digital-human' | 'collaborative';
  status: 'active' | 'paused' | 'completed' | 'archived';
  participants: string[];
  settings: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    maxParticipants: number;
    duration: number;
    recording: boolean;
    streaming: boolean;
  };
  createdAt: string;
}

interface XRSessionManagerProps {
  onSessionCreate?: (session: XRSession) => void;
  onSessionSelect?: (session: XRSession) => void;
}

export const XRSessionManager: React.FC<XRSessionManagerProps> = ({
  onSessionCreate,
  onSessionSelect,
}) => {
  const [sessions, setSessions] = useState<XRSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockSessions: XRSession[] = [
      {
        id: '1',
        title: 'Mixed Reality Training Session',
        description: 'Interactive training session with holographic displays',
        sessionType: 'mixed-reality',
        status: 'active',
        participants: ['user1', 'user2'],
        settings: {
          quality: 'high',
          maxParticipants: 10,
          duration: 60,
          recording: true,
          streaming: false,
        },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Haptic Feedback Demo',
        description: 'Demonstration of haptic feedback capabilities',
        sessionType: 'haptic-feedback',
        status: 'completed',
        participants: ['user1'],
        settings: {
          quality: 'medium',
          maxParticipants: 5,
          duration: 30,
          recording: false,
          streaming: true,
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
    ];

    setSessions(mockSessions);
    setLoading(false);
  }, []);

  const handleCreateSession = async (sessionData: Partial<XRSession>) => {
    try {
      const newSession: XRSession = {
        id: Date.now().toString(),
        title: sessionData.title || 'New XR Session',
        description: sessionData.description,
        sessionType: sessionData.sessionType || 'mixed-reality',
        status: 'active',
        participants: sessionData.participants || [],
        settings: {
          quality: 'medium',
          maxParticipants: 10,
          duration: 60,
          recording: false,
          streaming: false,
          ...sessionData.settings,
        },
        createdAt: new Date().toISOString(),
      };

      setSessions(prev => [newSession, ...prev]);
      setShowCreateModal(false);
      onSessionCreate?.(newSession);
    } catch (error) {
      console.error('Error creating XR session:', error);
    }
  };

  const getStatusColor = (status: XRSession['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'paused':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-blue-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: XRSession['sessionType']) => {
    switch (type) {
      case 'mixed-reality':
        return '🕶️';
      case 'haptic-feedback':
        return '🤲';
      case 'digital-human':
        return '🤖';
      case 'collaborative':
        return '👥';
      default:
        return '📱';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">XR Sessions</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          Create Session
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSessionSelect?.(session)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-2xl">{getTypeIcon(session.sessionType)}</div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(session.status)}`}></div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-2">{session.title}</h3>
            {session.description && (
              <p className="text-gray-600 text-sm mb-3">{session.description}</p>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{session.participants.length} participants</span>
              <span>{new Date(session.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                {session.sessionType.replace('-', ' ')}
              </span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {session.settings.quality}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🕶️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No XR Sessions</h3>
          <p className="text-gray-600 mb-4">Create your first XR session to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Session
          </button>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <CreateSessionModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateSession}
        />
      )}
    </div>
  );
};

interface CreateSessionModalProps {
  onClose: () => void;
  onCreate: (session: Partial<XRSession>) => void;
}

const CreateSessionModal: React.FC<CreateSessionModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sessionType: 'mixed-reality' as XRSession['sessionType'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create XR Session</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <select
              value={formData.sessionType}
              onChange={(e) => setFormData(prev => ({ ...prev, sessionType: e.target.value as XRSession['sessionType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mixed-reality">Mixed Reality</option>
              <option value="haptic-feedback">Haptic Feedback</option>
              <option value="digital-human">Digital Human</option>
              <option value="collaborative">Collaborative</option>
            </select>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create Session
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};