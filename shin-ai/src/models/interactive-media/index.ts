// Interactive Media Models Index
export { default as Game, type IGame, type IGameWorld, type IGameNPC, type IGameDifficulty, type IGameNarrative, type IGamePlayer } from './Game';
export { default as VRScene, type IVRScene, type IVRGazePoint, type IVRHapticPattern, type IVRGesture, type IVRSpatialAnchor } from './VRScene';
export { default as ARObject, type IARObject, type IARPlane, type IARMarker, type IAROcclusionMesh, type IARLightEstimation } from './ARObject';
export { default as Avatar, type IAvatar, type IAvatarCustomization, type IAvatarPersonality, type IAvatarSocial, type IAvatarEconomic } from './Avatar';
export { default as VirtualSpace, type IVirtualSpace, type IVirtualSpaceEnvironment, type IVirtualSpaceObject, type IVirtualSpaceZone } from './VirtualSpace';
export { default as MediaContent, type IMediaContent } from './MediaContent';

// Re-export commonly used types
export type InteractiveMediaType = 'game' | 'vr_scene' | 'ar_object' | 'avatar' | 'virtual_space';

export interface IInteractiveMediaBase {
  id: string;
  title: string;
  description: string;
  organizationId: string;
  creatorId: string;
  type: InteractiveMediaType;
  tags: string[];
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    rating: number;
    accessCount: number;
  };
}

export interface IInteractiveMediaContent extends IInteractiveMediaBase {
  content: {
    data: any; // The actual media content data
    format: string;
    size: number;
    url?: string;
  };
  assets: Array<{
    type: 'model' | 'texture' | 'sound' | 'script' | 'image' | 'video';
    url: string;
    name: string;
    size: number;
  }>;
  preview: {
    thumbnailUrl: string;
    previewUrl?: string;
    description: string;
  };
}

export interface IInteractiveMediaAnalytics {
  views: number;
  uniqueUsers: number;
  averageSessionTime: number;
  interactions: number;
  rating: {
    average: number;
    count: number;
  };
  performance: {
    loadTime: number;
    frameRate: number;
    crashCount: number;
  };
}