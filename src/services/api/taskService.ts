import apiClient from './core/client';
import { Task, TaskStatus, TaskCategory, User } from '../../types/api';
import { validateFile } from '../../utils/fileValidation';

export interface CreateTaskRequest {
    title: string;
    description?: string;
    category?: TaskCategory;
    location?: string;
    blueprintId?: string;  // Blueprint reference
    startDate?: string;  // ISO 8601
    finishDate?: string;  // ISO 8601
    duration?: number;
    quantity?: number;
    unit?: string;
    status?: TaskStatus;
    priority?: number;
    dueDate?: string;  // ISO 8601
    metadata?: string;  // JSON string
    assignedToId?: string;  // Direct assignment ("To")
    ccUserIds?: string[];  // CC users
}

export interface UpdateTaskRequest {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: number;
    category?: TaskCategory;
    location?: string;
    blueprintId?: string;
    startDate?: string;
    finishDate?: string;
    duration?: number;
    quantity?: number;
    unit?: string;
    assignedToId?: string;
    ccUserIds?: string[];
    metadata?: string;
    dueDate?: string;
}

export interface TaskFilterParams {
    statuses?: TaskStatus[];
    assignedToId?: string;
    createdById?: string;
    groupId?: string;
    categories?: TaskCategory[];
    minPriority?: number;
    maxPriority?: number;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdueOnly?: boolean;
    location?: string;
    searchQuery?: string;
    sortBy?: 'createdAt' | 'updatedAt' | 'dueDate' | 'priority' | 'title';
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    size?: number;
}

export const taskService = {
    /**
     * Get tasks with optional filters and pagination
     * Uses POST /tasks/filter when filters are provided, GET /tasks otherwise
     */
    getTasks: async (projectId: string, filters?: TaskFilterParams): Promise<Task[]> => {
        // Use POST endpoint for filtering if filters are provided
        if (filters && Object.keys(filters).length > 0) {
            return await apiClient.post<any, Task[]>(`/projects/${projectId}/tasks/filter`, filters);
        }

        // Use GET endpoint for unfiltered requests
        return await apiClient.get<any, Task[]>(`/projects/${projectId}/tasks`);
    },

    createTask: async (projectId: string, data: CreateTaskRequest, attachments?: any[]): Promise<Task> => {
        // Validate attachments if present
        if (attachments && attachments.length > 0) {
            for (const file of attachments) {
                const validation = validateFile({
                    size: file.size || file.fileSize,
                    type: file.type || file.mimeType,
                    name: file.name || file.fileName,
                });

                if (!validation.valid) {
                    throw new Error(validation.error.message);
                }
            }
        }

        if (!attachments || attachments.length === 0) {
            // No attachments, send as JSON
            return await apiClient.post<any, Task>(`/projects/${projectId}/tasks`, data);
        }

        // With attachments, use FormData
        const formData = new FormData();
        formData.append('task', JSON.stringify(data));

        attachments.forEach((file, index) => {
            formData.append('assets', {
                uri: file.uri,
                type: file.type || 'application/octet-stream',
                name: file.name || `file_${index}`,
            } as any);
        });

        return await apiClient.post<any, Task>(`/projects/${projectId}/tasks`, formData, {
            transformRequest: (requestData) => {
                return requestData; // Prevent axios from serializing FormData
            },
        });
    },

    updateTask: async (projectId: string, taskId: string, data: UpdateTaskRequest, attachments?: any[]): Promise<Task> => {
        // Validate attachments if present
        if (attachments && attachments.length > 0) {
            for (const file of attachments) {
                const validation = validateFile({
                    size: file.size || file.fileSize,
                    type: file.type || file.mimeType,
                    name: file.name || file.fileName,
                });

                if (!validation.valid) {
                    throw new Error(validation.error.message);
                }
            }
        }

        if (!attachments || attachments.length === 0) {
            return await apiClient.patch<any, Task>(`/projects/${projectId}/tasks/${taskId}`, data);
        }

        const formData = new FormData();
        formData.append('task', JSON.stringify(data));

        attachments.forEach((file, index) => {
            formData.append('assets', {
                uri: file.uri,
                type: file.type || 'application/octet-stream',
                name: file.name || `file_${index}`,
            } as any);
        });

        return await apiClient.patch<any, Task>(`/projects/${projectId}/tasks/${taskId}`, formData, {
            transformRequest: (requestData) => {
                return requestData; // Prevent axios from serializing FormData
            },
        });
    },

    getTaskDetails: async (projectId: string, taskId: string): Promise<Task> => {
        return await apiClient.get<any, Task>(`/projects/${projectId}/tasks/${taskId}`);
    },

    deleteTask: async (projectId: string, taskId: string): Promise<void> => {
        return await apiClient.delete<any, void>(`/projects/${projectId}/tasks/${taskId}`);
    },

    updateTaskStatus: async (projectId: string, taskId: string, status: TaskStatus): Promise<Task> => {
        // Use main update endpoint with status field
        return await apiClient.patch<any, Task>(`/projects/${projectId}/tasks/${taskId}`, {
            status,
        });
    },

    /**
     * Assign task to user
     */
    assignTask: async (
        projectId: string,
        taskId: string,
        params: {
            assigneeId?: string;
            assigneePhone?: string;
            assigneeEmail?: string;
        }
    ): Promise<any> => {
        return await apiClient.post(`/projects/${projectId}/tasks/${taskId}/assign`, params);
    },

    /**
     * Get visible assignee (resolves assignment chain)
     */
    getVisibleAssignee: async (projectId: string, taskId: string): Promise<{ assignee: User | null }> => {
        return await apiClient.get<any, { assignee: User | null }>(`/projects/${projectId}/tasks/${taskId}/visible-assignee`);
    },

    /**
     * Get all assignments in the chain
     */
    getAssignments: async (projectId: string, taskId: string): Promise<any[]> => {
        return await apiClient.get<any, any[]>(`/projects/${projectId}/tasks/${taskId}/assignments`);
    },

    /**
     * Watch a task for updates
     */
    watchTask: async (projectId: string, taskId: string): Promise<Task> => {
        return await apiClient.post<any, Task>(`/projects/${projectId}/tasks/${taskId}/watch`);
    },

    /**
     * Unwatch a task
     */
    unwatchTask: async (projectId: string, taskId: string): Promise<Task> => {
        return await apiClient.delete<any, Task>(`/projects/${projectId}/tasks/${taskId}/watch`);
    },

    /**
     * Get task activity timeline
     */
    getActivity: async (projectId: string, taskId: string): Promise<any[]> => {
        return await apiClient.get<any, any[]>(`/projects/${projectId}/tasks/${taskId}/activity`);
    },
};
