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

import { BaseData, ExportableEntity } from './base-data.model';
import { DeviceId, DeviceProfileId, TenantId, CustomerId } from './id.model';
import { ProductCategoryId } from './datapoint.model';

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

export enum ConnectivityType {
  WIFI = 'WIFI',
  BLUETOOTH_LE = 'BLUETOOTH_LE',
  ZIGBEE = 'ZIGBEE',
  WIFI_BLUETOOTH = 'WIFI_BLUETOOTH',
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
  categoryId?: ProductCategoryId;
  productModel?: string;
  connectivityType?: ConnectivityType;
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
