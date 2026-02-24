import { Authority } from './authority.model';
import { UserId, TenantId, CustomerId } from './id.model';
import { BaseData } from './base-data.model';

export interface User extends BaseData<UserId> {
  tenantId: TenantId;
  customerId: CustomerId;
  email: string;
  phone?: string;
  authority: Authority;
  firstName: string;
  lastName: string;
  additionalInfo?: UserAdditionalInfo;
}

export interface UserAdditionalInfo {
  description?: string;
  defaultDashboardId?: string;
  defaultDashboardFullscreen?: boolean;
  homeDashboardId?: string;
  homeDashboardHideToolbar?: boolean;
  lang?: string;
  userCredentialsEnabled?: boolean;
  userActivated?: boolean;
  lastLoginTs?: number;
}

export interface AuthUser {
  sub: string;
  scopes: string[];
  userId: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  tenantId: string;
  customerId: string;
  isPublic: boolean;
  authority: Authority;
}
