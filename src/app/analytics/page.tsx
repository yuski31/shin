'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  PieChart,
  Activity,
  Brain,
  Zap,
  Shield,
  Globe
} from 'lucide-react';

interface AnalyticsData {
  executiveSummary: {
    totalRevenue: number;
    revenueGrowth: number;
    customerRetention: number;
    marketShare: number;
    operationalEfficiency: number;
  };
  keyMetrics: {
    revenue: { current: number; previous: number; change: number; trend: string };
    customers: { active: number; new: number; churned: number; retention: number };
    operations: { efficiency: number; productivity: number; quality: number; satisfaction: number };
    market: { share: number; growth: number; positioning: string; competition: string };
  };
  insights: Array<{
    type: string;
    title: string;
    description: string;
    impact: string;
    confidence: number;
    recommendation: string;
  }>;
  predictions: {
    nextQuarter: { revenue: number; growth: number; confidence: number };
    nextYear: { revenue: number; growth: number; confidence: number };
  };
  risks: Array<{
    category: string;
    title: string;
    probability: number;
    impact: string;
    mitigation: string;
  }>;
}

interface PerformanceData {
  systemPerformance: {
    uptime: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
  userEngagement: {
    dailyActiveUsers: number;
    sessionDuration: number;
    featureAdoption: number;
    satisfaction: number;
  };
  resourceUtilization: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  trends: {
    performance: string;
    engagement: string;
    utilization: string;
    satisfaction: string;
  };
}

const AnalyticsDashboard = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('last-30-days');
  const [activeTab, setActiveTab] = useState('business-intelligence');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedTimeframe]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/analytics?type=${activeTab}`);
      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'business-intelligence') {
          setAnalyticsData(data);
        } else if (activeTab === 'performance') {
          setPerformanceData(data);
        }
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = async (reportType: string) => {
    try {
      const response = await fetch('/api/analytics?type=report&report=' + reportType);
      if (response.ok) {
        const data = await response.json();
        // Mock download functionality
        console.log('Generated report:', data);
        alert(`Report "${data.title}" generated successfully!`);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const MetricCard = ({ title, value, change, trend, icon: Icon, format = 'number' }: {
    title: string;
    value: number;
    change: number;
    trend: string;
    icon: any;
    format?: string;
  }) => {
    const formatValue = (val: number) => {
      if (format === 'currency') return `$${val.toLocaleString()}`;
      if (format === 'percentage') return `${val}%`;
      return val.toLocaleString();
    };

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
            <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
              {change > 0 ? '+' : ''}{change}%
            </span>
            <span>from last period</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const InsightCard = ({ insight }: { insight: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{insight.title}</CardTitle>
          <Badge variant={insight.impact === 'high' ? 'destructive' : insight.impact === 'medium' ? 'default' : 'secondary'}>
            {insight.impact} impact
          </Badge>
        </div>
        <CardDescription>{insight.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Confidence:</span>
            <span className="font-medium">{(insight.confidence * 100).toFixed(1)}%</span>
          </div>
          <Progress value={insight.confidence * 100} className="h-2" />
          <div className="text-sm text-muted-foreground">
            <strong>Recommendation:</strong> {insight.recommendation}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const RiskCard = ({ risk }: { risk: any }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{risk.title}</CardTitle>
          <Badge variant="outline">
            {risk.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Probability:</span>
            <span className="font-medium">{(risk.probability * 100).toFixed(1)}%</span>
          </div>
          <Progress value={risk.probability * 100} className="h-2" />
          <div className="text-sm">
            <strong>Impact:</strong> <Badge variant={risk.impact === 'high' ? 'destructive' : 'secondary'}>{risk.impact}</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Mitigation:</strong> {risk.mitigation}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Analytics</h1>
          <p className="text-muted-foreground">
            Business intelligence, performance monitoring, and predictive insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="last-7-days">Last 7 days</option>
            <option value="last-30-days">Last 30 days</option>
            <option value="last-90-days">Last 90 days</option>
            <option value="last-year">Last year</option>
          </select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="business-intelligence">Business Intelligence</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="predictive">Predictive</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="business-intelligence" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : analyticsData ? (
            <>
              {/* Executive Summary */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <MetricCard
                  title="Total Revenue"
                  value={analyticsData.executiveSummary.totalRevenue}
                  change={analyticsData.executiveSummary.revenueGrowth}
                  trend="up"
                  icon={DollarSign}
                  format="currency"
                />
                <MetricCard
                  title="Customer Retention"
                  value={analyticsData.executiveSummary.customerRetention}
                  change={2.1}
                  trend="up"
                  icon={Users}
                  format="percentage"
                />
                <MetricCard
                  title="Market Share"
                  value={analyticsData.executiveSummary.marketShare}
                  change={0.8}
                  trend="up"
                  icon={Globe}
                  format="percentage"
                />
                <MetricCard
                  title="Operational Efficiency"
                  value={analyticsData.executiveSummary.operationalEfficiency}
                  change={3.2}
                  trend="up"
                  icon={Target}
                  format="percentage"
                />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Growth</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      +{analyticsData.executiveSummary.revenueGrowth}%
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span>vs last quarter</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Key Insights */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Brain className="w-5 h-5" />
                      <span>AI Insights</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.insights.map((insight, index) => (
                        <InsightCard key={index} insight={insight} />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span>Risk Assessment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {analyticsData.risks.map((risk, index) => (
                        <RiskCard key={index} risk={risk} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Predictions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5" />
                    <span>Revenue Predictions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Next Quarter</span>
                        <span className="text-sm text-muted-foreground">
                          ${(analyticsData.predictions.nextQuarter.revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <Progress value={analyticsData.predictions.nextQuarter.confidence * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence: {(analyticsData.predictions.nextQuarter.confidence * 100).toFixed(1)}%</span>
                        <span>Growth: +{analyticsData.predictions.nextQuarter.growth}%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Next Year</span>
                        <span className="text-sm text-muted-foreground">
                          ${(analyticsData.predictions.nextYear.revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                      <Progress value={analyticsData.predictions.nextYear.confidence * 100} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Confidence: {(analyticsData.predictions.nextYear.confidence * 100).toFixed(1)}%</span>
                        <span>Growth: +{analyticsData.predictions.nextYear.growth}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unable to load analytics data. Please try again.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {performanceData ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="System Uptime"
                value={performanceData.systemPerformance.uptime}
                change={0.2}
                trend="up"
                icon={Shield}
                format="percentage"
              />
              <MetricCard
                title="Response Time"
                value={performanceData.systemPerformance.responseTime}
                change={-15}
                trend="up"
                icon={Zap}
              />
              <MetricCard
                title="Daily Active Users"
                value={performanceData.userEngagement.dailyActiveUsers}
                change={8.5}
                trend="up"
                icon={Users}
              />
              <MetricCard
                title="User Satisfaction"
                value={performanceData.userEngagement.satisfaction}
                change={0.3}
                trend="up"
                icon={Target}
              />
            </div>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Performance data not available.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="predictive" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Revenue Forecast</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-2xl font-bold">
                    ${(analyticsData?.predictions.nextQuarter.revenue || 0) / 1000000}M
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Next quarter projection with {(analyticsData?.predictions.nextQuarter.confidence || 0) * 100}% confidence
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Market Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Market Share</span>
                    <span className="font-medium">{analyticsData?.keyMetrics.market.share || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Growth Rate</span>
                    <span className="font-medium">+{analyticsData?.keyMetrics.market.growth || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Positioning</span>
                    <Badge variant="outline">{analyticsData?.keyMetrics.market.positioning || 'N/A'}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5" />
                  <span>Financial Report</span>
                </CardTitle>
                <CardDescription>
                  Comprehensive financial performance analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('financial')} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Customer Report</span>
                </CardTitle>
                <CardDescription>
                  Customer analytics and segmentation analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('customer')} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Operations Report</span>
                </CardTitle>
                <CardDescription>
                  Operational efficiency and process analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => generateReport('operations')} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;