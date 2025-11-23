import apiClient from './core/client';
import { Comment } from '../../types/api';

export interface CreateCommentRequest {
    body: string;
    replyToCommentId?: string;
    attachments?: {
        s3Key: string;
        type: 'image' | 'file' | 'document';
        filename: string;
        contentType: string;
        size: number;
    }[];
}

export interface UpdateCommentRequest {
    body?: string;
    attachments?: {
        s3Key: string;
        type: 'image' | 'file' | 'document';
        filename: string;
        contentType: string;
        size: number;
    }[];
}

export const commentService = {
    getComments: async (projectId: string, taskId: string): Promise<Comment[]> => {
        return await apiClient.get<any, Comment[]>(`/projects/${projectId}/tasks/${taskId}/comments`);
    },

    createComment: async (projectId: string, taskId: string, data: CreateCommentRequest): Promise<Comment> => {
        return await apiClient.post<any, Comment>(`/projects/${projectId}/tasks/${taskId}/comments`, data);
    },

    getCommentDetails: async (projectId: string, taskId: string, commentId: string): Promise<Comment> => {
        return await apiClient.get<any, Comment>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
    },

    updateComment: async (projectId: string, taskId: string, commentId: string, data: UpdateCommentRequest): Promise<Comment> => {
        return await apiClient.patch<any, Comment>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, data);
    },

    deleteComment: async (projectId: string, taskId: string, commentId: string): Promise<void> => {
        await apiClient.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`);
    },

    uploadAttachment: async (projectId: string, taskId: string, commentId: string, file: FormData): Promise<{ s3Key: string; message: string }> => {
        return await apiClient.post<any, { s3Key: string; message: string }>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}/attachments`, file, {
            transformRequest: (data) => {
                return data; // Prevent axios from serializing FormData
            },
        });
    },

    /**
     * Get comment thread with nested replies
     */
    getCommentThread: async (projectId: string, taskId: string, commentId: string): Promise<Comment> => {
        return await apiClient.get<any, Comment>(`/projects/${projectId}/tasks/${taskId}/comments/threads/${commentId}`);
    },

    /**
     * Get direct replies to a comment
     */
    getCommentReplies: async (projectId: string, taskId: string, commentId: string): Promise<Comment[]> => {
        return await apiClient.get<any, Comment[]>(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}/replies`);
    },

    getAttachmentDownloadUrl: async (projectId: string, taskId: string, commentId: string, s3Key: string): Promise<{ downloadUrl: string }> => {
        return await apiClient.get<any, { downloadUrl: string }>(
            `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/attachments/${encodeURIComponent(s3Key)}/download`
        );
    },
};
