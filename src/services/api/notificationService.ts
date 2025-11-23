import apiClient from './core/client';

export interface Notification {
    id: string;
    type: 'TASK_ASSIGNED' | 'TASK_UPDATED' | 'TASK_COMPLETED' | 'COMMENT_ADDED' | 'MENTION' | 'PROJECT_INVITE' | 'OTHER';
    title: string;
    message: string;
    isRead: boolean;
    data: {
        taskId?: string;
        projectId?: string;
        commentId?: string;
        groupId?: string;
        [key: string]: any;
    };
    createdAt: string;
    readAt?: string;
}

export interface NotificationListResponse {
    content: Notification[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export const notificationService = {
    /**
     * Get notifications with pagination
     */
    getNotifications: async (page = 0, size = 20): Promise<NotificationListResponse> => {
        return await apiClient.get<any, NotificationListResponse>('/notifications', {
            params: { page, size },
        });
    },

    /**
     * Get unread notification count
     */
    getUnreadCount: async (): Promise<{ count: number }> => {
        return await apiClient.get<any, { count: number }>('/notifications/unread-count');
    },

    /**
     * Mark a specific notification as read
     */
    markAsRead: async (notificationId: string): Promise<void> => {
        await apiClient.patch(`/notifications/${notificationId}/read`);
    },

    /**
     * Mark all notifications as read
     */
    markAllAsRead: async (): Promise<void> => {
        await apiClient.patch('/notifications/read-all');
    },
};
