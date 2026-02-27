import { EntityId } from './id.model';

export interface DataPointId extends EntityId {
  entityType: 'DATA_POINT';
}

export interface ProductCategoryId extends EntityId {
  entityType: 'PRODUCT_CATEGORY';
}

export enum DpType {
  BOOLEAN = 'BOOLEAN',
  VALUE = 'VALUE',
  ENUM = 'ENUM',
  STRING = 'STRING',
  RAW = 'RAW',
  FAULT = 'FAULT',
}

export enum DpMode {
  RW = 'RW',
  RO = 'RO',
  WO = 'WO',
}

export interface ValueConstraints {
  min?: number;
  max?: number;
  step?: number;
  scale?: number;
  unit?: string;
}

export interface EnumConstraints {
  range?: string[];
}

export interface StringConstraints {
  maxlen?: number;
}

export type DpConstraints = ValueConstraints | EnumConstraints | StringConstraints | Record<string, unknown>;

export interface DataPoint {
  id: DataPointId;
  createdTime: number;
  tenantId: { id: string; entityType: string };
  deviceProfileId: { id: string; entityType: string };
  dpId: number;
  code: string;
  name: string;
  dpType: DpType;
  mode: DpMode;
  constraints: DpConstraints | null;
  standard: boolean;
  sortOrder: number;
  version?: number;
}

export interface ProductCategory {
  id: ProductCategoryId;
  createdTime: number;
  tenantId: { id: string; entityType: string };
  code: string;
  name: string;
  icon: string;
  parentId: ProductCategoryId | null;
  standardDpSet: unknown;
  sortOrder: number;
  version?: number;
}
