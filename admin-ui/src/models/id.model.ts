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

export interface EntityId {
  id: string;
  entityType: string;
}

export interface TenantId extends EntityId {
  entityType: 'TENANT';
}

export interface CustomerId extends EntityId {
  entityType: 'CUSTOMER';
}

export interface UserId extends EntityId {
  entityType: 'USER';
}

export interface DeviceId extends EntityId {
  entityType: 'DEVICE';
}

export interface DeviceProfileId extends EntityId {
  entityType: 'DEVICE_PROFILE';
}

export interface AssetId extends EntityId {
  entityType: 'ASSET';
}

export interface AssetProfileId extends EntityId {
  entityType: 'ASSET_PROFILE';
}

export interface DashboardId extends EntityId {
  entityType: 'DASHBOARD';
}

export interface RuleChainId extends EntityId {
  entityType: 'RULE_CHAIN';
}

export interface EdgeId extends EntityId {
  entityType: 'EDGE';
}
