import apiClient from './core/client';
import { User } from '../../types/api';


export interface UpdateUserRequest {
    name?: string;
    email?: string;
    phone?: string;
    companyName?: string;
    role?: string;
    avatarUrl?: string;
}

export const userService = {
    searchUsers: async (query: string): Promise<User[]> => {
        return await apiClient.get<any, User[]>(`/users/search`, {
            params: { query },
        });
    },

    getMe: async (): Promise<User> => {
        return await apiClient.get<any, User>('/auth/me');
    },

    updateMe: async (data: UpdateUserRequest): Promise<User> => {
        return await apiClient.patch<any, User>('/users/me', data);
    },

    uploadAvatar: async (file: FormData): Promise<User> => {
        return await apiClient.post<any, User>('/users/me/avatar', file, {
            transformRequest: (data) => {
                return data; // Prevent axios from serializing FormData
            },
        });
    },

    getAvatarDownloadUrl: async (): Promise<{ avatarUrl: string }> => {
        return await apiClient.get<any, { avatarUrl: string }>('/users/me/avatar/download');
    },
};
