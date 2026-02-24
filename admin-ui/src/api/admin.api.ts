import api from './client';

// --- Settings types ---

export interface AdminSettings<T = Record<string, unknown>> {
  id?: { id: string; entityType: string };
  key: string;
  jsonValue: T;
}

export interface GeneralSettings {
  baseUrl: string;
  prohibitDifferentUrl?: boolean;
}

export interface ConnectivityProtocol {
  enabled: boolean;
  host: string;
  port: number;
}

export interface ConnectivitySettings {
  http: ConnectivityProtocol;
  https: ConnectivityProtocol;
  mqtt: ConnectivityProtocol;
  mqtts: ConnectivityProtocol;
  coap: ConnectivityProtocol;
  coaps: ConnectivityProtocol;
}

export interface MailSettings {
  mailFrom: string;
  smtpProtocol: string;
  smtpHost: string;
  smtpPort: number;
  timeout: number;
  enableTls: boolean;
  tlsVersion?: string;
  enableProxy: boolean;
  proxyHost?: string;
  proxyPort?: number;
  proxyUser?: string;
  proxyPassword?: string;
  username?: string;
  password?: string;
  enableOauth2?: boolean;
  providerId?: string;
  clientId?: string;
  clientSecret?: string;
  providerTenantId?: string;
  authUri?: string;
  tokenUri?: string;
  scope?: string[];
  redirectUri?: string;
  tokenGenerated?: boolean;
}

export interface SmsSettings {
  type: string;
  configuration: Record<string, unknown>;
}

export interface SecuritySettings {
  maxFailedLoginAttempts: number;
  userLockoutNotificationEmail?: string;
  userActivationTokenTtl: number;
  passwordResetTokenTtl: number;
  mobileSecretKeyLength?: number;
  passwordPolicy: PasswordPolicy;
}

export interface PasswordPolicy {
  minimumLength: number;
  maximumLength?: number;
  minimumUppercaseLetters: number;
  minimumLowercaseLetters: number;
  minimumDigits: number;
  minimumSpecialCharacters: number;
  passwordExpirationPeriodDays?: number;
  passwordReuseFrequencyDays?: number;
  allowWhitespaces: boolean;
  forceUserToResetPasswordIfNotValid?: boolean;
}

export interface JwtSettings {
  tokenIssuer: string;
  tokenSigningKey: string;
  tokenExpirationTime: number;
  refreshTokenExpTime: number;
}

export interface TwoFaSettings {
  providers: TwoFaProvider[];
  totalAllowedTimeForVerification: number;
  minVerificationCodeSendPeriod: number;
  maxVerificationFailuresBeforeUserLockout?: number;
  verificationCodeCheckRateLimitEnable?: boolean;
  verificationCodeCheckRateLimitNumber?: number;
  verificationCodeCheckRateLimitTime?: number;
}

export interface TwoFaProvider {
  providerType: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODE';
  enable?: boolean;
  issuerName?: string;
  smsVerificationMessageTemplate?: string;
  verificationCodeLifetime?: number;
  codesQuantity?: number;
}

export interface NotificationSettings {
  deliveryMethodsConfigs: {
    SLACK?: { botToken?: string };
    MOBILE_APP?: {
      firebaseServiceAccountCredentials?: string;
      firebaseServiceAccountCredentialsFileName?: string;
    };
  };
}

export interface HomeDashboardInfo {
  dashboardId?: { id: string; entityType: string } | null;
  hideDashboardToolbar?: boolean;
}

export interface OAuth2Client {
  id?: { id: string; entityType: string };
  createdTime?: number;
  title: string;
  clientId: string;
  clientSecret: string;
  accessTokenUri: string;
  authorizationUri: string;
  scope: string[];
  platforms: string[];
  loginButtonLabel?: string;
  loginButtonIcon?: string;
  userInfoUri?: string;
  jwkSetUri?: string;
  clientAuthenticationMethod?: string;
  userNameAttributeName?: string;
  mapperConfig?: Record<string, unknown>;
  additionalInfo?: Record<string, unknown>;
}

// --- API ---

export const adminApi = {
  // General Settings
  getGeneralSettings(): Promise<AdminSettings<GeneralSettings>> {
    return api.get('/api/admin/settings/general').then((r) => r.data);
  },

  getConnectivitySettings(): Promise<AdminSettings<ConnectivitySettings>> {
    return api.get('/api/admin/settings/connectivity').then((r) => r.data);
  },

  saveAdminSettings<T>(settings: AdminSettings<T>): Promise<AdminSettings<T>> {
    return api.post('/api/admin/settings', settings).then((r) => r.data);
  },

  // Mail Settings
  getMailSettings(): Promise<AdminSettings<MailSettings>> {
    return api.get('/api/admin/settings/mail').then((r) => r.data);
  },

  sendTestMail(settings: AdminSettings<MailSettings>): Promise<void> {
    return api.post('/api/admin/settings/testMail', settings).then(() => undefined);
  },

  // SMS Settings
  getSmsSettings(): Promise<AdminSettings<SmsSettings>> {
    return api.get('/api/admin/settings/sms').then((r) => r.data);
  },

  sendTestSms(settings: AdminSettings<SmsSettings>, phoneNumber: string): Promise<void> {
    return api.post('/api/admin/settings/testSms', { ...settings, phoneNumber }).then(() => undefined);
  },

  // Notification Settings
  getNotificationSettings(): Promise<NotificationSettings> {
    return api.get('/api/notification/settings').then((r) => r.data);
  },

  saveNotificationSettings(settings: NotificationSettings): Promise<NotificationSettings> {
    return api.post('/api/notification/settings', settings).then((r) => r.data);
  },

  // Security Settings
  getSecuritySettings(): Promise<SecuritySettings> {
    return api.get('/api/admin/securitySettings').then((r) => r.data);
  },

  saveSecuritySettings(settings: SecuritySettings): Promise<SecuritySettings> {
    return api.post('/api/admin/securitySettings', settings).then((r) => r.data);
  },

  // JWT Settings
  getJwtSettings(): Promise<JwtSettings> {
    return api.get('/api/admin/jwtSettings').then((r) => r.data);
  },

  saveJwtSettings(settings: JwtSettings): Promise<JwtSettings> {
    return api.post('/api/admin/jwtSettings', settings).then((r) => r.data);
  },

  // 2FA Settings
  getTwoFaSettings(): Promise<TwoFaSettings> {
    return api.get('/api/2fa/settings').then((r) => r.data);
  },

  saveTwoFaSettings(settings: TwoFaSettings): Promise<TwoFaSettings> {
    return api.post('/api/2fa/settings', settings).then((r) => r.data);
  },

  // Home Dashboard
  getHomeDashboardInfo(): Promise<HomeDashboardInfo> {
    return api.get('/api/dashboard/tenantHomeDashboardInfo').then((r) => r.data);
  },

  saveHomeDashboardInfo(info: HomeDashboardInfo): Promise<HomeDashboardInfo> {
    return api.post('/api/dashboard/tenantHomeDashboardInfo', info).then((r) => r.data);
  },

  // OAuth2 Clients
  getOAuth2Clients(): Promise<OAuth2Client[]> {
    return api.get('/api/oauth2/client').then((r) => r.data);
  },

  saveOAuth2Client(client: OAuth2Client): Promise<OAuth2Client> {
    return api.post('/api/oauth2/client', client).then((r) => r.data);
  },

  deleteOAuth2Client(clientId: string): Promise<void> {
    return api.delete(`/api/oauth2/client/${clientId}`).then(() => undefined);
  },
};
