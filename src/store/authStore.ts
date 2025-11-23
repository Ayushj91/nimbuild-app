import { create } from 'zustand';
import { User } from '../types/api';
import { authService } from '../services/api/authService';
import { tokenStorage } from '../services/auth/tokenStorage';
import { wsClient } from '../services/websocket/websocketClient';

// Token expiration constants (from API docs)
const ACCESS_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours
const REFRESH_TOKEN_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const REFRESH_BEFORE_EXPIRY_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry

interface AuthState {
    isAuthenticated: boolean;
    user: User | null;
    isLoading: boolean;
    tokenExpiresAt: string | null;  // UTC timestamp
    refreshTokenExpiresAt: string | null;  // UTC timestamp
    login: (user: User, expiresAt?: string, refreshExpiresAt?: string) => void;
    setUser: (user: User) => void;
    logout: () => void;
    checkAuth: () => Promise<void>;
    startTokenRefreshTimer: () => void;
    stopTokenRefreshTimer: () => void;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: false,
    user: null,
    isLoading: true,
    tokenExpiresAt: null,
    refreshTokenExpiresAt: null,

    login: (user, expiresAt, refreshExpiresAt) => {
        // Calculate expiration times if not provided by server
        const now = new Date();
        const calculatedExpiresAt = expiresAt || new Date(now.getTime() + ACCESS_TOKEN_LIFETIME_MS).toISOString();
        const calculatedRefreshExpiresAt = refreshExpiresAt || new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS).toISOString();

        set({
            isAuthenticated: true,
            user,
            tokenExpiresAt: calculatedExpiresAt,
            refreshTokenExpiresAt: calculatedRefreshExpiresAt,
        });

        // Start proactive refresh timer
        get().startTokenRefreshTimer();
    },

    setUser: (user) => set({ user }),

    logout: async () => {
        get().stopTokenRefreshTimer();
        wsClient.disconnect();
        await authService.logout();
        set({
            isAuthenticated: false,
            user: null,
            tokenExpiresAt: null,
            refreshTokenExpiresAt: null,
        });
    },

    checkAuth: async () => {
        try {
            set({ isLoading: true });
            const token = await tokenStorage.getToken();
            if (token) {
                const user = await authService.getCurrentUser();

                // Try to restore expiration times from storage or calculate defaults
                const storedExpiresAt = await tokenStorage.getItem('tokenExpiresAt');
                const storedRefreshExpiresAt = await tokenStorage.getItem('refreshTokenExpiresAt');

                const now = new Date();
                const expiresAt = storedExpiresAt || new Date(now.getTime() + ACCESS_TOKEN_LIFETIME_MS).toISOString();
                const refreshExpiresAt = storedRefreshExpiresAt || new Date(now.getTime() + REFRESH_TOKEN_LIFETIME_MS).toISOString();

                set({
                    isAuthenticated: true,
                    user,
                    tokenExpiresAt: expiresAt,
                    refreshTokenExpiresAt: refreshExpiresAt,
                });

                // Start proactive refresh timer
                get().startTokenRefreshTimer();

                // Reconnect WebSocket on app startup
                if (user?.id) {
                    wsClient.connect(user.id).catch(error => {
                        console.error('Failed to connect WebSocket on startup:', error);
                    });
                }
            }
        } catch {
            // Token might be invalid or expired
            await tokenStorage.clearAll();
            set({
                isAuthenticated: false,
                user: null,
                tokenExpiresAt: null,
                refreshTokenExpiresAt: null,
            });
        } finally {
            set({ isLoading: false });
        }
    },

    startTokenRefreshTimer: () => {
        const state = get();

        // Clear existing timer
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
        }

        if (!state.tokenExpiresAt) return;

        const expiresAt = new Date(state.tokenExpiresAt).getTime();
        const now = Date.now();
        const timeUntilExpiry = expiresAt - now;

        // Schedule refresh 5 minutes before expiry
        const refreshTime = timeUntilExpiry - REFRESH_BEFORE_EXPIRY_MS;

        if (refreshTime > 0) {
            console.log(`[Auth] Token refresh scheduled in ${Math.round(refreshTime / 1000 / 60)} minutes`);

            refreshTimer = setTimeout(async () => {
                console.log('[Auth] Proactively refreshing token...');
                try {
                    const refreshToken = await tokenStorage.getRefreshToken();
                    if (refreshToken) {
                        const response = await authService.refreshToken(refreshToken);

                        // Update auth state with new tokens
                        get().login(response.user, response.expiresAt, response.refreshExpiresAt);

                        console.log('[Auth] Token refreshed successfully');
                    }
                } catch (error) {
                    console.error('[Auth] Failed to refresh token:', error);
                    // Token refresh failed, user will be logged out on next API call
                }
            }, refreshTime);
        } else if (timeUntilExpiry > 0) {
            // Token expires soon, refresh immediately
            console.log('[Auth] Token expires soon, refreshing immediately...');

            tokenStorage.getRefreshToken().then(async (refreshToken) => {
                if (refreshToken) {
                    try {
                        const response = await authService.refreshToken(refreshToken);
                        get().login(response.user, response.expiresAt, response.refreshExpiresAt);
                    } catch (error) {
                        console.error('[Auth] Failed to refresh token:', error);
                    }
                }
            });
        }
    },

    stopTokenRefreshTimer: () => {
        if (refreshTimer) {
            clearTimeout(refreshTimer);
            refreshTimer = null;
        }
    },
}));
