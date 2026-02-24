import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export type OtaPackageType = 'FIRMWARE' | 'SOFTWARE';

export interface OtaPackage {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  deviceProfileId?: { id: string; entityType: string };
  type: OtaPackageType;
  title: string;
  version: string;
  tag?: string;
  url?: string;
  hasData: boolean;
  fileName?: string;
  contentType?: string;
  dataSize?: number;
  checksum?: string;
  checksumAlgorithm?: string;
  additionalInfo?: Record<string, unknown>;
}

export interface OtaPackageInfo extends OtaPackage {
  deviceProfileName?: string;
}

export const otaUpdateApi = {
  getOtaPackages(deviceProfileId: string, type: OtaPackageType, pl: PageLink): Promise<PageData<OtaPackageInfo>> {
    return api.get(`/api/otaPackages/${deviceProfileId}/${type}`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getOtaPackagesV2(pl: PageLink): Promise<PageData<OtaPackageInfo>> {
    return api.get('/api/otaPackages', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getOtaPackage(otaPackageId: string): Promise<OtaPackage> {
    return api.get(`/api/otaPackage/${otaPackageId}`).then((r) => r.data);
  },

  getOtaPackageInfo(otaPackageId: string): Promise<OtaPackageInfo> {
    return api.get(`/api/otaPackage/info/${otaPackageId}`).then((r) => r.data);
  },

  saveOtaPackageInfo(pkg: Partial<OtaPackage>): Promise<OtaPackage> {
    return api.post('/api/otaPackage', pkg).then((r) => r.data);
  },

  deleteOtaPackage(otaPackageId: string): Promise<void> {
    return api.delete(`/api/otaPackage/${otaPackageId}`).then(() => undefined);
  },

  uploadOtaPackageData(otaPackageId: string, file: File, checksumAlgorithm?: string, checksum?: string): Promise<OtaPackage> {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string> = {};
    if (checksumAlgorithm) params.checksumAlgorithm = checksumAlgorithm;
    if (checksum) params.checksum = checksum;
    return api.post(`/api/otaPackage/${otaPackageId}`, formData, {
      params,
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data);
  },
};
