import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authApi } from '@/api/auth.api';
import { setTokens, clearTokens, getToken, isTokenValid } from '@/api/client';
import { User, AuthUser } from '@/models/user.model';
import { Authority } from '@/models/authority.model';
import { LoginRequest } from '@/models/login.model';
import { RootState } from './store';

interface AuthState {
  isAuthenticated: boolean;
  isUserLoaded: boolean;
  authUser: AuthUser | null;
  userDetails: User | null;
  requires2FA: boolean;
  requiresForce2FA: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  isUserLoaded: false,
  authUser: null,
  userDetails: null,
  requires2FA: false,
  requiresForce2FA: false,
};

function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      sub: payload.sub,
      scopes: payload.scopes || [],
      userId: payload.userId,
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      enabled: payload.enabled ?? true,
      tenantId: payload.tenantId,
      customerId: payload.customerId,
      isPublic: payload.isPublic ?? false,
      authority: payload.scopes?.[0] as Authority || Authority.ANONYMOUS,
    };
  } catch {
    return null;
  }
}

export const login = createAsyncThunk(
  'auth/login',
  async (request: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authApi.login(request);
      setTokens(response.token, response.refreshToken);
      const authUser = decodeJwt(response.token);
      const scope = authUser?.scopes?.[0];

      if (scope === Authority.PRE_VERIFICATION_TOKEN) {
        return { authUser, userDetails: null as User | null, requires2FA: true, requiresForce2FA: false };
      }
      if (scope === Authority.MFA_CONFIGURATION_TOKEN) {
        return { authUser, userDetails: null as User | null, requires2FA: false, requiresForce2FA: true };
      }

      const userDetails = await authApi.getUser();
      return { authUser, userDetails, requires2FA: false, requiresForce2FA: false };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  },
);

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    const token = getToken();
    if (!token || !isTokenValid()) {
      return null;
    }
    try {
      const authUser = decodeJwt(token);
      const scope = authUser?.scopes?.[0];

      if (scope === Authority.PRE_VERIFICATION_TOKEN) {
        return { authUser, userDetails: null as User | null, requires2FA: true, requiresForce2FA: false };
      }
      if (scope === Authority.MFA_CONFIGURATION_TOKEN) {
        return { authUser, userDetails: null as User | null, requires2FA: false, requiresForce2FA: true };
      }

      const userDetails = await authApi.getUser();
      return { authUser, userDetails, requires2FA: false, requiresForce2FA: false };
    } catch {
      clearTokens();
      return rejectWithValue('Session expired');
    }
  },
);

export const complete2FA = createAsyncThunk(
  'auth/complete2FA',
  async (_, { rejectWithValue }) => {
    try {
      const authUser = decodeJwt(getToken()!);
      const userDetails = await authApi.getUser();
      return { authUser, userDetails };
    } catch {
      return rejectWithValue('Failed to complete 2FA');
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await authApi.logout();
  } finally {
    clearTokens();
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuth: (state) => {
      state.isAuthenticated = false;
      state.requires2FA = false;
      state.requiresForce2FA = false;
      state.authUser = null;
      state.userDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(login.fulfilled, (state, action) => {
      state.isUserLoaded = true;
      if (action.payload.requires2FA) {
        state.isAuthenticated = false;
        state.requires2FA = true;
        state.requiresForce2FA = false;
        state.authUser = action.payload.authUser;
      } else if (action.payload.requiresForce2FA) {
        state.isAuthenticated = false;
        state.requires2FA = false;
        state.requiresForce2FA = true;
        state.authUser = action.payload.authUser;
      } else {
        state.isAuthenticated = true;
        state.requires2FA = false;
        state.requiresForce2FA = false;
        state.authUser = action.payload.authUser;
        state.userDetails = action.payload.userDetails;
      }
    });
    builder.addCase(login.rejected, (state) => {
      state.isAuthenticated = false;
      state.isUserLoaded = true;
      state.requires2FA = false;
      state.requiresForce2FA = false;
      state.authUser = null;
      state.userDetails = null;
    });

    builder.addCase(loadUser.fulfilled, (state, action) => {
      if (action.payload) {
        if (action.payload.requires2FA) {
          state.requires2FA = true;
          state.authUser = action.payload.authUser;
        } else if (action.payload.requiresForce2FA) {
          state.requiresForce2FA = true;
          state.authUser = action.payload.authUser;
        } else {
          state.isAuthenticated = true;
          state.authUser = action.payload.authUser;
          state.userDetails = action.payload.userDetails;
        }
      } else {
        state.isAuthenticated = false;
      }
      state.isUserLoaded = true;
    });
    builder.addCase(loadUser.rejected, (state) => {
      state.isAuthenticated = false;
      state.isUserLoaded = true;
      state.authUser = null;
      state.userDetails = null;
    });

    builder.addCase(complete2FA.fulfilled, (state, action) => {
      state.isAuthenticated = true;
      state.requires2FA = false;
      state.requiresForce2FA = false;
      state.authUser = action.payload.authUser;
      state.userDetails = action.payload.userDetails;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.requires2FA = false;
      state.requiresForce2FA = false;
      state.authUser = null;
      state.userDetails = null;
    });
  },
});

export const { clearAuth } = authSlice.actions;

export const selectIsAuthenticated = (state: RootState) => state.auth.isAuthenticated;
export const selectIsUserLoaded = (state: RootState) => state.auth.isUserLoaded;
export const selectAuthUser = (state: RootState) => state.auth.authUser;
export const selectUserDetails = (state: RootState) => state.auth.userDetails;
export const selectAuthority = (state: RootState) => state.auth.authUser?.authority;
export const selectRequires2FA = (state: RootState) => state.auth.requires2FA;
export const selectRequiresForce2FA = (state: RootState) => state.auth.requiresForce2FA;

export default authSlice.reducer;
