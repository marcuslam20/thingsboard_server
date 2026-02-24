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
