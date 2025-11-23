import apiClient from './core/client';
import { Task } from '../../types/api';
import { CursorResponse } from '../../hooks/useCursorPagination';



export const feedService = {
    // Get tasks assigned to the current user
    getAssignedToMe: async (cursor?: string, limit = 20): Promise<CursorResponse<Task>> => {
        const response = await apiClient.get<any, any>('/feeds/assigned-to-me', {
            params: { cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },

    // Get tasks assigned by the current user (created by me)
    getAssignedByMe: async (cursor?: string, limit = 20): Promise<CursorResponse<Task>> => {
        const response = await apiClient.get<any, any>('/feeds/assigned-by-me', {
            params: { cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },

    // Get project general feed
    getProjectFeed: async (projectId: string, cursor?: string, limit = 20): Promise<CursorResponse<any>> => {
        const response = await apiClient.get<any, any>(`/feeds/projects/${projectId}/general`, {
            params: { cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },

    // Search tasks across all projects
    searchTasks: async (query: string, cursor?: string, limit = 20): Promise<CursorResponse<Task>> => {
        const response = await apiClient.get<any, any>('/feeds/search', {
            params: { q: query, cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },

    // Get tasks the user is watching
    getWatchingFeed: async (cursor?: string, limit = 20): Promise<CursorResponse<Task>> => {
        const response = await apiClient.get<any, any>('/feeds/watching', {
            params: { cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },

    // Get recently viewed tasks
    getRecentFeed: async (cursor?: string, limit = 20): Promise<CursorResponse<Task>> => {
        const response = await apiClient.get<any, any>('/feeds/recent', {
            params: { cursor, limit }
        });

        // Support both cursor and legacy array response
        if (Array.isArray(response)) {
            return {
                content: response,
                nextCursor: undefined,
                hasNext: false
            };
        }

        return response;
    },
};
