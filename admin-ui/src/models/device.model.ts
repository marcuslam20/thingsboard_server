import { BaseData, ExportableEntity } from './base-data.model';
import { DeviceId, DeviceProfileId, TenantId, CustomerId } from './id.model';

export interface Device extends ExportableEntity<DeviceId> {
  tenantId: TenantId;
  customerId: CustomerId;
  type: string;
  label: string;
  deviceProfileId: DeviceProfileId;
  firmwareId?: { id: string; entityType: string };
  softwareId?: { id: string; entityType: string };
  additionalInfo?: Record<string, unknown>;
}

export interface DeviceInfo extends Device {
  customerTitle: string;
  customerIsPublic: boolean;
  deviceProfileName: string;
  active: boolean;
}

export enum DeviceProfileType {
  DEFAULT = 'DEFAULT',
  SNMP = 'SNMP',
}

export enum DeviceTransportType {
  DEFAULT = 'DEFAULT',
  MQTT = 'MQTT',
  COAP = 'COAP',
  LWM2M = 'LWM2M',
  SNMP = 'SNMP',
}

export interface DeviceProfile extends BaseData<DeviceProfileId> {
  tenantId: TenantId;
  description?: string;
  default: boolean;
  type: DeviceProfileType;
  transportType: DeviceTransportType;
  image?: string;
  defaultRuleChainId?: { id: string; entityType: string };
  defaultDashboardId?: { id: string; entityType: string };
  profileData?: Record<string, unknown>;
}

export enum DeviceCredentialsType {
  ACCESS_TOKEN = 'ACCESS_TOKEN',
  X509_CERTIFICATE = 'X509_CERTIFICATE',
  MQTT_BASIC = 'MQTT_BASIC',
  LWM2M_CREDENTIALS = 'LWM2M_CREDENTIALS',
}

export interface DeviceCredentials {
  id: { id: string; entityType: string };
  deviceId: DeviceId;
  credentialsType: DeviceCredentialsType;
  credentialsId: string;
  credentialsValue?: string;
}
