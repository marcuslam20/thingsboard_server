import api from './client';

export interface ImageResourceInfo {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  title: string;
  resourceType: string;
  resourceSubType: string;
  resourceKey: string;
  isPublic: boolean;
  publicResourceKey: string;
  fileName: string;
  etag: string;
  descriptor: {
    mediaType: string;
    width: number;
    height: number;
    size: number;
  };
}

export const imageApi = {
  /**
   * Upload an image file via multipart form data.
   * Returns resource info with key that can be used as `tb-image:tenant/{key}`.
   */
  uploadImage(file: File, title?: string): Promise<ImageResourceInfo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title || file.name);
    formData.append('imageSubType', 'IMAGE');
    // Delete Content-Type so browser auto-sets multipart/form-data with correct boundary
    // (The Axios client defaults to application/json which would break multipart uploads)
    return api.post('/api/image', formData, {
      headers: { 'Content-Type': undefined },
    }).then((r) => r.data);
  },
};
