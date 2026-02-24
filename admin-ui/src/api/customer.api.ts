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
