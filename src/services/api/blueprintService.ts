import apiClient from './core/client';
import { Blueprint, BlueprintMarker } from '../../types/api';
import { validateFile } from '../../utils/fileValidation';

// Request interfaces
export interface CreateBlueprintRequest {
    projectId: string;
    file: {
        uri: string;
        type: string;
        name: string;
    };
}

export interface CreateMarkerRequest {
    taskId: string;
    x: number;  // 0.0 to 1.0
    y: number;  // 0.0 to 1.0
    label?: string;
    color?: string;
}

export interface UpdateMarkerRequest {
    x?: number;
    y?: number;
    label?: string;
    color?: string;
}

export interface BlueprintListParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface MarkerListParams {
    taskId?: string;
    includeTaskDetails?: boolean;
}

export const blueprintService = {
    /**
     * Upload a new blueprint to a project
     */
    uploadBlueprint: async (
        projectId: string,
        file: { uri: string; type: string; name: string; size?: number }
    ): Promise<Blueprint> => {
        // Validate file before upload
        const validation = validateFile({
            size: file.size,
            type: file.type,
            name: file.name,
        });

        if (!validation.valid) {
            throw new Error(validation.error.message);
        }

        const formData = new FormData();
        formData.append('blueprint', {
            uri: file.uri,
            type: file.type,
            name: file.name,
        } as any);

        return await apiClient.post<any, Blueprint>(`/projects/${projectId}/blueprints`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            transformRequest: (data) => {
                return data;
            },
        });
    },

    /**
     * Download blueprint file
     */
    downloadBlueprint: async (projectId: string, blueprintId: string): Promise<{ downloadUrl: string; filename: string }> => {
        return await apiClient.get<any, { downloadUrl: string; filename: string }>(
            `/projects/${projectId}/blueprints/${blueprintId}/download`
        );
    },

    /**
     * List all blueprints for a project
     */
    listBlueprints: async (
        projectId: string,
        params?: BlueprintListParams
    ): Promise<{ blueprints: Blueprint[]; pagination: any }> => {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.search) queryParams.append('search', params.search);

        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await apiClient.get<any, { blueprints: Blueprint[]; pagination: any }>(
            `/projects/${projectId}/blueprints${query}`
        );
    },

    /**
     * Get a single blueprint by ID
     */
    getBlueprint: async (projectId: string, blueprintId: string): Promise<Blueprint> => {
        return await apiClient.get<any, Blueprint>(
            `/projects/${projectId}/blueprints/${blueprintId}`
        );
    },

    /**
     * Delete a blueprint
     */
    deleteBlueprint: async (projectId: string, blueprintId: string): Promise<void> => {
        await apiClient.delete(`/projects/${projectId}/blueprints/${blueprintId}`);
    },

    /**
     * Get download URL for a blueprint
     */
    getDownloadUrl: async (blueprintId: string): Promise<{ downloadUrl: string; expiresAt: string }> => {
        return await apiClient.get<any, { downloadUrl: string; expiresAt: string }>(
            `/blueprints/${blueprintId}/download`
        );
    },

    /**
     * Create a marker on a blueprint
     */
    createMarker: async (
        blueprintId: string,
        data: CreateMarkerRequest
    ): Promise<BlueprintMarker> => {
        return await apiClient.post<any, BlueprintMarker>(
            `/blueprints/${blueprintId}/markers`,
            data
        );
    },

    /**
     * List all markers for a blueprint
     */
    listMarkers: async (
        blueprintId: string,
        params?: MarkerListParams
    ): Promise<{ markers: BlueprintMarker[]; total: number }> => {
        const queryParams = new URLSearchParams();
        if (params?.taskId) queryParams.append('taskId', params.taskId);
        if (params?.includeTaskDetails) {
            queryParams.append('includeTaskDetails', 'true');
        }

        const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
        return await apiClient.get<any, { markers: BlueprintMarker[]; total: number }>(
            `/blueprints/${blueprintId}/markers${query}`
        );
    },

    /**
     * Update a marker
     */
    updateMarker: async (
        blueprintId: string,
        markerId: string,
        data: UpdateMarkerRequest
    ): Promise<BlueprintMarker> => {
        return await apiClient.put<any, BlueprintMarker>(
            `/blueprints/${blueprintId}/markers/${markerId}`,
            data
        );
    },

    /**
     * Delete a marker
     */
    deleteMarker: async (blueprintId: string, markerId: string): Promise<void> => {
        await apiClient.delete(`/blueprints/${blueprintId}/markers/${markerId}`);
    },
};
