import apiClient from './core/client';
import { Project, ProjectMembership } from '../../types/api';

export interface CreateProjectRequest {
    name: string;
    description?: string;
}

export const projectService = {
    getProjects: async (): Promise<Project[]> => {
        return await apiClient.get<any, Project[]>('/projects');
    },

    createProject: async (data: CreateProjectRequest): Promise<Project> => {
        return await apiClient.post<any, Project>('/projects', data);
    },

    getProjectDetails: async (projectId: string): Promise<Project> => {
        return await apiClient.get<any, Project>(`/projects/${projectId}`);
    },

    getProjectMembers: async (projectId: string): Promise<ProjectMembership[]> => {
        return await apiClient.get<any, ProjectMembership[]>(`/projects/${projectId}/members`);
    },

    addMember: async (
        projectId: string,
        params: {
            userId?: string;
            userPhone?: string;
            userEmail?: string;
            role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER';
        }
    ): Promise<ProjectMembership> => {
        return await apiClient.post<any, ProjectMembership>(`/projects/${projectId}/members`, params);
    },

    /**
     * Update project details
     */
    updateProject: async (projectId: string, data: { name?: string; description?: string }): Promise<Project> => {
        return await apiClient.patch<any, Project>(`/projects/${projectId}`, data);
    },

    /**
     * Delete a project
     */
    deleteProject: async (projectId: string): Promise<void> => {
        await apiClient.delete(`/projects/${projectId}`);
    },

    /**
     * Update member role
     */
    updateMemberRole: async (projectId: string, userId: string, role: string): Promise<ProjectMembership> => {
        return await apiClient.patch<any, ProjectMembership>(`/projects/${projectId}/members/${userId}`, { role });
    },

    /**
     * Remove member from project
     */
    removeMember: async (projectId: string, userId: string): Promise<void> => {
        await apiClient.delete(`/projects/${projectId}/members/${userId}`);
    },
};
