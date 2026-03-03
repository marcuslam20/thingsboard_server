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

import api from './client';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export interface Customer {
  id: { id: string; entityType: string };
  createdTime: number;
  tenantId: { id: string; entityType: string };
  name: string;
  title: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  address2?: string;
  zip?: string;
  phone?: string;
  email?: string;
  additionalInfo?: Record<string, unknown>;
}

export const customerApi = {
  getCustomers(pl: PageLink): Promise<PageData<Customer>> {
    return api.get('/api/customers', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getCustomer(customerId: string): Promise<Customer> {
    return api.get(`/api/customer/${customerId}`).then((r) => r.data);
  },

  saveCustomer(customer: Partial<Customer>): Promise<Customer> {
    return api.post('/api/customer', customer).then((r) => r.data);
  },

  deleteCustomer(customerId: string): Promise<void> {
    return api.delete(`/api/customer/${customerId}`).then(() => undefined);
  },

  getCustomerUsers(customerId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/customer/${customerId}/users`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getCustomerDevices(customerId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/customer/${customerId}/deviceInfos`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getCustomerAssets(customerId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/customer/${customerId}/assetInfos`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getCustomerDashboards(customerId: string, pl: PageLink): Promise<PageData<unknown>> {
    return api.get(`/api/customer/${customerId}/dashboards`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },
};
