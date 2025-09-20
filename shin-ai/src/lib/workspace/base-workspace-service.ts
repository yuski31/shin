import { BaseCommunicationService, ServiceContext, ServiceHealth, ServiceMetrics } from '../communication/base-service';
import { ICommunicationConfig } from '../communication/config';
import { ProviderFactory } from '../providers/provider-factory';
import WorkspaceModel, { IWorkspace } from '@/models/Workspace';
import WorkspaceSessionModel, { IWorkspaceSession } from '@/models/WorkspaceSession';
import ModelVersionModel, { IModelVersion } from '@/models/ModelVersion';
import DatasetVersionModel, { IDatasetVersion } from '@/models/DatasetVersion';
import ExperimentModel, { IExperiment } from '@/models/Experiment';
import CodeVersionModel, { ICodeVersion } from '@/models/CodeVersion';
import EnvironmentModel, { IEnvironment } from '@/models/Environment';
import ComputeResourceModel, { IComputeResource } from '@/models/ComputeResource';
import DependencyModel, { IDependency } from '@/models/Dependency';
import CodeReviewModel, { ICodeReview } from '@/models/CodeReview';
import SecurityScanModel, { ISecurityScan } from '@/models/SecurityScan';
import PerformanceAnalysisModel, { IPerformanceAnalysis } from '@/models/PerformanceAnalysis';

// Type aliases for easier use
const Workspace = WorkspaceModel;
const WorkspaceSession = WorkspaceSessionModel;
const ModelVersion = ModelVersionModel;
const DatasetVersion = DatasetVersionModel;
const Experiment = ExperimentModel;
const CodeVersion = CodeVersionModel;
const Environment = EnvironmentModel;
const ComputeResource = ComputeResourceModel;
const Dependency = DependencyModel;
const CodeReview = CodeReviewModel;
const SecurityScan = SecurityScanModel;
const PerformanceAnalysis = PerformanceAnalysisModel;
import mongoose from 'mongoose';

export interface WorkspaceServiceConfig {
  maxConcurrentSessions: number;
  sessionTimeout: number; // minutes
  autoSaveInterval: number; // seconds
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  resourceLimits: {
    cpu: number;
    memory: number;
    storage: number;
  };
  collaboration: {
    maxParticipants: number;
    enableRealTime: boolean;
    conflictResolution: 'auto' | 'manual' | 'priority';
  };
}

export interface WorkspacePermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canRunCode: boolean;
  canDeploy: boolean;
}

export abstract class BaseWorkspaceService extends BaseCommunicationService {
  protected workspaceConfig: WorkspaceServiceConfig;
  protected activeSessions: Map<string, IWorkspaceSession> = new Map();
  protected sessionParticipants: Map<string, Set<mongoose.Types.ObjectId>> = new Map();

  constructor(
    config: ICommunicationConfig,
    providerFactory: ProviderFactory,
    workspaceConfig: WorkspaceServiceConfig
  ) {
    super(config, providerFactory);
    this.workspaceConfig = workspaceConfig;
  }

  // Abstract methods that must be implemented by subclasses
  abstract initializeWorkspace(workspaceId: mongoose.Types.ObjectId): Promise<void>;
  abstract cleanupWorkspace(workspaceId: mongoose.Types.ObjectId): Promise<void>;

  // Workspace-specific service type (override the base implementation)
  protected getWorkspaceServiceType(): 'workspace' | 'notebook' | 'experiment' | 'review' | 'deployment' {
    return 'workspace'; // Default implementation
  }

  // Override getServiceType to maintain compatibility with base class
  getServiceType(): 'meeting' | 'translation' | 'customer_service' | 'internal_comm' {
    return 'internal_comm'; // Map to closest base type
  }

  // Workspace management methods
  protected async validateWorkspaceAccess(
    workspaceId: mongoose.Types.ObjectId,
    userId: mongoose.Types.ObjectId
  ): Promise<WorkspacePermissions> {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        throw new Error('Workspace not found');
      }

      if (!workspace.isMember(userId)) {
        throw new Error('User is not a member of this workspace');
      }

      const role = workspace.getUserRole(userId);
      const permissions = workspace.getUserPermissions(userId);

      return {
        canRead: true,
        canWrite: permissions?.canEdit || false,
        canDelete: permissions?.canDelete || false,
        canInvite: permissions?.canInvite || false,
        canManageSettings: permissions?.canManageSettings || false,
        canViewAnalytics: permissions?.canViewAnalytics || false,
        canRunCode: ['admin', 'editor'].includes(role || ''),
        canDeploy: ['admin', 'owner'].includes(role || ''),
      };
    } catch (error) {
      await this.logError('validateWorkspaceAccess', error as Error);
      throw error;
    }
  }

  protected async checkResourceLimits(
    workspaceId: mongoose.Types.ObjectId,
    requestedResources: { cpu?: number; memory?: number; storage?: number }
  ): Promise<boolean> {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) return false;

      // Check against workspace settings
      const settings = workspace.settings;
      const requested = requestedResources;

      if (requested.cpu && requested.cpu > settings.defaultResourceAllocation.cpu) {
        return false;
      }

      if (requested.memory && requested.memory > settings.defaultResourceAllocation.memory) {
        return false;
      }

      if (requested.storage && requested.storage > settings.defaultResourceAllocation.storage) {
        return false;
      }

      return true;
    } catch (error) {
      await this.logError('checkResourceLimits', error as Error);
      return false;
    }
  }

  protected async createWorkspaceSession(
    workspaceId: mongoose.Types.ObjectId,
    sessionType: 'notebook' | 'code' | 'experiment' | 'review' | 'meeting',
    userId: mongoose.Types.ObjectId,
    permissions: WorkspacePermissions
  ): Promise<IWorkspaceSession> {
    try {
      // Check session limits
      const activeSessions = await WorkspaceSession.find({ workspaceId, status: 'active' });
      if (activeSessions.length >= this.workspaceConfig.maxConcurrentSessions) {
        throw new Error('Maximum concurrent sessions reached');
      }

      const session = new WorkspaceSession({
        workspaceId,
        sessionId: this.generateSessionId(),
        name: `${sessionType} Session - ${new Date().toLocaleString()}`,
        status: 'active',
        sessionType,
        participants: [{
          userId,
          joinedAt: new Date(),
          isActive: true,
          permissions: {
            canEdit: permissions.canWrite,
            canChat: true,
            canShareScreen: false,
            canInvite: permissions.canInvite,
          },
          connectionInfo: {
            ipAddress: this.context?.metadata?.ipAddress || 'unknown',
            userAgent: this.context?.metadata?.userAgent || 'unknown',
            sessionId: this.generateRequestId(),
          },
        }],
        settings: {
          maxParticipants: this.workspaceConfig.collaboration.maxParticipants,
          allowGuestAccess: false,
          requireAuthentication: true,
          autoSave: this.workspaceConfig.autoSaveInterval > 0,
          saveInterval: this.workspaceConfig.autoSaveInterval,
          enableChat: true,
          enableScreenShare: true,
          enableFileUpload: true,
        },
      });

      await session.save();
      this.activeSessions.set(session.sessionId, session);
      this.sessionParticipants.set(session.sessionId, new Set([userId]));

      return session;
    } catch (error) {
      await this.logError('createWorkspaceSession', error as Error);
      throw error;
    }
  }

  protected async joinWorkspaceSession(
    sessionId: string,
    userId: mongoose.Types.ObjectId,
    permissions: WorkspacePermissions
  ): Promise<IWorkspaceSession> {
    try {
      const session = await WorkspaceSession.findOne({ sessionId, status: 'active' });
      if (!session) {
        throw new Error('Session not found or not active');
      }

      // Check if user is already a participant
      const existingParticipant = session.participants.find(
        (p: any) => p.userId.toString() === userId.toString()
      );

      if (existingParticipant) {
        existingParticipant.isActive = true;
        existingParticipant.leftAt = undefined;
      } else {
        // Add new participant
        session.participants.push({
          userId,
          joinedAt: new Date(),
          isActive: true,
          permissions: {
            canEdit: permissions.canWrite,
            canChat: true,
            canShareScreen: false,
            canInvite: permissions.canInvite,
          },
          connectionInfo: {
            ipAddress: this.context?.metadata?.ipAddress || 'unknown',
            userAgent: this.context?.metadata?.userAgent || 'unknown',
            sessionId: this.generateRequestId(),
          },
        });
      }

      session.updateActivity();
      await session.save();

      // Update tracking
      if (!this.sessionParticipants.has(sessionId)) {
        this.sessionParticipants.set(sessionId, new Set());
      }
      this.sessionParticipants.get(sessionId)!.add(userId);

      return session;
    } catch (error) {
      await this.logError('joinWorkspaceSession', error as Error);
      throw error;
    }
  }

  protected async leaveWorkspaceSession(
    sessionId: string,
    userId: mongoose.Types.ObjectId
  ): Promise<void> {
    try {
      const session = await WorkspaceSession.findOne({ sessionId, status: 'active' });
      if (session) {
        session.removeParticipant(userId);
        await session.save();

        // Clean up tracking
        const participants = this.sessionParticipants.get(sessionId);
        if (participants) {
          participants.delete(userId);
          if (participants.size === 0) {
            this.sessionParticipants.delete(sessionId);
            this.activeSessions.delete(sessionId);
          }
        }
      }
    } catch (error) {
      await this.logError('leaveWorkspaceSession', error as Error);
      throw error;
    }
  }

  protected async updateSessionActivity(
    sessionId: string,
    filesAccessed: string[] = []
  ): Promise<void> {
    try {
      const session = await WorkspaceSession.findOne({ sessionId, status: 'active' });
      if (session) {
        session.updateActivity(filesAccessed);
        await session.save();
      }
    } catch (error) {
      await this.logError('updateSessionActivity', error as Error);
    }
  }

  protected async logWorkspaceActivity(
    workspaceId: mongoose.Types.ObjectId,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      const workspace = await Workspace.findById(workspaceId);
      if (workspace) {
        workspace.updateMemberActivity(this.context?.userId || new mongoose.Types.ObjectId());
        await workspace.save();

        // Log to analytics or audit system
        console.log(`Workspace activity: ${action}`, {
          workspaceId,
          userId: this.context?.userId,
          timestamp: new Date(),
          details,
        });
      }
    } catch (error) {
      await this.logError('logWorkspaceActivity', error as Error);
    }
  }

  protected async validateFileUpload(
    fileName: string,
    fileSize: number,
    fileType: string
  ): Promise<boolean> {
    // Check file size
    if (fileSize > this.workspaceConfig.maxFileSize) {
      return false;
    }

    // Check file type
    if (!this.workspaceConfig.allowedFileTypes.includes(fileType)) {
      return false;
    }

    // Check file name for security
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return false;
    }

    return true;
  }

  protected async cleanupInactiveSessions(): Promise<void> {
    try {
      const inactiveThreshold = new Date(
        Date.now() - (this.workspaceConfig.sessionTimeout * 60 * 1000)
      );

      const inactiveSessions = await WorkspaceSession.find({
        status: 'active',
        'metadata.lastActivityAt': { $lt: inactiveThreshold }
      });

      for (const session of inactiveSessions) {
        session.endSession();
        await session.save();

        // Clean up tracking
        this.activeSessions.delete(session.sessionId);
        this.sessionParticipants.delete(session.sessionId);
      }
    } catch (error) {
      await this.logError('cleanupInactiveSessions', error as Error);
    }
  }

  protected async getWorkspaceAnalytics(
    workspaceId: mongoose.Types.ObjectId,
    days: number = 30
  ): Promise<Record<string, any>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get workspace activity
      const workspace = await Workspace.findById(workspaceId);
      const sessions = await WorkspaceSession.find({
        workspaceId,
        'metadata.startedAt': { $gte: startDate }
      });

      // Get model versions
      const modelVersions = await ModelVersion.find({
        workspaceId,
        'metadata.createdAt': { $gte: startDate }
      });

      // Get dataset versions
      const datasetVersions = await DatasetVersion.find({
        workspaceId,
        'metadata.createdAt': { $gte: startDate }
      });

      // Get experiments
      const experiments = await Experiment.find({
        workspaceId,
        'metadata.createdAt': { $gte: startDate }
      });

      return {
        workspace: {
          totalSessions: sessions.length,
          activeMembers: workspace?.members.filter((m: any) => m.lastActiveAt > startDate).length || 0,
          storageUsed: workspace?.metadata.storageUsed || 0,
        },
        models: {
          totalVersions: modelVersions.length,
          productionVersions: modelVersions.filter((m: any) => m.isProduction).length,
        },
        datasets: {
          totalVersions: datasetVersions.length,
        },
        experiments: {
          totalRuns: experiments.reduce((sum: number, exp: any) => sum + exp.metadata.totalRuns, 0),
          successfulRuns: experiments.reduce((sum: number, exp: any) => sum + exp.metadata.successfulRuns, 0),
        },
      };
    } catch (error) {
      await this.logError('getWorkspaceAnalytics', error as Error);
      return {};
    }
  }

  protected async logError(operation: string, error: Error): Promise<void> {
    console.error(`Workspace service error in ${operation}:`, error);
    // Could integrate with logging service
  }

  // Health check for workspace service
  async healthCheck(): Promise<ServiceHealth> {
    const baseHealth = await super.healthCheck();

    const issues: string[] = [...baseHealth.issues];

    // Check active sessions
    if (this.activeSessions.size > this.workspaceConfig.maxConcurrentSessions * 0.9) {
      issues.push('High session load detected');
    }

    // Check resource usage
    const memoryUsage = process.memoryUsage();
    if (memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9) {
      issues.push('High memory usage detected');
    }

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 2) {
      status = 'unhealthy';
    } else if (issues.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      lastHealthCheck: new Date(),
      issues,
      responseTime: baseHealth.responseTime,
    };
  }

  // Get workspace service metrics
  getWorkspaceMetrics(): Record<string, any> {
    return {
      ...this.getMetrics(),
      activeSessions: this.activeSessions.size,
      totalParticipants: Array.from(this.sessionParticipants.values())
        .reduce((sum: number, participants: Set<mongoose.Types.ObjectId>) => sum + participants.size, 0),
      sessionTimeout: this.workspaceConfig.sessionTimeout,
      maxConcurrentSessions: this.workspaceConfig.maxConcurrentSessions,
    };
  }
}