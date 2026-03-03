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

export enum TwoFactorAuthProviderType {
  TOTP = 'TOTP',
  SMS = 'SMS',
  EMAIL = 'EMAIL',
  BACKUP_CODE = 'BACKUP_CODE',
}

export interface TwoFaProviderInfo {
  type: TwoFactorAuthProviderType;
  useByDefault: boolean;
  contact?: string;
}

export interface TotpTwoFaAccountConfig {
  providerType: TwoFactorAuthProviderType.TOTP;
  authUrl?: string;
}

export interface SmsTwoFaAccountConfig {
  providerType: TwoFactorAuthProviderType.SMS;
  phoneNumber?: string;
}

export interface EmailTwoFaAccountConfig {
  providerType: TwoFactorAuthProviderType.EMAIL;
  email?: string;
}

export interface BackupCodeTwoFaAccountConfig {
  providerType: TwoFactorAuthProviderType.BACKUP_CODE;
  codes?: string[];
  codesLeft?: number;
}

export type TwoFactorAuthAccountConfig =
  | TotpTwoFaAccountConfig
  | SmsTwoFaAccountConfig
  | EmailTwoFaAccountConfig
  | BackupCodeTwoFaAccountConfig;

export interface AccountTwoFaSettings {
  configs: Record<TwoFactorAuthProviderType, TwoFactorAuthAccountConfig>;
}
