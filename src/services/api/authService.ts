import apiClient from './core/client';
import { AuthResponse, User } from '../../types/api';
import { tokenStorage } from '../auth/tokenStorage';

export const authService = {
    requestOtp: async (phone?: string, email?: string): Promise<string> => {
        const response = await apiClient.post<any, string>('/auth/otp/request', {
            phone,
            email,
        });
        return response;
    },

    verifyOtp: async (
        otp: string,
        phone?: string,
        email?: string,
        name?: string
    ): Promise<AuthResponse> => {
        const response = await apiClient.post<any, AuthResponse>('/auth/otp/verify', {
            otp,
            phone,
            email,
            name,
        });

        // Store tokens
        if (response.accessToken) {
            await tokenStorage.setToken(response.accessToken);
        }
        if (response.refreshToken) {
            await tokenStorage.setRefreshToken(response.refreshToken);
        }
        // Store expiration times if provided
        if (response.expiresAt) {
            await tokenStorage.setItem('tokenExpiresAt', response.expiresAt);
        }
        if (response.refreshExpiresAt) {
            await tokenStorage.setItem('refreshTokenExpiresAt', response.refreshExpiresAt);
        }

        return response;
    },

    getCurrentUser: async (): Promise<User> => {
        return await apiClient.get<any, User>('/auth/me');
    },

    logout: async (): Promise<void> => {
        try {
            // Call server logout endpoint to invalidate session
            await apiClient.post('/auth/logout');
        } catch (error) {
            // Ignore errors - still clear local tokens even if server call fails
            console.log('Logout endpoint error (ignored):', error);
        } finally {
            // Always clear local tokens
            await tokenStorage.clearAll();
        }
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await apiClient.post<any, AuthResponse>('/auth/refresh', {
            refreshToken,
        });

        // Store new tokens
        if (response.accessToken) {
            await tokenStorage.setToken(response.accessToken);
        }
        if (response.refreshToken) {
            await tokenStorage.setRefreshToken(response.refreshToken);
        }
        // Store expiration times if provided
        if (response.expiresAt) {
            await tokenStorage.setItem('tokenExpiresAt', response.expiresAt);
        }
        if (response.refreshExpiresAt) {
            await tokenStorage.setItem('refreshTokenExpiresAt', response.refreshExpiresAt);
        }

        return response;
    },
};
