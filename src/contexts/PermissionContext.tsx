import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/api/projectService';
import { Permission, hasPermission } from '../types/permissions';

interface PermissionContextType {
    // Check if user has permission in a project
    checkPermission: (projectId: string, permission: Permission) => Promise<boolean>;
    // Get user's role in a project
    getProjectRole: (projectId: string) => Promise<string | null>;
    // Clear cache for a project (e.g. after role update)
    clearProjectCache: (projectId: string) => void;
    // Pre-load role (e.g. when entering a project)
    loadProjectRole: (projectId: string) => Promise<void>;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuthStore();
    const [roleCache, setRoleCache] = useState<Record<string, string>>({});
    const [loadingProjects, setLoadingProjects] = useState<Set<string>>(new Set());

    const fetchUserRole = useCallback(async (projectId: string): Promise<string | null> => {
        if (!user?.id) return null;

        // Return cached role if available
        if (roleCache[projectId]) {
            return roleCache[projectId];
        }

        // Prevent duplicate fetches
        if (loadingProjects.has(projectId)) {
            // Wait for existing fetch (simple polling for now, could be improved)
            return new Promise((resolve) => {
                const checkCache = () => {
                    if (roleCache[projectId]) resolve(roleCache[projectId]);
                    else if (!loadingProjects.has(projectId)) resolve(null); // Fetch finished but no role found
                    else setTimeout(checkCache, 100);
                };
                checkCache();
            });
        }

        try {
            setLoadingProjects(prev => new Set(prev).add(projectId));

            // 1. Check if user is creator (if we had project details, but here we might need to fetch)
            // For now, we'll rely on the members list which should include the creator as ADMIN

            const members = await projectService.getProjectMembers(projectId);
            const membership = members.find(m => m.user.id === user.id);

            if (membership) {
                const role = membership.role;
                setRoleCache(prev => ({ ...prev, [projectId]: role }));
                return role;
            }

            return null;
        } catch (error) {
            console.error('Failed to fetch project role:', error);
            return null;
        } finally {
            setLoadingProjects(prev => {
                const next = new Set(prev);
                next.delete(projectId);
                return next;
            });
        }
    }, [user?.id, roleCache, loadingProjects]);

    const getProjectRole = useCallback(async (projectId: string): Promise<string | null> => {
        return fetchUserRole(projectId);
    }, [fetchUserRole]);

    const checkPermission = useCallback(async (projectId: string, permission: Permission): Promise<boolean> => {
        const role = await getProjectRole(projectId);
        if (!role) return false;
        return hasPermission(role, permission);
    }, [getProjectRole]);

    const clearProjectCache = useCallback((projectId: string) => {
        setRoleCache(prev => {
            const next = { ...prev };
            delete next[projectId];
            return next;
        });
    }, []);

    const loadProjectRole = useCallback(async (projectId: string) => {
        await fetchUserRole(projectId);
    }, [fetchUserRole]);

    return (
        <PermissionContext.Provider value={{ checkPermission, getProjectRole, clearProjectCache, loadProjectRole }}>
            {children}
        </PermissionContext.Provider>
    );
};

export const usePermissionContext = () => {
    const context = useContext(PermissionContext);
    if (!context) {
        throw new Error('usePermissionContext must be used within a PermissionProvider');
    }
    return context;
};
