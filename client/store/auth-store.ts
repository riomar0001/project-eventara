import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Authentication } from '@/api/sdk.gen';
import { type AuthUser, decodeTokenUser, isTokenExpired } from '@/lib/token';

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  /**
   * Decode the access token, derive the user shape, and commit both tokens
   * to state. Called after any flow that issues a fresh token pair
   * (login-verify, email-verify).
   */
  setAuth: (accessToken: string, refreshToken: string) => void;

  /**
   * Wipe all auth state. Called on logout or after a failed refresh that
   * cannot be recovered.
   */
  clearAuth: () => void;

  /**
   * Exchange the stored refresh token for a fresh token pair. Returns true
   * on success, false if the refresh token is missing, expired, or rejected
   * by the server. Automatically calls clearAuth on failure.
   */
  tryRefresh: () => Promise<boolean>;

  /**
   * Run once on application mount. If the persisted refresh token is still
   * usable it obtains a fresh access token silently; otherwise auth state is
   * cleared. Sets isInitialized to true when complete so consumers can gate
   * on a stable, settled auth state.
   */
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isInitialized: false,

      setAuth(accessToken, refreshToken) {
        const user = decodeTokenUser(accessToken);
        set({ user, accessToken, refreshToken });
      },

      clearAuth() {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      async tryRefresh() {
        const { refreshToken } = get();

        if (!refreshToken) return false;

        try {
          const { data, error } = await Authentication.refreshTokenAuthRefreshPost({
            body: { refresh_token: refreshToken }
          });

          if (error || !data) {
            get().clearAuth();
            return false;
          }

          get().setAuth(data.access_token, data.refresh_token);
          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },

      async initialize() {
        const { accessToken, refreshToken } = get();

        if (!refreshToken) {
          set({ isInitialized: true });
          return;
        }

        const accessStillValid = accessToken !== null && !isTokenExpired(accessToken);

        if (accessStillValid) {
          const user = decodeTokenUser(accessToken!);
          set({ user, isInitialized: true });
          return;
        }

        await get().tryRefresh();
        set({ isInitialized: true });
      },
    }),
    {
      name: 'eventara-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: state => ({
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
      }),
    }
  )
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
