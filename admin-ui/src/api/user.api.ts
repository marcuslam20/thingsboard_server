import api from './client';
import { User } from '@/models/user.model';
import { PageData, PageLink, pageLinkToQueryParams } from '@/models/page.model';

export const userApi = {
  getUsers(pl: PageLink): Promise<PageData<User>> {
    return api.get('/api/users', { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getTenantAdmins(tenantId: string, pl: PageLink): Promise<PageData<User>> {
    return api.get(`/api/tenant/${tenantId}/users`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getCustomerUsers(customerId: string, pl: PageLink): Promise<PageData<User>> {
    return api.get(`/api/customer/${customerId}/users`, { params: pageLinkToQueryParams(pl) }).then((r) => r.data);
  },

  getUser(userId: string): Promise<User> {
    return api.get(`/api/user/${userId}`).then((r) => r.data);
  },

  saveUser(user: Partial<User>, sendActivationMail = false): Promise<User> {
    return api.post(`/api/user?sendActivationMail=${sendActivationMail}`, user).then((r) => r.data);
  },

  deleteUser(userId: string): Promise<void> {
    return api.delete(`/api/user/${userId}`).then(() => undefined);
  },

  getActivationLink(userId: string): Promise<string> {
    return api.get(`/api/user/${userId}/activationLink`, { responseType: 'text' }).then((r) => r.data);
  },

  sendActivationEmail(email: string): Promise<void> {
    return api.post(`/api/user/sendActivationMail?email=${encodeURIComponent(email)}`).then(() => undefined);
  },
};
