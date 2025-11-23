import apiClient from './core/client';
import { Group, GroupMessage } from '../../types/api';

export interface CreateGroupRequest {
    name: string;
    projectId?: string;
}

export interface AddMemberRequest {
    userId: string;
}

export const groupService = {
    // Get all groups for current user
    getUserGroups: async (): Promise<Group[]> => {
        return await apiClient.get<any, Group[]>('/groups/user');
    },

    // Get all groups for a project
    getProjectGroups: async (projectId: string): Promise<Group[]> => {
        return await apiClient.get<any, Group[]>(`/projects/${projectId}/groups`);
    },

    // Create a new group
    createGroup: async (data: CreateGroupRequest): Promise<Group> => {
        return await apiClient.post<any, Group>('/groups', data);
    },

    // Get group details
    getGroupDetails: async (groupId: string): Promise<Group> => {
        return await apiClient.get<any, Group>(`/groups/${groupId}`);
    },

    // Add member to group
    addGroupMember: async (groupId: string, userId: string): Promise<void> => {
        return await apiClient.post<any, void>(`/groups/${groupId}/members`, { userId });
    },

    // Remove member from group
    removeGroupMember: async (groupId: string, userId: string): Promise<void> => {
        return await apiClient.delete<any, void>(`/groups/${groupId}/members/${userId}`);
    },

    // Get messages for a specific group
    getMessages: async (groupId: string): Promise<GroupMessage[]> => {
        return await apiClient.get<any, GroupMessage[]>(`/groups/${groupId}/messages`);
    },

    // Send a text message
    sendMessage: async (
        groupId: string,
        content: string,
        replyToMessageId?: string
    ): Promise<GroupMessage> => {
        return await apiClient.post<any, GroupMessage>(`/groups/${groupId}/messages`, {
            content,
            messageType: 'TEXT',
            replyToMessageId,
        });
    },

    // Send a message with asset
    sendMessageWithAsset: async (
        groupId: string,
        content: string,
        file: any,
        replyToMessageId?: string
    ): Promise<GroupMessage> => {
        const formData = new FormData();
        formData.append('content', content);
        formData.append('messageType', file.type?.startsWith('image') ? 'IMAGE' : 'FILE');
        if (replyToMessageId) {
            formData.append('replyToMessageId', replyToMessageId);
        }
        formData.append('asset', {
            uri: file.uri,
            type: file.type || 'application/octet-stream',
            name: file.name || `file_${Date.now()}`,
        } as any);

        return await apiClient.post<any, GroupMessage>(`/groups/${groupId}/messages`, formData, {
            transformRequest: (data) => data,
        });
    },

    // Get group assets
    getGroupAssets: async (groupId: string): Promise<any[]> => {
        return await apiClient.get<any, any[]>(`/groups/${groupId}/assets`);
    },

    // React to a message (if backend supports it)
    reactToMessage: async (groupId: string, messageId: string, emoji: string): Promise<void> => {
        return await apiClient.post<any, void>(`/groups/${groupId}/messages/${messageId}/reactions`, {
            emoji,
        });
    },
};
