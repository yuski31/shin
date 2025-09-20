// Design Automation Models
export { default as DesignProject, type IDesignProject, type DesignType, type ProjectStatus } from './DesignProject';
export { default as DesignAsset, type IDesignAsset, type AssetType, type AssetFormat } from './DesignAsset';
export { default as DesignTemplate, type IDesignTemplate, type TemplateCategory, type TemplateCompatibility } from './DesignTemplate';
export { default as DesignVersion, type IDesignVersion, type VersionType } from './DesignVersion';
export { default as BrandIdentity, type IBrandIdentity, type IBrandColor, type IBrandTypography } from './BrandIdentity';
export { default as CADModel, type ICADModel, type CADModelType, type ModelFormat } from './CADModel';
export { default as FashionPattern, type IFashionPattern, type PatternType, type GarmentCategory, type SizeRange, type IPatternPiece } from './FashionPattern';

// Re-export commonly used types
export type {
  DesignType as ProjectDesignType,
  ProjectStatus as DesignProjectStatus,
} from './DesignProject';

export type {
  AssetType as DesignAssetType,
  AssetFormat as DesignAssetFormat,
} from './DesignAsset';

export type {
  TemplateCategory as DesignTemplateCategory,
  TemplateCompatibility as DesignTemplateCompatibility,
} from './DesignTemplate';

export type {
  VersionType as DesignVersionType,
} from './DesignVersion';

export type {
  CADModelType as CADDesignType,
  ModelFormat as CADModelFormat,
} from './CADModel';

export type {
  PatternType as FashionPatternType,
  GarmentCategory as FashionGarmentCategory,
  SizeRange as FashionSizeRange,
} from './FashionPattern';

// Re-export models with different names
export { default as DesignProjectModel } from './DesignProject';
export { default as DesignAssetModel } from './DesignAsset';
export { default as DesignTemplateModel } from './DesignTemplate';
export { default as DesignVersionModel } from './DesignVersion';
export { default as BrandIdentityModel } from './BrandIdentity';
export { default as CADModelModel } from './CADModel';
export { default as FashionPatternModel } from './FashionPattern';