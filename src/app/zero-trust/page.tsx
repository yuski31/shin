'use client';

import React, { useState, useEffect } from 'react';

interface SecurityPolicy {
  id: string;
  name: string;
  description?: string;
  policyType: 'access_control' | 'data_protection' | 'threat_detection' | 'compliance';
  status: 'active' | 'draft' | 'archived';
  priority: number;
  effect: 'allow' | 'deny' | 'challenge' | 'monitor';
  target: {
    services: string[];
    endpoints: string[];
    resources: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface PolicyEvaluation {
  decision: 'allow' | 'deny' | 'challenge' | 'monitor';
  obligations: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  advice: Array<{
    type: string;
    message: string;
  }>;
  justification: string;
  confidence: number;
  evaluatedAt: string;
}

export default function ZeroTrustPage() {
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<PolicyEvaluation | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<SecurityPolicy | null>(null);

  // Mock data
  useEffect(() => {
    const mockPolicies: SecurityPolicy[] = [
      {
        id: '1',
        name: 'Standard API Access Policy',
        description: 'Default policy for API access with basic authentication',
        policyType: 'access_control',
        status: 'active',
        priority: 100,
        effect: 'allow',
        target: {
          services: ['api', 'web'],
          endpoints: ['/api/*'],
          resources: ['user_data', 'public_data'],
        },
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Sensitive Data Protection Policy',
        description: 'Enhanced protection for sensitive data with MFA requirements',
        policyType: 'data_protection',
        status: 'active',
        priority: 200,
        effect: 'challenge',
        target: {
          services: ['database', 'storage'],
          endpoints: ['/api/sensitive/*'],
          resources: ['financial_data', 'personal_data'],
        },
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        name: 'Threat Detection Policy',
        description: 'Automated threat detection and response policy',
        policyType: 'threat_detection',
        status: 'active',
        priority: 300,
        effect: 'monitor',
        target: {
          services: ['all'],
          endpoints: ['/*'],
          resources: ['*'],
        },
        createdAt: new Date(Date.now() - 259200000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    setPolicies(mockPolicies);
    setLoading(false);
  }, []);

  const handleCreatePolicy = async (policyData: Partial<SecurityPolicy>) => {
    try {
      const response = await fetch('/api/zero-trust/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(policyData),
      });

      const result = await response.json();

      if (response.ok) {
        setPolicies(prev => [result, ...prev]);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
    }
  };

  const handleEvaluatePolicy = async () => {
    try {
      const policyRequest = {
        subject: {
          userId: 'user-123',
          roles: ['user'],
          riskScore: 25,
        },
        resource: {
          type: 'api',
          classification: 'public',
        },
        action: {
          method: 'GET',
          endpoint: '/api/users',
        },
        context: {
          timeOfDay: ['09:00', '17:00'],
          location: ['office'],
          deviceType: ['desktop'],
          networkType: ['trusted'],
        },
      };

      const response = await fetch('/api/zero-trust/policies/evaluate', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ policyRequest }),
      });

      const result = await response.json();

      if (result.success) {
        setEvaluationResult(result.data);
      }
    } catch (error) {
      console.error('Error evaluating policy:', error);
    }
  };

  const getStatusColor = (status: SecurityPolicy['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'draft':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getEffectColor = (effect: SecurityPolicy['effect']) => {
    switch (effect) {
      case 'allow':
        return 'bg-green-100 text-green-800';
      case 'deny':
        return 'bg-red-100 text-red-800';
      case 'challenge':
        return 'bg-yellow-100 text-yellow-800';
      case 'monitor':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Zero Trust Security Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Comprehensive security with identity management, policy engines, and threat intelligence
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Policies Management */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Security Policies</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Create Policy
              </button>
            </div>

            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPolicy(policy)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{policy.name}</h3>
                      {policy.description && (
                        <p className="text-sm text-gray-600 mt-1">{policy.description}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(policy.status)}`}></div>
                      <span className={`px-2 py-1 rounded text-xs ${getEffectColor(policy.effect)}`}>
                        {policy.effect}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Priority: {policy.priority}</span>
                    <span>{policy.target.services.length} services</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Policy Evaluation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Policy Evaluation</h2>

            <div className="space-y-4">
              <button
                onClick={handleEvaluatePolicy}
                className="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors"
              >
                Evaluate Policies
              </button>

              {evaluationResult && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Evaluation Result</h3>
                    <span className={`px-3 py-1 rounded text-sm ${
                      evaluationResult.decision === 'allow'
                        ? 'bg-green-100 text-green-800'
                        : evaluationResult.decision === 'deny'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {evaluationResult.decision.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <p><strong>Confidence:</strong> {Math.round(evaluationResult.confidence * 100)}%</p>
                    <p><strong>Justification:</strong> {evaluationResult.justification}</p>

                    {evaluationResult.obligations.length > 0 && (
                      <div>
                        <strong>Obligations:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {evaluationResult.obligations.map((obligation, index) => (
                            <li key={index}>{obligation.type}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {evaluationResult.advice.length > 0 && (
                      <div>
                        <strong>Advice:</strong>
                        <ul className="list-disc list-inside mt-1">
                          {evaluationResult.advice.map((advice, index) => (
                            <li key={index}>{advice.message}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Dashboard */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Dashboard</h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{policies.length}</div>
                <p className="text-sm text-blue-800">Active Policies</p>
              </div>

              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">98.5%</div>
                <p className="text-sm text-green-800">Compliance Score</p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">12</div>
                <p className="text-sm text-yellow-800">Threats Detected</p>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">1.2k</div>
                <p className="text-sm text-purple-800">Access Requests</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Policy evaluation completed</span>
                  <span className="text-gray-500">2m ago</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>New user authentication</span>
                  <span className="text-gray-500">5m ago</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Threat intelligence updated</span>
                  <span className="text-gray-500">10m ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Create Policy Modal */}
        {showCreateModal && (
          <CreatePolicyModal
            onClose={() => setShowCreateModal(false)}
            onCreate={handleCreatePolicy}
          />
        )}
      </div>
    </div>
  );
}

interface CreatePolicyModalProps {
  onClose: () => void;
  onCreate: (policy: Partial<SecurityPolicy>) => void;
}

const CreatePolicyModal: React.FC<CreatePolicyModalProps> = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    policyType: 'access_control' as SecurityPolicy['policyType'],
    effect: 'allow' as SecurityPolicy['effect'],
    priority: 100,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      ...formData,
      target: {
        services: ['api'],
        endpoints: ['/api/*'],
        resources: ['*'],
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create Security Policy</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Policy Type
            </label>
            <select
              value={formData.policyType}
              onChange={(e) => setFormData(prev => ({ ...prev, policyType: e.target.value as SecurityPolicy['policyType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="access_control">Access Control</option>
              <option value="data_protection">Data Protection</option>
              <option value="threat_detection">Threat Detection</option>
              <option value="compliance">Compliance</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Effect
            </label>
            <select
              value={formData.effect}
              onChange={(e) => setFormData(prev => ({ ...prev, effect: e.target.value as SecurityPolicy['effect'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="allow">Allow</option>
              <option value="deny">Deny</option>
              <option value="challenge">Challenge</option>
              <option value="monitor">Monitor</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <input
              type="number"
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="1000"
            />
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
              Create Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};