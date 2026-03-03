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
import { LoginRequest, LoginResponse, SignupRequest } from '@/models/login.model';
import { User } from '@/models/user.model';
import { TwoFaProviderInfo, TwoFactorAuthAccountConfig, TwoFactorAuthProviderType } from '@/models/two-factor-auth.model';

export const authApi = {
  login(request: LoginRequest): Promise<LoginResponse> {
    return api.post('/api/auth/login', request).then((r) => r.data);
  },

  signup(request: SignupRequest): Promise<void> {
    return api.post('/api/noauth/signup', request).then((r) => r.data);
  },

  getUser(): Promise<User> {
    return api.get('/api/auth/user').then((r) => r.data);
  },

  logout(): Promise<void> {
    return api.post('/api/auth/logout').then(() => undefined);
  },

  sendResetPasswordLink(email: string): Promise<void> {
    return api.post('/api/noauth/resetPasswordByEmail', { email }).then(() => undefined);
  },

  resetPassword(resetToken: string, password: string): Promise<LoginResponse> {
    return api.post('/api/noauth/resetPassword', { resetToken, password }).then((r) => r.data);
  },

  changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return api.post('/api/auth/changePassword', { currentPassword, newPassword }).then(() => undefined);
  },

  getUserPasswordPolicy(): Promise<Record<string, unknown>> {
    return api.get('/api/noauth/userPasswordPolicy').then((r) => r.data);
  },

  activateUser(activateToken: string, password: string): Promise<LoginResponse> {
    return api.post('/api/noauth/activate', { activateToken, password }).then((r) => r.data);
  },

  // 2FA methods
  getAvailableTwoFaProviders(): Promise<TwoFaProviderInfo[]> {
    return api.get('/api/auth/2fa/providers').then((r) => r.data);
  },

  checkTwoFaVerificationCode(providerType: TwoFactorAuthProviderType, verificationCode: string): Promise<LoginResponse> {
    return api.post('/api/auth/2fa/verification/check', { providerType, verificationCode }).then((r) => r.data);
  },

  requestTwoFaVerificationCodeSend(providerType: TwoFactorAuthProviderType): Promise<void> {
    return api.post('/api/auth/2fa/verification/send', { providerType }).then(() => undefined);
  },

  generateTwoFaAccountConfig(providerType: TwoFactorAuthProviderType): Promise<TwoFactorAuthAccountConfig> {
    return api.post('/api/auth/2fa/account/config/generate', { providerType }).then((r) => r.data);
  },

  verifyAndSaveTwoFaAccountConfig(config: TwoFactorAuthAccountConfig, verificationCode: string): Promise<void> {
    return api.post(`/api/auth/2fa/account/config?verificationCode=${verificationCode}`, config).then(() => undefined);
  },

  deleteTwoFaAccountConfig(providerType: TwoFactorAuthProviderType): Promise<void> {
    return api.delete(`/api/auth/2fa/account/config?providerType=${providerType}`).then(() => undefined);
  },
};
