export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  scope?: string;
}

export interface SignupRequest {
  email: string;
  verificationCode: string;
  password: string;
  companyName: string;
  country?: string;
}
