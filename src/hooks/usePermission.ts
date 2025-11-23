import { useState, useEffect } from 'react';
import { usePermissionContext } from '../contexts/PermissionContext';
import { Permission, hasPermission } from '../types/permissions';

export const useProjectPermission = (projectId: string) => {
    const { getProjectRole, loadProjectRole } = usePermissionContext();
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchRole = async () => {
            setIsLoading(true);
            try {
                // Try to get role (will use cache or fetch)
                const userRole = await getProjectRole(projectId);
                if (mounted) {
                    setRole(userRole);
                }
            } catch (error) {
                console.error('Error fetching permission role:', error);
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        if (projectId) {
            fetchRole();
        } else {
            setIsLoading(false);
        }

        return () => {
            mounted = false;
        };
    }, [projectId, getProjectRole]);

    const can = (permission: Permission): boolean => {
        if (!role) return false;
        return hasPermission(role, permission);
    };

    return {
        role,
        isLoading,
        can,
        refresh: () => loadProjectRole(projectId)
    };
};
