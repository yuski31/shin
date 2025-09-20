'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Search, Settings, Eye, Edit, Trash2 } from 'lucide-react';

interface MemoryPalace {
  _id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  structure: {
    rooms: Array<{
      id: string;
      name: string;
      position: { x: number; y: number; z: number };
    }>;
  };
  metadata: {
    totalMemories: number;
    totalLocations: number;
    lastAccessed?: string;
  };
}

export default function MemoryPalacePage() {
  const { data: session } = useSession();
  const [palaces, setPalaces] = useState<MemoryPalace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (session) {
      fetchPalaces();
    }
  }, [session]);

  const fetchPalaces = async () => {
    try {
      const response = await fetch('/api/memory-palaces');
      if (response.ok) {
        const data = await response.json();
        setPalaces(data.palaces || []);
      }
    } catch (error) {
      console.error('Error fetching memory palaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPalace = async (palaceData: Partial<MemoryPalace>) => {
    try {
      const response = await fetch('/api/memory-palaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(palaceData),
      });

      if (response.ok) {
        await fetchPalaces(); // Refresh the list
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating memory palace:', error);
    }
  };

  const deletePalace = async (palaceId: string) => {
    if (!confirm('Are you sure you want to delete this memory palace?')) return;

    try {
      const response = await fetch(`/api/memory-palaces/${palaceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPalaces(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting memory palace:', error);
    }
  };

  const filteredPalaces = palaces.filter(palace =>
    palace.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    palace.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your memory palaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Memory Palace Generator
        </h1>
        <p className="text-gray-600">
          Create and manage your 3D memory palaces for enhanced learning and recall
        </p>
      </div>

      <Tabs defaultValue="palaces" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="palaces">My Palaces</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
        </TabsList>

        <TabsContent value="palaces" className="space-y-6">
          {/* Search and Create Bar */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search memory palaces..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Palace
            </Button>
          </div>

          {/* Memory Palaces Grid */}
          {filteredPalaces.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No memory palaces found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm
                      ? 'Try adjusting your search terms'
                      : 'Create your first memory palace to get started'
                    }
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Palace
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPalaces.map((palace) => (
                <Card key={palace._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{palace.name}</CardTitle>
                        {palace.description && (
                          <CardDescription className="mt-1">
                            {palace.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {palace.isPublic && (
                          <Badge variant="secondary">Public</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Rooms: {palace.structure.rooms.length}</span>
                        <span>Memories: {palace.metadata.totalMemories}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Locations: {palace.metadata.totalLocations}</span>
                        <span>
                          {palace.metadata.lastAccessed
                            ? new Date(palace.metadata.lastAccessed).toLocaleDateString()
                            : 'Never accessed'
                          }
                        </span>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deletePalace(palace._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Memory Palace Templates</CardTitle>
              <CardDescription>
                Choose from pre-designed templates to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Template selection coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader>
              <CardTitle>Method of Loci Training</CardTitle>
              <CardDescription>
                Interactive tutorials and exercises to master the memory palace technique
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-gray-600">
                  Training modules coming soon...
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Palace Modal - Simplified for now */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Create New Memory Palace</CardTitle>
              <CardDescription>
                Set up a new spatial memory system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                createPalace({
                  name: formData.get('name') as string,
                  description: formData.get('description') as string,
                  structure: {
                    type: 'custom' as const,
                    rooms: [],
                    connections: [],
                  },
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Palace Name
                    </label>
                    <Input
                      name="name"
                      placeholder="My Memory Palace"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Description (Optional)
                    </label>
                    <Input
                      name="description"
                      placeholder="A place to store my memories..."
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1">
                      Create Palace
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateModal(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}