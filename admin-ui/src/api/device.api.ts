import api from './client';
import { Device, DeviceInfo, DeviceCredentials } from '@/models/device.model';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface EntitySubtype {
  tenantId: { id: string; entityType: string };
  entityType: string;
  type: string;
}

export const deviceApi = {
  getTenantDeviceInfos(pl: PageLink, type?: string, deviceProfileId?: string, active?: boolean): Promise<PageData<DeviceInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (type) params.type = type;
    if (deviceProfileId) params.deviceProfileId = deviceProfileId;
    if (active !== undefined) params.active = String(active);
    return api.get('/api/tenant/deviceInfos', { params }).then((r) => r.data);
  },

  getCustomerDeviceInfos(customerId: string, pl: PageLink, type?: string): Promise<PageData<DeviceInfo>> {
    const params: Record<string, string> = pageLinkToQueryParams(pl);
    if (type) params.type = type;
    return api.get(`/api/customer/${customerId}/deviceInfos`, { params }).then((r) => r.data);
  },

  getDevice(deviceId: string): Promise<Device> {
    return api.get(`/api/device/${deviceId}`).then((r) => r.data);
  },

  getDeviceInfo(deviceId: string): Promise<DeviceInfo> {
    return api.get(`/api/device/info/${deviceId}`).then((r) => r.data);
  },

  saveDevice(device: Partial<Device>): Promise<Device> {
    return api.post('/api/device', device).then((r) => r.data);
  },

  saveDeviceWithCredentials(device: Partial<Device>, credentials: Partial<DeviceCredentials>): Promise<Device> {
    return api.post('/api/device-with-credentials', { device, credentials }).then((r) => r.data);
  },

  deleteDevice(deviceId: string): Promise<void> {
    return api.delete(`/api/device/${deviceId}`).then(() => undefined);
  },

  getDeviceTypes(): Promise<EntitySubtype[]> {
    return api.get('/api/device/types').then((r) => r.data);
  },

  getDeviceCredentials(deviceId: string): Promise<DeviceCredentials> {
    return api.get(`/api/device/${deviceId}/credentials`).then((r) => r.data);
  },

  saveDeviceCredentials(credentials: DeviceCredentials): Promise<DeviceCredentials> {
    return api.post('/api/device/credentials', credentials).then((r) => r.data);
  },

  assignDeviceToCustomer(customerId: string, deviceId: string): Promise<Device> {
    return api.post(`/api/customer/${customerId}/device/${deviceId}`).then((r) => r.data);
  },

  unassignDeviceFromCustomer(deviceId: string): Promise<void> {
    return api.delete(`/api/customer/device/${deviceId}`).then(() => undefined);
  },

  makeDevicePublic(deviceId: string): Promise<Device> {
    return api.post(`/api/customer/public/device/${deviceId}`).then((r) => r.data);
  },

  sendOneWayRpcCommand(deviceId: string, body: Record<string, unknown>): Promise<unknown> {
    return api.post(`/api/rpc/oneway/${deviceId}`, body).then((r) => r.data);
  },

  sendTwoWayRpcCommand(deviceId: string, body: Record<string, unknown>): Promise<unknown> {
    return api.post(`/api/rpc/twoway/${deviceId}`, body).then((r) => r.data);
  },
};
