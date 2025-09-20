'use client';

import React, { useState } from 'react';

interface KnowledgeExtraction {
  id: string;
  title: string;
  documentType: string;
  extractedAt: string;
  topics: string[];
  status: 'completed' | 'processing' | 'failed';
}

interface ExtractedKnowledge {
  topics: string[];
  concepts: Array<{ name: string; confidence: number; relationships: string[] }>;
  insights: Array<{ type: string; content: string; confidence: number }>;
  metadata: {
    documentType: string;
    processingTime: number;
    confidence: number;
  };
}

export default function KnowledgePage() {
  const [extractions, setExtractions] = useState<KnowledgeExtraction[]>([
    {
      id: '1',
      title: 'AI Platform Architecture',
      documentType: 'pdf',
      extractedAt: new Date(Date.now() - 86400000).toISOString(),
      topics: ['artificial intelligence', 'system architecture', 'scalability'],
      status: 'completed',
    },
    {
      id: '2',
      title: 'Security Best Practices',
      documentType: 'docx',
      extractedAt: new Date(Date.now() - 172800000).toISOString(),
      topics: ['security', 'authentication', 'zero-trust'],
      status: 'completed',
    },
  ]);

  const [extractedKnowledge, setExtractedKnowledge] = useState<ExtractedKnowledge | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setLoading(true);

    try {
      // Mock file processing
      const content = await file.text();

      const response = await fetch('/api/knowledge/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          documentType: file.type,
          title: file.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setExtractedKnowledge(result.data);

        // Add to extraction history
        const newExtraction: KnowledgeExtraction = {
          id: Date.now().toString(),
          title: file.name,
          documentType: file.type,
          extractedAt: new Date().toISOString(),
          topics: result.data.topics,
          status: 'completed',
        };

        setExtractions(prev => [newExtraction, ...prev]);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: KnowledgeExtraction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Knowledge Management System
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Extract insights, discover topics, and manage organizational knowledge
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* File Upload Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Document</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📄</div>
              <p className="text-gray-600 mb-4">
                Upload a document to extract knowledge and insights
              </p>

              <input
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />

              <label
                htmlFor="file-upload"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 cursor-pointer inline-block"
              >
                {loading ? 'Processing...' : 'Choose File'}
              </label>

              {selectedFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900 mb-2">Supported Formats:</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• PDF documents</p>
                <p>• Word documents (.docx)</p>
                <p>• Text files (.txt)</p>
                <p>• Markdown files (.md)</p>
              </div>
            </div>
          </div>

          {/* Extraction Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Extraction</h2>

            {extractedKnowledge ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {extractedKnowledge.topics.map((topic, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Key Concepts</h3>
                  <div className="space-y-2">
                    {extractedKnowledge.concepts.map((concept, index) => (
                      <div key={index} className="border-l-4 border-green-500 pl-3">
                        <p className="font-medium">{concept.name}</p>
                        <p className="text-sm text-gray-600">
                          Confidence: {Math.round(concept.confidence * 100)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Insights</h3>
                  <div className="space-y-2">
                    {extractedKnowledge.insights.map((insight, index) => (
                      <div key={index} className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                        <p className="text-sm">{insight.content}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {insight.type} • {Math.round(insight.confidence * 100)}% confidence
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🔍</div>
                <p className="text-gray-600">Upload a document to see extraction results</p>
              </div>
            )}
          </div>

          {/* Extraction History */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Extraction History</h2>

            <div className="space-y-3">
              {extractions.map((extraction) => (
                <div
                  key={extraction.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{extraction.title}</h3>
                      <p className="text-sm text-gray-600">
                        {extraction.documentType.toUpperCase()} • {new Date(extraction.extractedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(extraction.status)}`}></div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {extraction.topics.slice(0, 3).map((topic, index) => (
                      <span
                        key={index}
                        className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs"
                      >
                        {topic}
                      </span>
                    ))}
                    {extraction.topics.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{extraction.topics.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {extractions.length === 0 && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">📚</div>
                <p className="text-gray-600">No extractions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Knowledge Analytics */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Knowledge Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {extractions.length}
              </div>
              <p className="text-gray-600">Total Extractions</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {extractions.filter(e => e.status === 'completed').length}
              </div>
              <p className="text-gray-600">Successful</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {new Set(extractions.flatMap(e => e.topics)).size}
              </div>
              <p className="text-gray-600">Unique Topics</p>
            </div>

            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {Math.round(extractions.reduce((acc, e) => acc + e.topics.length, 0) / extractions.length)}
              </div>
              <p className="text-gray-600">Avg Topics per Doc</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}