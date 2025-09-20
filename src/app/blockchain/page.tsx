'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Code,
  Network,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Zap,
  Globe
} from 'lucide-react';

interface SmartContract {
  id: string;
  contractId: string;
  name: string;
  description: string;
  contractAddress: string | null;
  network: string;
  contractType: string;
  deploymentStatus: string;
  verificationStatus: string;
  owner: string;
  organization: string;
  metadata: {
    tags: string[];
    category: string;
    riskLevel: string;
    auditStatus: string;
    securityScore: number;
    gasEfficiency: number;
  };
  usage: {
    totalTransactions: number;
    uniqueUsers: number;
    totalValueLocked: number;
    gasUsed: number;
    lastActivity: string;
    activeUsers: number;
  };
  monitoring: {
    healthScore: number;
    performanceMetrics: {
      averageGasUsed: number;
      failureRate: number;
      successRate: number;
    };
  };
  createdAt: string;
  deployedAt?: string;
}

interface NetworkStatus {
  name: string;
  chainId: number;
  blockHeight: number;
  gasPrice: string;
  status: string;
  syncStatus: string;
  peerCount: number;
  lastBlockTime: string;
}

const BlockchainDashboard = () => {
  const [contracts, setContracts] = useState<SmartContract[]>([]);
  const [networkStatus, setNetworkStatus] = useState<Record<string, NetworkStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum');
  const [activeTab, setActiveTab] = useState('contracts');

  useEffect(() => {
    fetchContracts();
    fetchNetworkStatus();
  }, []);

  const fetchContracts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/blockchain/contracts');
      if (response.ok) {
        const data = await response.json();
        setContracts(data);
      }
    } catch (error) {
      console.error('Error fetching smart contracts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNetworkStatus = async () => {
    try {
      const networks = ['ethereum', 'polygon', 'bsc'];
      const statusPromises = networks.map(network =>
        fetch(`/api/blockchain/networks?network=${network}`)
          .then(res => res.json())
          .then(data => ({ [network]: data }))
          .catch(() => ({ [network]: null }))
      );

      const results = await Promise.all(statusPromises);
      const statusMap: Record<string, NetworkStatus> = {};

      results.forEach(result => {
        Object.assign(statusMap, result);
      });

      setNetworkStatus(statusMap);
    } catch (error) {
      console.error('Error fetching network status:', error);
    }
  };

  const deployContract = async (contractId: string) => {
    try {
      const response = await fetch('/api/blockchain/contracts/deploy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          network: selectedNetwork,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Deployment initiated:', result);
        alert('Contract deployment initiated successfully!');
        fetchContracts(); // Refresh contracts list
      }
    } catch (error) {
      console.error('Error deploying contract:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deployed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      case 'verified': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deployed': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      case 'verified': return <Shield className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const ContractCard = ({ contract }: { contract: SmartContract }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{contract.name}</CardTitle>
            <CardDescription>{contract.description}</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{contract.network}</Badge>
            <Badge variant={contract.deploymentStatus === 'deployed' ? 'default' : 'secondary'}>
              {contract.deploymentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Transactions</span>
              <div className="font-medium">{contract.usage.totalTransactions.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Users</span>
              <div className="font-medium">{contract.usage.uniqueUsers}</div>
            </div>
            <div>
              <span className="text-muted-foreground">TVL</span>
              <div className="font-medium">${contract.usage.totalValueLocked.toLocaleString()}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Health</span>
              <div className="font-medium">{contract.monitoring.healthScore}%</div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Security: {contract.metadata.securityScore}%</span>
              <span>Gas Efficiency: {contract.metadata.gasEfficiency}%</span>
              <span>Risk: {contract.metadata.riskLevel}</span>
            </div>
            <div className="flex items-center space-x-2">
              {contract.deploymentStatus === 'pending' && (
                <Button
                  onClick={() => deployContract(contract.contractId)}
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Network className="w-4 h-4" />
                  <span>Deploy</span>
                </Button>
              )}
              {contract.contractAddress && (
                <Button variant="outline" size="sm">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const NetworkStatusCard = ({ network, status }: { network: string; status: NetworkStatus }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Globe className="w-5 h-5" />
          <span>{status.name}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Block Height:</span>
            <span className="font-medium">{status.blockHeight.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Gas Price:</span>
            <span className="font-medium">{(parseInt(status.gasPrice) / 1e9).toFixed(2)} Gwei</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Peers:</span>
            <span className="font-medium">{status.peerCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Status:</span>
            <Badge variant={status.status === 'healthy' ? 'default' : 'destructive'}>
              {status.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Blockchain Platform</h1>
          <p className="text-muted-foreground">
            Smart contract deployment, monitoring, and analytics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="ethereum">Ethereum</option>
            <option value="polygon">Polygon</option>
            <option value="bsc">BSC</option>
          </select>
          <Button onClick={fetchContracts} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Contract</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contracts">Smart Contracts</TabsTrigger>
          <TabsTrigger value="networks">Network Status</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="grid gap-4">
              {contracts.map((contract) => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="networks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(networkStatus).map(([network, status]) => (
              <NetworkStatusCard key={network} network={network} status={status} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{contracts.length}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>+2 from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Deployed</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contracts.filter(c => c.deploymentStatus === 'deployed').length}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{((contracts.filter(c => c.deploymentStatus === 'deployed').length / contracts.length) * 100).toFixed(1)}% deployment rate</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {contracts.reduce((sum, c) => sum + c.usage.totalTransactions, 0).toLocaleString()}
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>+15% from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(contracts.reduce((sum, c) => sum + c.usage.totalValueLocked, 0) / 1000000).toFixed(1)}M
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  <span>+8% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="w-5 h-5" />
                  <span>Security Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Security Score</span>
                    <span className="font-medium">
                      {contracts.length > 0
                        ? Math.round(contracts.reduce((sum, c) => sum + c.metadata.securityScore, 0) / contracts.length)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={contracts.length > 0
                      ? contracts.reduce((sum, c) => sum + c.metadata.securityScore, 0) / contracts.length
                      : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Audited Contracts</span>
                    <span>{contracts.filter(c => c.metadata.auditStatus === 'audited' || c.metadata.auditStatus === 'certified').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Performance Metrics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Gas Efficiency</span>
                    <span className="font-medium">
                      {contracts.length > 0
                        ? Math.round(contracts.reduce((sum, c) => sum + c.metadata.gasEfficiency, 0) / contracts.length)
                        : 0}%
                    </span>
                  </div>
                  <Progress
                    value={contracts.length > 0
                      ? contracts.reduce((sum, c) => sum + c.metadata.gasEfficiency, 0) / contracts.length
                      : 0
                    }
                    className="h-2"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Success Rate</span>
                    <span>
                      {contracts.length > 0
                        ? (contracts.reduce((sum, c) => sum + c.monitoring.performanceMetrics.successRate, 0) / contracts.length).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BlockchainDashboard;