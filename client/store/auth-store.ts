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
   * Store both tokens and the resolved user. Pass the decoded user explicitly
   * so callers can merge in any extra details not present in the JWT.
   */
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;

  /**
   * Merge partial details into the existing user (e.g. after onboarding).
   * No-ops when there is no authenticated user.
   */
  updateUser: (details: Partial<AuthUser>) => void;

  /**
   * Wipe all auth state. Called on logout or after a failed refresh.
   */
  clearAuth: () => void;

  /**
   * Exchange the stored refresh token for a fresh token pair. Preserves any
   * profile fields already on the user so they survive token rotation.
   */
  tryRefresh: () => Promise<boolean>;

  /**
   * Run once on application mount to settle auth state from sessionStorage.
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

      setAuth(accessToken, refreshToken, user) {
        set({ user, accessToken, refreshToken });
      },

      updateUser(details) {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...details } });
      },

      clearAuth() {
        set({ user: null, accessToken: null, refreshToken: null });
      },

      async tryRefresh() {
        const { refreshToken, user: currentUser } = get();

        if (!refreshToken) return false;

        try {
          const { data, error } = await Authentication.refreshTokenAuthRefreshPost({
            body: { refresh_token: refreshToken }
          });

          if (error || !data) {
            get().clearAuth();
            return false;
          }

          const freshUser = decodeTokenUser(data.access_token);
          if (!freshUser) {
            get().clearAuth();
            return false;
          }

          // Preserve any profile fields already stored (e.g. set after onboarding)
          // and overlay the identity fields from the new token.
          const mergedUser: AuthUser = { ...currentUser, ...freshUser };
          get().setAuth(data.access_token, data.refresh_token, mergedUser);
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

        if (accessToken !== null && !isTokenExpired(accessToken)) {
          // User is already rehydrated from sessionStorage by the persist
          // middleware — no need to re-decode and lose profile fields.
          set({ isInitialized: true });
          return;
        }

        await get().tryRefresh();
        set({ isInitialized: true });
      }
    }),
    {
      name: 'eventara-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
        user: state.user
      })
    }
  )
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
