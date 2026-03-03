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
