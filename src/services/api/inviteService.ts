import apiClient from './core/client';
import { AuthResponse } from '../../types/api';

export interface InvitePreview {
    inviteToken: string;
    project: {
        id: string;
        name: string;
        description?: string;
    };
    inviter: {
        id: string;
        name: string;
        email?: string;
    };
    role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER';
    expiresAt: string;
}

export const inviteService = {
    /**
     * Preview invite details before accepting
     */
    previewInvite: async (token: string): Promise<InvitePreview> => {
        return await apiClient.get<any, InvitePreview>(`/invites/${token}`);
    },

    /**
     * Accept invite and potentially create account
     */
    acceptInvite: async (token: string, otp: string, name?: string): Promise<AuthResponse> => {
        return await apiClient.post<any, AuthResponse>(`/invites/${token}/accept`, {
            otp,
            name,
        });
    },

    /**
     * Resend invite (if user has permission)
     */
    resendInvite: async (projectId: string, userId: string): Promise<void> => {
        await apiClient.post(`/projects/${projectId}/members/${userId}/resend-invite`);
    },
};
