// Generic API Response
export interface ApiResponse<T> {
    data: T;
    message?: string;
    status?: number;
}

// Pagination
export interface PaginatedResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
}

// Auth Types
export interface User {
    id: string;
    phone?: string;
    email?: string;
    name?: string;  // Now optional
    avatarUrl?: string;
    companyName?: string;  // NEW
    role?: string;  // NEW
    isVerified: boolean;
    status: 'ACTIVE' | 'PENDING' | 'DISABLED';
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
    expiresAt?: string;  // UTC timestamp when access token expires (24h from issue)
    refreshExpiresAt?: string;  // UTC timestamp when refresh token expires (7d from issue)
}

// Project Types
export interface Project {
    id: string;
    name: string;
    description?: string;
    createdBy: User;
    createdAt: string;
}

export interface ProjectMembership {
    id: string;
    project: Project;
    user: User;
    role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER';
    joinedAt: string;
}

// Task Types
export type TaskStatus = 'OPEN' | 'WIP' | 'INSPECTION' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CLOSED';

export type TaskCategory = 'SNAG' | 'QUALITY_ISSUE' | 'EHS_ISSUE' | 'OTHER';

export interface Task {
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: number;
    category?: TaskCategory;
    location?: string;
    startDate?: string;
    finishDate?: string;
    duration?: number;
    quantity?: number;
    unit?: string;
    assignedToId?: string;
    assignedTo?: User; // Added for robust filtering
    assignedToName?: string;
    assignedToPhone?: string;
    assignedToEmail?: string;
    ccUserIds?: string[];
    ccUsers?: CcUserInfo[];
    comments: Comment[];
    assets: AttachmentResponse[];
    commentCount: number;
    metadata?: string;
    dueDate?: string;
    blueprintId?: string;
    markerId?: string;
    createdById: string;
    createdByName: string;
    createdByPhone?: string;
    createdByEmail?: string;
    createdAt: string;
    updatedAt: string;
    isWatching?: boolean;
    watcherCount?: number;
    watcherIds?: string[];
}

export interface Comment {
    id: string;
    taskId: string;
    body: string;
    attachments: AttachmentResponse[];
    createdById: string;
    createdByName: string;
    createdByPhone?: string;
    createdByEmail?: string;
    createdByAvatarUrl?: string;
    replyToCommentId?: string;
    isEdited: boolean;
    createdAt: string;
    editedAt?: string;
    // Threading support
    // author object is not returned by API, using createdBy fields instead
    replyToComment?: {
        id: string;
        createdByName: string;
        createdById: string;
    };
    replies?: Comment[];
    replyCount?: number;
}

export interface AttachmentResponse {
    s3Key: string;
    type: 'image' | 'file' | 'document';
    filename: string;
    contentType: string;
    size: number;
    downloadUrl: string;
}

export interface CcUserInfo {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    avatarUrl?: string;
}

// Blueprint Types
export interface Blueprint {
    id: string;
    projectId: string;
    filename: string;
    fileUrl: string;
    fileType: 'pdf' | 'image/png' | 'image/jpeg';
    fileSize: number;
    width?: number;
    height?: number;
    thumbnailUrl?: string;
    markerCount?: number;
    uploadedById: string;
    uploadedByName: string;
    uploadedByEmail?: string;
    uploadedByPhone?: string;
    createdAt: string;
    updatedAt: string;
}

export interface BlueprintMarker {
    id: string;
    blueprintId: string;
    taskId: string;
    taskTitle?: string;
    taskStatus?: TaskStatus;
    taskPriority?: number;
    x: number;  // 0.0 to 1.0
    y: number;  // 0.0 to 1.0
    label?: string;
    color?: string;
    createdById: string;
    createdByName: string;
    createdAt: string;
    updatedAt: string;
}

export interface Assignment {
    id: string;
    task: Task;
    assignedBy: User;
    assignee: User;
    active: boolean;
    createdAt: string;
}

// Group Types
export interface Group {
    id: string;
    project?: Project;
    name: string;
    isDefault: boolean;
    createdBy: User;
    members?: User[];
    createdAt: string;
}

export interface GroupMessage {
    id: string;
    group: Group;
    sender: User;
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE';
    replyToMessageId?: string;
    replyToMessage?: GroupMessage;
    attachments?: AttachmentResponse[];
    reactions?: MessageReaction[];
    createdAt: string;
}

export interface MessageReaction {
    emoji: string;
    userId: string;
    userName: string;
}
