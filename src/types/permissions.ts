

export enum Permission {
    // Project Permissions
    VIEW_PROJECT = 'VIEW_PROJECT',
    UPDATE_PROJECT = 'UPDATE_PROJECT',
    DELETE_PROJECT = 'DELETE_PROJECT',
    MANAGE_PROJECT_SETTINGS = 'MANAGE_PROJECT_SETTINGS',

    // Member Permissions
    VIEW_MEMBERS = 'VIEW_MEMBERS',
    ADD_MEMBER = 'ADD_MEMBER',
    REMOVE_MEMBER = 'REMOVE_MEMBER',
    UPDATE_MEMBER_ROLE = 'UPDATE_MEMBER_ROLE',

    // Task Permissions
    VIEW_TASKS = 'VIEW_TASKS',
    CREATE_TASK = 'CREATE_TASK',
    UPDATE_TASK = 'UPDATE_TASK',
    DELETE_TASK = 'DELETE_TASK',
    ASSIGN_TASK = 'ASSIGN_TASK',
    COMMENT_ON_TASK = 'COMMENT_ON_TASK',
    WATCH_TASK = 'WATCH_TASK',

    // Group Permissions
    VIEW_GROUPS = 'VIEW_GROUPS',
    CREATE_GROUP = 'CREATE_GROUP',
    SEND_MESSAGES = 'SEND_MESSAGES',
    MANAGE_GROUP_MEMBERS = 'MANAGE_GROUP_MEMBERS',

    // Blueprint Permissions
    VIEW_BLUEPRINTS = 'VIEW_BLUEPRINTS',
    UPLOAD_BLUEPRINT = 'UPLOAD_BLUEPRINT',
    MANAGE_MARKERS = 'MANAGE_MARKERS',
    DELETE_BLUEPRINT = 'DELETE_BLUEPRINT',
}

// Map roles to their permissions
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    ADMIN: [
        // Project
        Permission.VIEW_PROJECT,
        Permission.UPDATE_PROJECT,
        Permission.DELETE_PROJECT,
        Permission.MANAGE_PROJECT_SETTINGS,
        // Members
        Permission.VIEW_MEMBERS,
        Permission.ADD_MEMBER,
        Permission.REMOVE_MEMBER,
        Permission.UPDATE_MEMBER_ROLE,
        // Tasks
        Permission.VIEW_TASKS,
        Permission.CREATE_TASK,
        Permission.UPDATE_TASK,
        Permission.DELETE_TASK,
        Permission.ASSIGN_TASK,
        Permission.COMMENT_ON_TASK,
        Permission.WATCH_TASK,
        // Groups
        Permission.VIEW_GROUPS,
        Permission.CREATE_GROUP,
        Permission.SEND_MESSAGES,
        Permission.MANAGE_GROUP_MEMBERS,
        // Blueprints
        Permission.VIEW_BLUEPRINTS,
        Permission.UPLOAD_BLUEPRINT,
        Permission.MANAGE_MARKERS,
        Permission.DELETE_BLUEPRINT,
    ],
    PROJECT_MANAGER: [
        // Project
        Permission.VIEW_PROJECT,
        // Members
        Permission.VIEW_MEMBERS,
        // Tasks
        Permission.VIEW_TASKS,
        Permission.CREATE_TASK,
        Permission.UPDATE_TASK,
        Permission.ASSIGN_TASK,
        Permission.COMMENT_ON_TASK,
        Permission.WATCH_TASK,
        // Groups
        Permission.VIEW_GROUPS,
        Permission.CREATE_GROUP,
        Permission.SEND_MESSAGES,
        Permission.MANAGE_GROUP_MEMBERS,
        // Blueprints
        Permission.VIEW_BLUEPRINTS,
        Permission.UPLOAD_BLUEPRINT,
        Permission.MANAGE_MARKERS,
    ],
    MEMBER: [
        // Project
        Permission.VIEW_PROJECT,
        // Members
        Permission.VIEW_MEMBERS,
        // Tasks
        Permission.VIEW_TASKS,
        Permission.CREATE_TASK,
        Permission.UPDATE_TASK,
        Permission.ASSIGN_TASK, // Can assign if assigned/creator (logic handled in hook)
        Permission.COMMENT_ON_TASK,
        Permission.WATCH_TASK,
        // Groups
        Permission.VIEW_GROUPS,
        Permission.CREATE_GROUP,
        Permission.SEND_MESSAGES,
        // Blueprints
        Permission.VIEW_BLUEPRINTS,
        Permission.UPLOAD_BLUEPRINT,
        Permission.MANAGE_MARKERS,
    ],
    VIEWER: [
        // Project
        Permission.VIEW_PROJECT,
        // Members
        Permission.VIEW_MEMBERS,
        // Tasks
        Permission.VIEW_TASKS,
        Permission.WATCH_TASK,
        // Groups
        Permission.VIEW_GROUPS,
        // Blueprints
        Permission.VIEW_BLUEPRINTS,
    ],
};

// Helper to check if a role has a permission
export const hasPermission = (role: string, permission: Permission): boolean => {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.includes(permission);
};
