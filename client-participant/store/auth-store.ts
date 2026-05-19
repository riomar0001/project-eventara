import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Auth } from '@/api/sdk.gen';
import { type AuthUser, decodeTokenUser, isTokenExpired } from '@/lib/auth/token';

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
}

interface AuthActions {
  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => void;
  updateUser: (details: Partial<AuthUser>) => void;
  clearAuth: () => void;
  tryRefresh: () => Promise<boolean>;
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
          const { data, error } = await Auth.refreshTokenAuthRefreshPost({
            body: { refresh_token: refreshToken },
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

          const mergedUser: AuthUser = { ...currentUser, ...freshUser };
          get().setAuth(data.access_token, data.refresh_token, mergedUser);
          return true;
        } catch {
          get().clearAuth();
          return false;
        }
      },

      async initialize() {
        if (get().isInitialized) return;
        const { accessToken, refreshToken } = get();

        if (!refreshToken) {
          set({ isInitialized: true });
          return;
        }

        if (accessToken !== null && !isTokenExpired(accessToken)) {
          set({ isInitialized: true });
          return;
        }

        await get().tryRefresh();
        set({ isInitialized: true });
      },
    }),
    {
      name: 'eventara-participant-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        refreshToken: state.refreshToken,
        accessToken: state.accessToken,
        user: state.user,
      }),
    }
  )
);

export const getAccessToken = () => useAuthStore.getState().accessToken;
