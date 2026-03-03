///
/// Copyright © 2016-2025 The Thingsboard Authors
///
/// Licensed under the Apache License, Version 2.0 (the "License");
/// you may not use this file except in compliance with the License.
/// You may obtain a copy of the License at
///
///     http://www.apache.org/licenses/LICENSE-2.0
///
/// Unless required by applicable law or agreed to in writing, software
/// distributed under the License is distributed on an "AS IS" BASIS,
/// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
/// See the License for the specific language governing permissions and
/// limitations under the License.
///

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
