'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Dna,
  Stethoscope,
  FileText,
  Upload,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

interface HealthcareStats {
  totalImages: number;
  genomicSequences: number;
  clinicalDecisions: number;
  activeTrials: number;
}

interface RecentActivity {
  id: string;
  type: 'image' | 'genomic' | 'clinical' | 'trial';
  title: string;
  description: string;
  timestamp: Date;
  status: 'success' | 'warning' | 'error';
}

export default function HealthcareAIPage() {
  const [stats, setStats] = useState<HealthcareStats>({
    totalImages: 0,
    genomicSequences: 0,
    clinicalDecisions: 0,
    activeTrials: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthcareStats();
    fetchRecentActivity();
  }, []);

  const fetchHealthcareStats = async () => {
    try {
      const response = await fetch('/api/healthcare/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch healthcare stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/healthcare/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'image':
        return <Activity className="h-4 w-4" />;
      case 'genomic':
        return <Dna className="h-4 w-4" />;
      case 'clinical':
        return <Stethoscope className="h-4 w-4" />;
      case 'trial':
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: RecentActivity['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Healthcare AI</h1>
          <p className="text-gray-600 mt-2">
            Medical imaging, genomics, and clinical decision support
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Data
          </Button>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button size="sm">
            <Activity className="h-4 w-4 mr-2" />
            New Analysis
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medical Images</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalImages}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12</span> this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Genomic Sequences</CardTitle>
            <Dna className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.genomicSequences}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8</span> new sequences
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinical Decisions</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clinicalDecisions}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15</span> this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Trials</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeTrials}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> recruiting
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="imaging">Medical Imaging</TabsTrigger>
          <TabsTrigger value="genomics">Genomics</TabsTrigger>
          <TabsTrigger value="clinical">Clinical Support</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest healthcare AI analyses and results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${getActivityColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {activity.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {getStatusIcon(activity.status)}
                            <span className="ml-1 capitalize">{activity.status}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {activity.timestamp.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common healthcare AI tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Activity className="h-6 w-6 mb-2" />
                    <span className="text-sm">Analyze Image</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Dna className="h-6 w-6 mb-2" />
                    <span className="text-sm">Process DNA</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <Stethoscope className="h-6 w-6 mb-2" />
                    <span className="text-sm">Get Treatment</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col">
                    <FileText className="h-6 w-6 mb-2" />
                    <span className="text-sm">Find Trials</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="imaging">
          <Card>
            <CardHeader>
              <CardTitle>Medical Image Analysis</CardTitle>
              <CardDescription>AI-powered analysis of medical images</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Activity className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No images analyzed yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload medical images for AI-powered analysis and diagnosis
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Images
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="genomics">
          <Card>
            <CardHeader>
              <CardTitle>Genomic Analysis</CardTitle>
              <CardDescription>DNA sequencing and genetic analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Dna className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sequences analyzed yet</h3>
                <p className="text-gray-600 mb-4">
                  Upload genomic data for variant analysis and interpretation
                </p>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Sequences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clinical">
          <Card>
            <CardHeader>
              <CardTitle>Clinical Decision Support</CardTitle>
              <CardDescription>Treatment recommendations and drug interaction checking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Stethoscope className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No clinical decisions yet</h3>
                <p className="text-gray-600 mb-4">
                  Get AI-powered treatment recommendations and clinical insights
                </p>
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  Get Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}