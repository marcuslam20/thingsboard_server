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
