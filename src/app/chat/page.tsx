'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
}

interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [chatMode, setChatMode] = useState<'single' | 'multi'>('multi');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/signin');
    }
  }, [status]);

  useEffect(() => {
    // Load AI providers from API
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/providers');
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
        // Select first provider by default
        if (data.length > 0) {
          setSelectedProviders([data[0].id]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || selectedProviders.length === 0) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      if (chatMode === 'single') {
        // Single AI chat
        const provider = providers.find(p => p.id === selectedProviders[0]);
        if (provider) {
          await chatWithSingleAI(provider, userMessage);
        }
      } else {
        // Multi AI chat
        await chatWithMultipleAIs(userMessage);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: Date.now().toString() + '_error',
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const chatWithSingleAI = async (provider: AIProvider, userMessage: Message) => {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage.content,
        providerId: provider.id,
        model: provider.models[0], // Use first model
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const assistantMessage: Message = {
        id: Date.now().toString() + '_response',
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        model: provider.models[0],
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  };

  const chatWithMultipleAIs = async (userMessage: Message) => {
    const promises = selectedProviders.map(async (providerId) => {
      const provider = providers.find(p => p.id === providerId);
      if (!provider) return null;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          providerId: provider.id,
          model: provider.models[0],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: Date.now().toString() + '_' + provider.id,
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date(),
          model: provider.models[0],
        };
      }
      return null;
    });

    const responses = await Promise.all(promises);
    const validResponses = responses.filter(Boolean) as Message[];
    setMessages(prev => [...prev, ...validResponses]);
  };

  const handleProviderToggle = (providerId: string) => {
    setSelectedProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Chat Playground</h1>
          <p className="text-slate-600">Chat with multiple AI models simultaneously</p>
        </div>

        {/* Chat Mode Toggle */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setChatMode('single')}
            className={`px-4 py-2 rounded-lg font-medium ${
              chatMode === 'single'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Single AI
          </button>
          <button
            onClick={() => setChatMode('multi')}
            className={`px-4 py-2 rounded-lg font-medium ${
              chatMode === 'multi'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-slate-600 border border-slate-300'
            }`}
          >
            Multi AI
          </button>
        </div>

        {/* Provider Selection */}
        {chatMode === 'multi' && (
          <div className="mb-6 bg-white rounded-lg p-4 shadow">
            <h3 className="text-lg font-semibold mb-3">Select AI Providers</h3>
            <div className="flex flex-wrap gap-2">
              {providers.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => handleProviderToggle(provider.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedProviders.includes(provider.id)
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="h-96 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-slate-500 mt-12">
                <p>Start a conversation with AI models</p>
              </div>
            ) : (
              messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {message.model && (
                      <div className="text-xs opacity-75 mb-1">
                        {message.model}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || selectedProviders.length === 0}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
