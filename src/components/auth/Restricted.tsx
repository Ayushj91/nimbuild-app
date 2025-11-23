import React from 'react';
import { useProjectPermission } from '../../hooks/usePermission';
import { Permission } from '../../types/permissions';

interface RestrictedProps {
    to: Permission;
    projectId: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    loadingComponent?: React.ReactNode;
}

export const Restricted: React.FC<RestrictedProps> = ({
    to,
    projectId,
    children,
    fallback = null,
    loadingComponent = null
}) => {
    const { can, isLoading } = useProjectPermission(projectId);

    if (isLoading) {
        return loadingComponent ? <>{loadingComponent}</> : null;
    }

    if (can(to)) {
        return <>{children}</>;
    }

    return <>{fallback}</>;
};
