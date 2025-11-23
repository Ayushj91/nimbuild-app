# Nimbuild - Complete Frontend API Documentation

> **For Frontend Developers**: This document contains every API endpoint, request/response format, flow, and WebSocket event that your frontend needs to implement.

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication Flow](#authentication-flow)
3. [Project Management](#project-management)
4. [Task Management](#task-management)
5. [Comment System](#comment-system)
6. [Metadata Templates](#metadata-templates)
7. [Feeds](#feeds)
8. [Groups](#groups)
9. [Invites](#invites)
10. [Notifications](#notifications)
11. [Assets](#assets)
12. [Users](#users)
13. [WebSocket Events](#websocket-events)
14. [Error Handling](#error-handling)
15. [TypeScript Interfaces](#typescript-interfaces)

---

## Base Configuration

### Base URL
```
Production: http://13.203.46.227:8080/api
Local: http://localhost:8080/api
```

### Authentication Header
All authenticated endpoints require:
```
Authorization: Bearer <access_token>
```

### Content Types
- **JSON**: `application/json` (most endpoints)
- **File Upload**: `multipart/form-data` (asset uploads)
- **Form Data**: `application/x-www-form-urlencoded` (some endpoints)

---

## Authentication Flow

### 1. Request OTP

**Endpoint**: `POST /auth/otp/request`

**Request Body**:
```json
{
  "phone": "+1234567890",  // Optional, E.164 format
  "email": "user@example.com"  // Optional, valid email format
}
```

**Response** (200 OK):
```json
"OTP sent successfully"
```

**Error Responses**:
- `400 Bad Request`: Invalid phone/email format, rate limit exceeded
- `500 Internal Server Error`: SMS/Email service failure

**Flow**:
1. User enters phone or email
2. Frontend sends request
3. Backend generates 6-digit OTP
4. OTP sent via SMS (Twilio) or Email
5. OTP stored in Redis with 5-10 minute expiration
6. Frontend shows "OTP sent" message

---

### 2. Verify OTP & Login

**Endpoint**: `POST /auth/otp/verify`

**Request Body**:
```json
{
  "phone": "+1234567890",  // Required if used in request
  "email": "user@example.com",  // Required if used in request
  "otp": "123456",  // Required, 6-digit code
  "name": "John Doe"  // Required for new users
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "status": "ACTIVE",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid or expired OTP
- `400 Bad Request`: Missing name for new user

**Flow**:
1. User enters OTP
2. Frontend sends verification request
3. Backend validates OTP
4. User created/updated in database
5. JWT tokens generated (access: 24h, refresh: 7d)
6. Frontend stores tokens and user data
7. Navigate to app home

**Token Storage**:
- Store `accessToken` in memory or secure storage
- Store `refreshToken` in secure storage (localStorage/sessionStorage)
- Store `user` object in app state

---

### 3. Get Current User

**Endpoint**: `GET /auth/me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "+1234567890",
  "email": "user@example.com",
  "name": "John Doe",
  "isVerified": true,
  "status": "ACTIVE",
  "avatarUrl": null,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid token
- `400 Bad Request`: User not found

**Use Case**: Verify token validity, get user info on app startup

---

### 4. Refresh Token

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+1234567890",
    "email": "user@example.com",
    "name": "John Doe",
    "isVerified": true,
    "status": "ACTIVE",
    "avatarUrl": null,
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Invalid or expired refresh token
- `401 Unauthorized`: User account not active

**Flow**:
1. Access token expires (24h)
2. Frontend detects 401 response
3. Automatically call refresh endpoint
4. Update stored tokens
5. Retry original request with new token

---

## Project Management

### 1. Create Project

**Endpoint**: `POST /projects`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Construction Project Alpha",
  "description": "Building a new office complex"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Construction Project Alpha",
  "description": "Building a new office complex",
  "createdBy": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe"
  },
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid request body
- `400 Bad Request`: Name is required

**Notes**:
- Creator automatically added as ADMIN
- Default "All" group created automatically

---

### 2. Get User Projects

**Endpoint**: `GET /projects`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Construction Project Alpha",
    "description": "Building a new office complex",
    "createdBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
]
```

**Use Case**: Display project list in sidebar/navigation

---

### 3. Get Project Details

**Endpoint**: `GET /projects/{projectId}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Path Parameters**:
- `projectId` (UUID): Project identifier

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Construction Project Alpha",
  "description": "Building a new office complex",
  "createdBy": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe"
  },
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Access denied (not a member)
- `400 Bad Request`: Project not found

---

### 4. Add Project Member

**Endpoint**: `POST /projects/{projectId}/members`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userPhone": "+1234567890",  // Optional
  "userEmail": "user@example.com",  // Optional
  "userId": "550e8400-e29b-41d4-a716-446655440001",  // Optional
  "role": "MEMBER"  // Required: ADMIN, PROJECT_MANAGER, MEMBER, VIEWER
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "project": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "Construction Project Alpha"
  },
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Doe",
    "phone": "+1234567890",
    "email": "user@example.com"
  },
  "role": "MEMBER",
  "addedBy": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "John Doe"
  },
  "createdAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Only admins can add members
- `400 Bad Request`: User not found
- `400 Bad Request`: User already a member

**Notes**:
- If user doesn't exist, a pending user is created
- Pending user receives invite via SMS/Email
- User automatically added to default "All" group

---

### 5. Get Project Members

**Endpoint**: `GET /projects/{projectId}/members`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "project": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Construction Project Alpha"
    },
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Doe",
      "phone": "+1234567890",
      "email": "user@example.com"
    },
    "role": "MEMBER",
    "addedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "John Doe"
    },
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

### 6. Update Member Role

**Endpoint**: `PATCH /projects/{projectId}/members/{userId}`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters**:
- `projectId` (UUID): Project identifier
- `userId` (UUID): User identifier

**Request Body**:
```json
{
  "role": "PROJECT_MANAGER"  // ADMIN, PROJECT_MANAGER, MEMBER, VIEWER
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "PROJECT_MANAGER",
  "updatedAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Only admins can update roles

---

### 7. Remove Member

**Endpoint**: `DELETE /projects/{projectId}/members/{userId}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
"Member removed successfully"
```

**Error Responses**:
- `400 Bad Request`: Only admins can remove members

---

### 8. Get Project Groups

**Endpoint**: `GET /projects/{projectId}/groups`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "All",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "isDefault": true,
    "memberCount": 5,
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

## Task Management

### 1. Create Task

**Endpoint**: `POST /projects/{projectId}/tasks`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Pour concrete for foundation",
  "description": "Use mix 1:2:4, depth 6 inches",
  "assigneeId": "550e8400-e29b-41d4-a716-446655440001",  // Optional
  "assigneePhone": "+1234567890",  // Optional
  "assigneeEmail": "worker@example.com",  // Optional
  "assignedToId": "550e8400-e29b-41d4-a716-446655440001",  // Direct assignment (To field)
  "ccUserIds": ["550e8400-e29b-41d4-a716-446655440002"],  // CC users
  "metadata": "{\"area\":\"Block A\",\"phase\":\"Foundation\"}",  // Optional JSON string
  "dueDate": "2024-12-31T23:59:59Z",  // Optional ISO 8601
  "category": "SNAG",  // Optional: SNAG, QUALITY_ISSUE, EHS_ISSUE, OTHER
  "location": "Building A, Floor 2",  // Optional
  "startDate": "2024-01-15T08:00:00Z",  // Optional
  "finishDate": "2024-01-20T17:00:00Z",  // Optional
  "duration": 40,  // Optional, in hours
  "quantity": 100.5,  // Optional
  "unit": "kg"  // Optional: hours, days, pieces, kg, etc.
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440002",
  "projectName": "Construction Project Alpha",
  "title": "Pour concrete for foundation",
  "description": "Use mix 1:2:4, depth 6 inches",
  "status": "OPEN",
  "priority": 0,
  "metadata": "{\"area\":\"Block A\",\"phase\":\"Foundation\"}",
  "createdById": "550e8400-e29b-41d4-a716-446655440003",
  "createdByName": "John Doe",
  "createdByPhone": "+1234567890",
  "createdByEmail": "john@example.com",
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00",
  "dueDate": "2024-12-31T23:59:59Z",
  "category": "SNAG",
  "location": "Building A, Floor 2",
  "startDate": "2024-01-15T08:00:00Z",
  "finishDate": "2024-01-20T17:00:00Z",
  "duration": 40,
  "quantity": 100.5,
  "unit": "kg",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440001",
  "assignedToName": "Jane Doe",
  "assignedToPhone": "+1234567891",
  "assignedToEmail": "jane@example.com",
  "ccUserIds": ["550e8400-e29b-41d4-a716-446655440002"],
  "ccUsers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "phone": "+1234567892"
    }
  ],
  "comments": [],
  "assets": [],
  "commentCount": 0,
  "isWatching": false,
  "watcherCount": 0,
  "isPinned": false
}
```

**Error Responses**:
- `400 Bad Request`: Title is required
- `400 Bad Request`: Invalid date format
- `400 Bad Request`: User not found

**Notes**:
- If assignee doesn't exist, pending user created
- Task automatically assigned via cascading assignment system
- WebSocket event sent to all watchers

---

### 2. Get Project Tasks

**Endpoint**: `GET /projects/{projectId}/tasks`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `statuses` (List<String>): Filter by status (OPEN, IN_PROGRESS, BLOCKED, DONE, CLOSED, WIP, INSPECTION)
- `assignedToId` (UUID): Filter by assignee
- `createdById` (UUID): Filter by creator
- `groupId` (UUID): Filter by group
- `categories` (List<String>): Filter by category (SNAG, QUALITY_ISSUE, EHS_ISSUE, OTHER)
- `minPriority` (Integer): Minimum priority
- `maxPriority` (Integer): Maximum priority
- `dueDateFrom` (String): ISO 8601 date
- `dueDateTo` (String): ISO 8601 date
- `overdueOnly` (Boolean): Show only overdue tasks
- `location` (String): Filter by location
- `searchQuery` (String): Full-text search
- `sortBy` (String): Sort field (createdAt, updatedAt, dueDate, priority, title)
- `sortOrder` (String): ASC or DESC
- `page` (Integer): Page number (default: 0)
- `size` (Integer): Page size (default: 20)

**Example Request**:
```
GET /projects/{projectId}/tasks?statuses=OPEN&statuses=IN_PROGRESS&assignedToId={userId}&page=0&size=20&sortBy=dueDate&sortOrder=ASC
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "title": "Pour concrete for foundation",
    "description": "Use mix 1:2:4, depth 6 inches",
    "status": "OPEN",
    "priority": 0,
    "createdById": "550e8400-e29b-41d4-a716-446655440003",
    "createdByName": "John Doe",
    "createdAt": "2024-01-01T00:00:00",
    "dueDate": "2024-12-31T23:59:59Z",
    "assignedToId": "550e8400-e29b-41d4-a716-446655440001",
    "assignedToName": "Jane Doe",
    "isWatching": false,
    "watcherCount": 0,
    "isPinned": false
  }
]
```

---

### 3. Get Task Details

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440002",
  "projectName": "Construction Project Alpha",
  "title": "Pour concrete for foundation",
  "description": "Use mix 1:2:4, depth 6 inches",
  "status": "OPEN",
  "priority": 0,
  "metadata": "{\"area\":\"Block A\",\"phase\":\"Foundation\"}",
  "createdById": "550e8400-e29b-41d4-a716-446655440003",
  "createdByName": "John Doe",
  "createdByPhone": "+1234567890",
  "createdByEmail": "john@example.com",
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00",
  "dueDate": "2024-12-31T23:59:59Z",
  "category": "SNAG",
  "location": "Building A, Floor 2",
  "startDate": "2024-01-15T08:00:00Z",
  "finishDate": "2024-01-20T17:00:00Z",
  "duration": 40,
  "quantity": 100.5,
  "unit": "kg",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440001",
  "assignedToName": "Jane Doe",
  "assignedToPhone": "+1234567891",
  "assignedToEmail": "jane@example.com",
  "ccUserIds": ["550e8400-e29b-41d4-a716-446655440002"],
  "ccUsers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "Bob Smith",
      "email": "bob@example.com",
      "phone": "+1234567892"
    }
  ],
  "comments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440010",
      "taskId": "550e8400-e29b-41d4-a716-446655440000",
      "body": "This is a comment",
      "createdById": "550e8400-e29b-41d4-a716-446655440001",
      "createdByName": "Jane Doe",
      "createdAt": "2024-01-01T01:00:00",
      "replyCount": 2,
      "replies": []
    }
  ],
  "assets": [
    {
      "s3Key": "tasks/{taskId}/assets/file.pdf",
      "filename": "file.pdf",
      "contentType": "application/pdf",
      "size": 1024,
      "downloadUrl": "https://..."
    }
  ],
  "commentCount": 1,
  "isWatching": true,
  "watcherCount": 3,
  "watcherIds": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
  "isPinned": false
}
```

---

### 4. Update Task

**Endpoint**: `PATCH /projects/{projectId}/tasks/{taskId}`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "IN_PROGRESS",  // OPEN, IN_PROGRESS, BLOCKED, DONE, CLOSED, WIP, INSPECTION
  "priority": 1,
  "metadata": "{\"updated\":true}",
  "dueDate": "2024-12-31T23:59:59Z",
  "category": "QUALITY_ISSUE",
  "location": "Updated location",
  "startDate": "2024-01-15T08:00:00Z",
  "finishDate": "2024-01-20T17:00:00Z",
  "duration": 50,
  "quantity": 150.0,
  "unit": "pieces",
  "assignedToId": "550e8400-e29b-41d4-a716-446655440002",
  "ccUserIds": ["550e8400-e29b-41d4-a716-446655440003"]
}
```

**Response** (200 OK): Same as Get Task Details

**Error Responses**:
- `400 Bad Request`: Invalid status
- `400 Bad Request`: Task not found

**Notes**:
- Only assigned user or project admin can update
- Status changes trigger notifications
- WebSocket event sent to watchers

---

### 5. Assign Task

**Endpoint**: `POST /projects/{projectId}/tasks/{taskId}/assign`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "assigneeId": "550e8400-e29b-41d4-a716-446655440001",  // Optional
  "assigneePhone": "+1234567890",  // Optional
  "assigneeEmail": "worker@example.com"  // Optional
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "550e8400-e29b-41d4-a716-446655440002",
  "parentId": null,
  "assignedBy": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "John Doe"
  },
  "assignee": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Jane Doe"
  },
  "active": true,
  "createdAt": "2024-01-01T00:00:00"
}
```

**Notes**:
- Creates cascading assignment chain
- Only current assignee can reassign
- WebSocket notification sent to new assignee

---

### 6. Get Task Assignment Chain

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/assignments`

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "parentId": null,
    "assignedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "name": "John Doe"
    },
    "assignee": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Doe"
    },
    "active": true,
    "createdAt": "2024-01-01T00:00:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "parentId": "550e8400-e29b-41d4-a716-446655440000",
    "assignedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Jane Doe"
    },
    "assignee": {
      "id": "550e8400-e29b-41d4-a716-446655440004",
      "name": "Bob Smith"
    },
    "active": true,
    "createdAt": "2024-01-01T01:00:00"
  }
]
```

---

### 7. Get Visible Assignee

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/visible-assignee`

**Response** (200 OK):
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440003",
  "visibleAssigneeId": "550e8400-e29b-41d4-a716-446655440001",
  "visibleAssigneeName": "Jane Doe"
}
```

**Notes**: Shows who the current user sees as the assignee (resolves cascading chain)

---

### 8. Watch Task

**Endpoint**: `POST /projects/{projectId}/tasks/{taskId}/watch`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
"Task watched successfully"
```

**Notes**: User will receive WebSocket notifications for task updates

---

### 9. Unwatch Task

**Endpoint**: `DELETE /projects/{projectId}/tasks/{taskId}/watch`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
"Task unwatched successfully"
```

---

### 10. Get Task Activity Timeline

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/activity`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440003",
    "userName": "John Doe",
    "activityType": "TASK_CREATED",
    "description": "Task created",
    "metadata": "{}",
    "relatedUserId": null,
    "relatedUserName": null,
    "relatedCommentId": null,
    "createdAt": "2024-01-01T00:00:00"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "userId": "550e8400-e29b-41d4-a716-446655440003",
    "userName": "John Doe",
    "activityType": "STATUS_CHANGED",
    "description": "Status changed from OPEN to IN_PROGRESS",
    "metadata": "{\"oldStatus\":\"OPEN\",\"newStatus\":\"IN_PROGRESS\"}",
    "relatedUserId": null,
    "relatedUserName": null,
    "relatedCommentId": null,
    "createdAt": "2024-01-01T01:00:00"
  }
]
```

**Activity Types**:
- `TASK_CREATED`
- `TASK_UPDATED`
- `STATUS_CHANGED`
- `PRIORITY_CHANGED`
- `DUE_DATE_CHANGED`
- `TASK_ASSIGNED`
- `COMMENT_ADDED`
- `COMMENT_EDITED`
- `COMMENT_DELETED`
- `TASK_WATCHED`
- `TASK_UNWATCHED`

---

## Comment System

### 1. Create Comment

**Endpoint**: `POST /projects/{projectId}/tasks/{taskId}/comments`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "body": "This is a comment on the task",
  "replyToCommentId": null,  // Optional: UUID of parent comment for threading
  "attachments": [  // Optional
    {
      "s3Key": "tasks/{taskId}/comments/{commentId}/file.pdf",
      "originalFilename": "file.pdf",
      "contentType": "application/pdf",
      "size": 1024,
      "type": "FILE"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "550e8400-e29b-41d4-a716-446655440002",
  "body": "This is a comment on the task",
  "attachments": [
    {
      "s3Key": "tasks/{taskId}/comments/{commentId}/file.pdf",
      "filename": "file.pdf",
      "contentType": "application/pdf",
      "size": 1024,
      "type": "FILE",
      "downloadUrl": "https://..."
    }
  ],
  "createdById": "550e8400-e29b-41d4-a716-446655440001",
  "createdByName": "Jane Doe",
  "createdByPhone": "+1234567891",
  "createdByEmail": "jane@example.com",
  "createdByAvatarUrl": null,
  "replyToCommentId": null,
  "isEdited": false,
  "createdAt": "2024-01-01T00:00:00",
  "editedAt": null,
  "replies": [],
  "replyCount": 0
}
```

**Error Responses**:
- `400 Bad Request`: Comment body is required
- `400 Bad Request`: Comment body exceeds 5000 characters

**Notes**:
- WebSocket event sent to task watchers
- Activity logged

---

### 2. Get Task Comments

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/comments`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "body": "This is a top-level comment",
    "attachments": [],
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "Jane Doe",
    "createdByPhone": "+1234567891",
    "createdByEmail": "jane@example.com",
    "createdByAvatarUrl": null,
    "replyToCommentId": null,
    "isEdited": false,
    "createdAt": "2024-01-01T00:00:00",
    "editedAt": null,
    "replies": [],
    "replyCount": 0
  }
]
```

---

### 3. Get Comment Threads (Tree Structure)

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/comments/threads`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "body": "This is a top-level comment",
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "Jane Doe",
    "createdAt": "2024-01-01T00:00:00",
    "replyToCommentId": null,
    "replyCount": 2,
    "replies": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "taskId": "550e8400-e29b-41d4-a716-446655440002",
        "body": "This is a reply",
        "createdById": "550e8400-e29b-41d4-a716-446655440003",
        "createdByName": "John Doe",
        "createdAt": "2024-01-01T01:00:00",
        "replyToCommentId": "550e8400-e29b-41d4-a716-446655440000",
        "replyCount": 1,
        "replies": [
          {
            "id": "550e8400-e29b-41d4-a716-446655440002",
            "taskId": "550e8400-e29b-41d4-a716-446655440002",
            "body": "This is a nested reply",
            "createdById": "550e8400-e29b-41d4-a716-446655440004",
            "createdByName": "Bob Smith",
            "createdAt": "2024-01-01T02:00:00",
            "replyToCommentId": "550e8400-e29b-41d4-a716-446655440001",
            "replyCount": 0,
            "replies": []
          }
        ]
      }
    ]
  }
]
```

**Notes**: Returns all comments in a nested tree structure with replies

---

### 4. Get Comment Replies

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/comments/{commentId}/replies`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "body": "This is a reply",
    "createdById": "550e8400-e29b-41d4-a716-446655440003",
    "createdByName": "John Doe",
    "createdAt": "2024-01-01T01:00:00",
    "replyToCommentId": "550e8400-e29b-41d4-a716-446655440000",
    "replyCount": 1,
    "replies": []
  }
]
```

**Notes**: Returns direct replies to a specific comment (not nested)

---

### 5. Get Comment by ID

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/comments/{commentId}`

**Response** (200 OK): Same as Create Comment response

---

### 6. Update Comment

**Endpoint**: `PATCH /projects/{projectId}/tasks/{taskId}/comments/{commentId}`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "body": "Updated comment text",
  "attachments": []  // Optional: update attachments
}
```

**Response** (200 OK): Same as Create Comment response (with `isEdited: true`)

**Error Responses**:
- `400 Bad Request`: You can only edit your own comments

---

### 7. Delete Comment

**Endpoint**: `DELETE /projects/{projectId}/tasks/{taskId}/comments/{commentId}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
"Comment deleted successfully"
```

**Error Responses**:
- `400 Bad Request`: You can only delete your own comments

---

### 8. Upload Comment Attachment

**Endpoint**: `POST /projects/{projectId}/tasks/{taskId}/comments/{commentId}/attachments`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data**:
- `file` (File): The file to upload

**Response** (200 OK):
```json
{
  "s3Key": "tasks/{taskId}/comments/{commentId}/file.pdf",
  "message": "Attachment uploaded successfully"
}
```

**Notes**: After upload, update comment with attachment info in `attachments` array

---

### 9. Get Comment Attachment Download URL

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/comments/{commentId}/attachments/{s3Key}/download`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "downloadUrl": "https://s3.amazonaws.com/..."
}
```

**Notes**: URL expires in 1 hour

---

## Metadata Templates

### 1. Create Metadata Template

**Endpoint**: `POST /projects/{projectId}/metadata-templates`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Foundation Template",
  "description": "Template for foundation-related tasks",
  "schema": "{\"type\":\"object\",\"properties\":{\"area\":{\"type\":\"string\"},\"phase\":{\"type\":\"string\"},\"depth\":{\"type\":\"number\"}},\"required\":[\"area\",\"phase\"]}",  // JSON Schema as string
  "isDefault": false
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "projectId": "550e8400-e29b-41d4-a716-446655440002",
  "projectName": "Construction Project Alpha",
  "name": "Foundation Template",
  "description": "Template for foundation-related tasks",
  "schema": "{\"type\":\"object\",\"properties\":{\"area\":{\"type\":\"string\"},\"phase\":{\"type\":\"string\"},\"depth\":{\"type\":\"number\"}},\"required\":[\"area\",\"phase\"]}",
  "isDefault": false,
  "createdById": "550e8400-e29b-41d4-a716-446655440001",
  "createdByName": "John Doe",
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `400 Bad Request`: Template name already exists
- `400 Bad Request`: Invalid JSON schema
- `403 Forbidden`: Not a project member

**Notes**:
- If `isDefault: true`, previous default is unset
- Schema must be valid JSON Schema format

---

### 2. Get Project Templates

**Endpoint**: `GET /projects/{projectId}/metadata-templates`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "name": "Foundation Template",
    "description": "Template for foundation-related tasks",
    "schema": "{\"type\":\"object\",\"properties\":{\"area\":{\"type\":\"string\"},\"phase\":{\"type\":\"string\"}}}",
    "isDefault": false,
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "createdAt": "2024-01-01T00:00:00",
    "updatedAt": "2024-01-01T00:00:00"
  }
]
```

---

### 3. Get Default Template

**Endpoint**: `GET /projects/{projectId}/metadata-templates/default`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK): Same as Create Template response

**Response** (404 Not Found):
```json
{
  "message": "No default template found"
}
```

---

### 4. Get Template by ID

**Endpoint**: `GET /projects/{projectId}/metadata-templates/{templateId}`

**Response** (200 OK): Same as Create Template response

---

### 5. Update Template

**Endpoint**: `PATCH /projects/{projectId}/metadata-templates/{templateId}`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "Updated Template Name",
  "description": "Updated description",
  "schema": "{\"type\":\"object\",\"properties\":{\"newField\":{\"type\":\"string\"}}}",
  "isDefault": true
}
```

**Response** (200 OK): Same as Create Template response

**Error Responses**:
- `400 Bad Request`: Template name already exists
- `400 Bad Request`: Invalid JSON schema

---

### 6. Delete Template

**Endpoint**: `DELETE /projects/{projectId}/metadata-templates/{templateId}`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Template deleted successfully"
}
```

---

### 7. Validate Metadata

**Endpoint**: `POST /projects/{projectId}/metadata-templates/validate`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "metadata": "{\"area\":\"Block A\",\"phase\":\"Foundation\",\"depth\":6}"  // JSON string to validate
}
```

**Response** (200 OK):
```json
{
  "valid": true,
  "message": "Metadata is valid"
}
```

**Response** (400 Bad Request):
```json
{
  "valid": false,
  "message": "Metadata does not match template schema"
}
```

**Use Case**: Validate task metadata before creating/updating task

---

## Feeds

### 1. General Feed (Project Tasks)

**Endpoint**: `GET /feeds/projects/{projectId}/general`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `cursor` (String): Cursor for pagination (optional)
- `limit` (Integer): Number of items (optional, default: 20)
- `page` (Integer): Page number (optional, default: 0) - for backward compatibility
- `size` (Integer): Page size (optional, default: 20) - for backward compatibility

**Cursor-based Pagination** (Recommended):
```
GET /feeds/projects/{projectId}/general?cursor=abc123&limit=20
```

**Response** (200 OK):
```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Pour concrete",
      "status": "OPEN",
      "createdAt": "2024-01-01T00:00:00"
    }
  ],
  "nextCursor": "def456",
  "prevCursor": "xyz789",
  "hasNext": true,
  "hasPrevious": false,
  "limit": 20
}
```

**Page-based Pagination** (Legacy):
```
GET /feeds/projects/{projectId}/general?page=0&size=20
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pour concrete",
    "status": "OPEN"
  }
]
```

---

### 2. Assigned to Me Feed

**Endpoint**: `GET /feeds/assigned-to-me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "title": "Pour concrete",
    "status": "OPEN",
    "assignedToId": "550e8400-e29b-41d4-a716-446655440001",
    "assignedToName": "Jane Doe",
    "isWatching": true,
    "watcherCount": 2,
    "isPinned": false
  }
]
```

**Notes**: Returns tasks assigned to current user (from assignments table or assignedTo field)

---

### 3. Assigned by Me Feed

**Endpoint**: `GET /feeds/assigned-by-me`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK): Same format as Assigned to Me

**Notes**: Returns tasks created by current user and assigned to others

---

### 4. Watching Feed

**Endpoint**: `GET /feeds/watching`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK): Same format as Assigned to Me

**Notes**: Returns tasks the user is watching

---

### 5. Search Tasks

**Endpoint**: `GET /feeds/search`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `query` (String, required): Search query
- `projectId` (UUID, optional): Filter by project
- `page` (Integer, default: 0)
- `size` (Integer, default: 20)

**Example**:
```
GET /feeds/search?query=concrete&projectId={projectId}&page=0&size=20
```

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pour concrete",
    "description": "Concrete foundation work",
    "status": "OPEN"
  }
]
```

**Notes**: Full-text search across task title, description, and metadata

---

### 6. Recent Tasks

**Endpoint**: `GET /feeds/recent`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `limit` (Integer, default: 10): Number of recent tasks

**Response** (200 OK): Same format as Assigned to Me

**Notes**: Returns recently viewed/updated tasks for current user

---

## Groups

### 1. Create Group

**Endpoint**: `POST /projects/{projectId}/groups`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Electrical Team"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Electrical Team",
  "projectId": "550e8400-e29b-41d4-a716-446655440002",
  "projectName": "Construction Project Alpha",
  "createdById": "550e8400-e29b-41d4-a716-446655440001",
  "createdByName": "John Doe",
  "isDefault": false,
  "memberCount": 0,
  "createdAt": "2024-01-01T00:00:00"
}
```

---

### 2. Get Project Groups

**Endpoint**: `GET /projects/{projectId}/groups`

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "All",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "isDefault": true,
    "memberCount": 5,
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

### 3. Get Group Details

**Endpoint**: `GET /projects/{projectId}/groups/{groupId}`

**Response** (200 OK): Same as Create Group response

---

### 4. Add Group Member

**Endpoint**: `POST /projects/{projectId}/groups/{groupId}/members`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440001"
}
```

**Response** (200 OK):
```json
"Member added successfully"
```

---

### 5. Remove Group Member

**Endpoint**: `DELETE /projects/{projectId}/groups/{groupId}/members/{userId}`

**Response** (200 OK):
```json
"Member removed successfully"
```

---

### 6. Send Group Message

**Endpoint**: `POST /projects/{projectId}/groups/{groupId}/messages`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "body": "Hello team!",
  "replyToMessageId": null,  // Optional: for threaded messages
  "messageType": "TEXT",  // TEXT, IMAGE, FILE, SYSTEM
  "attachments": []  // Optional
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "groupId": "550e8400-e29b-41d4-a716-446655440002",
  "body": "Hello team!",
  "createdById": "550e8400-e29b-41d4-a716-446655440001",
  "createdByName": "John Doe",
  "createdByPhone": "+1234567890",
  "createdByEmail": "john@example.com",
  "createdByAvatarUrl": null,
  "replyToMessageId": null,
  "messageType": "TEXT",
  "attachments": [],
  "createdAt": "2024-01-01T00:00:00"
}
```

**Notes**: WebSocket event sent to all group members

---

### 7. Get Group Messages

**Endpoint**: `GET /projects/{projectId}/groups/{groupId}/messages`

**Query Parameters**:
- `page` (Integer, default: 0)
- `size` (Integer, default: 20)

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "groupId": "550e8400-e29b-41d4-a716-446655440002",
    "body": "Hello team!",
    "createdById": "550e8400-e29b-41d4-a716-446655440001",
    "createdByName": "John Doe",
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

### 8. Upload Group Asset

**Endpoint**: `POST /projects/{projectId}/groups/{groupId}/assets/upload`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data**:
- `file` (File): The file to upload

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "groupId": "550e8400-e29b-41d4-a716-446655440002",
  "s3Key": "groups/{groupId}/assets/file.pdf",
  "filename": "file.pdf",
  "contentType": "application/pdf",
  "size": 1024,
  "uploadedById": "550e8400-e29b-41d4-a716-446655440001",
  "uploadedByName": "John Doe",
  "downloadUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00"
}
```

---

### 9. Get Group Assets

**Endpoint**: `GET /projects/{projectId}/groups/{groupId}/assets`

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "groupId": "550e8400-e29b-41d4-a716-446655440002",
    "s3Key": "groups/{groupId}/assets/file.pdf",
    "filename": "file.pdf",
    "contentType": "application/pdf",
    "size": 1024,
    "uploadedById": "550e8400-e29b-41d4-a716-446655440001",
    "uploadedByName": "John Doe",
    "downloadUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

## Invites

### 1. Get Invite Details

**Endpoint**: `GET /invites/{inviteToken}`

**Note**: Public endpoint (no authentication required)

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "phone": "+1234567890",
  "email": "user@example.com",
  "inviteToken": "abc123def456",
  "invitedBy": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "John Doe"
  },
  "projectId": "550e8400-e29b-41d4-a716-446655440002",
  "projectName": "Construction Project Alpha",
  "taskId": "550e8400-e29b-41d4-a716-446655440003",
  "taskTitle": "Pour concrete",
  "projectRole": "MEMBER",
  "createdAt": "2024-01-01T00:00:00"
}
```

**Error Responses**:
- `404 Not Found`: Invalid or expired invite token

---

### 2. Accept Invite

**Endpoint**: `POST /invites/{inviteToken}/accept`

**Note**: Public endpoint (no authentication required)

**Request Body**:
```json
{
  "otp": "123456",
  "name": "Jane Doe"
}
```

**Response** (200 OK):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+1234567890",
    "email": "user@example.com",
    "name": "Jane Doe",
    "isVerified": true,
    "status": "ACTIVE"
  }
}
```

**Flow**:
1. User clicks invite link
2. Frontend calls GET /invites/{token} to get invite details
3. User enters OTP and name
4. Frontend calls POST /invites/{token}/accept
5. User created/updated, added to project/group
6. JWT tokens returned
7. Navigate to app

**Error Responses**:
- `400 Bad Request`: Invalid or expired OTP
- `400 Bad Request`: Invalid or expired invite token

---

### 3. Get Pending Invites

**Endpoint**: `GET /invites/pending`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `phone` (String, optional): Filter by phone
- `email` (String, optional): Filter by email

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "phone": "+1234567890",
    "email": "user@example.com",
    "inviteToken": "abc123def456",
    "invitedBy": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "John Doe"
    },
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "projectName": "Construction Project Alpha",
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

### 4. Resend Invite

**Endpoint**: `POST /invites/{inviteId}/resend`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
"Invite resent successfully"
```

**Error Responses**:
- `403 Forbidden`: Access denied (not the inviter)

---

## Notifications

### 1. Get Notifications

**Endpoint**: `GET /notifications`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `page` (Integer, default: 0)
- `size` (Integer, default: 20)
- `unreadOnly` (Boolean, default: false)

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "userId": "550e8400-e29b-41d4-a716-446655440001",
    "projectId": "550e8400-e29b-41d4-a716-446655440002",
    "taskId": "550e8400-e29b-41d4-a716-446655440003",
    "type": "COMMENT",
    "payload": "{\"message\":\"John Doe commented on task: Pour concrete\",\"commentId\":\"uuid\",\"taskId\":\"uuid\"}",
    "read": false,
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

**Notification Types**:
- `COMMENT`: New comment on task
- `ASSIGNMENT`: Task assigned to you
- `TAG`: You were tagged in a task
- `STATUS_CHANGE`: Task status changed
- `TASK_CREATED`: New task created
- `TASK_UPDATED`: Task updated

---

### 2. Get Unread Count

**Endpoint**: `GET /notifications/unread-count`

**Response** (200 OK):
```json
{
  "count": 5
}
```

---

### 3. Mark as Read

**Endpoint**: `PATCH /notifications/{notificationId}/read`

**Response** (200 OK):
```json
"Notification marked as read"
```

---

### 4. Mark All as Read

**Endpoint**: `PATCH /notifications/read-all`

**Response** (200 OK):
```json
"All notifications marked as read"
```

---

## Assets

### 1. Upload Task Asset

**Endpoint**: `POST /projects/{projectId}/tasks/{taskId}/assets/upload`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data**:
- `file` (File): The file to upload

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "taskId": "550e8400-e29b-41d4-a716-446655440002",
  "s3Key": "tasks/{taskId}/assets/file.pdf",
  "filename": "file.pdf",
  "contentType": "application/pdf",
  "size": 1024,
  "uploadedById": "550e8400-e29b-41d4-a716-446655440001",
  "uploadedByName": "John Doe",
  "downloadUrl": "https://...",
  "createdAt": "2024-01-01T00:00:00"
}
```

---

### 2. Get Task Assets

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/assets`

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "taskId": "550e8400-e29b-41d4-a716-446655440002",
    "s3Key": "tasks/{taskId}/assets/file.pdf",
    "filename": "file.pdf",
    "contentType": "application/pdf",
    "size": 1024,
    "uploadedById": "550e8400-e29b-41d4-a716-446655440001",
    "uploadedByName": "John Doe",
    "downloadUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00"
  }
]
```

---

### 3. Get Asset Download URL

**Endpoint**: `GET /projects/{projectId}/tasks/{taskId}/assets/{assetId}/download`

**Response** (200 OK):
```json
{
  "downloadUrl": "https://s3.amazonaws.com/..."
}
```

**Notes**: URL expires in 1 hour

---

### 4. Delete Asset

**Endpoint**: `DELETE /projects/{projectId}/tasks/{taskId}/assets/{assetId}`

**Response** (200 OK):
```json
"Asset deleted successfully"
```

---

## Users

### 1. Search Users

**Endpoint**: `GET /users/search`

**Headers**:
```
Authorization: Bearer <access_token>
```

**Query Parameters**:
- `query` (String, required): Search query (name, phone, email)

**Response** (200 OK):
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "phone": "+1234567890",
    "email": "john@example.com",
    "avatarUrl": null,
    "isVerified": true,
    "status": "ACTIVE"
  }
]
```

---

### 2. Get User by ID

**Endpoint**: `GET /users/{userId}`

**Response** (200 OK): Same as Search Users response

---

## WebSocket Events

See [WEBSOCKET_EVENT_CATALOG.md](./WEBSOCKET_EVENT_CATALOG.md) for complete WebSocket documentation.

### Connection
```
ws://13.203.46.227:8080/api/ws
```

### Subscribe to Notifications
```
/user/{userId}/queue/notifications
```

### Subscribe to Task Updates
```
/user/{userId}/queue/task-updates
```

### Subscribe to Project Updates
```
/user/{userId}/queue/project-updates
```

### Subscribe to Group Messages
```
/topic/groups/{groupId}/messages
```

---

## Error Handling

### Standard Error Response
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### HTTP Status Codes
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Invalid or expired token
- `403 Forbidden`: Access denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Token Expiration Handling
1. Detect 401 response
2. Call `/auth/refresh` with refresh token
3. Update stored tokens
4. Retry original request

---

## TypeScript Interfaces

```typescript
// User
interface User {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  isVerified: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  avatarUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Project
interface Project {
  id: string;
  name: string;
  description: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Task
interface Task {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CLOSED' | 'WIP' | 'INSPECTION';
  priority: number;
  metadata: string | null;
  createdById: string;
  createdByName: string;
  createdByPhone: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  category: 'SNAG' | 'QUALITY_ISSUE' | 'EHS_ISSUE' | 'OTHER' | null;
  location: string | null;
  startDate: string | null;
  finishDate: string | null;
  duration: number | null;
  quantity: number | null;
  unit: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedToPhone: string | null;
  assignedToEmail: string | null;
  ccUserIds: string[];
  ccUsers: CcUserInfo[];
  comments: Comment[];
  assets: Attachment[];
  commentCount: number;
  isWatching: boolean;
  watcherCount: number;
  watcherIds: string[];
  isPinned: boolean;
}

// Comment
interface Comment {
  id: string;
  taskId: string;
  body: string;
  attachments: Attachment[];
  createdById: string;
  createdByName: string;
  createdByPhone: string | null;
  createdByEmail: string | null;
  createdByAvatarUrl: string | null;
  replyToCommentId: string | null;
  isEdited: boolean;
  createdAt: string;
  editedAt: string | null;
  replies: Comment[];
  replyCount: number;
}

// Metadata Template
interface MetadataTemplate {
  id: string;
  projectId: string;
  projectName: string;
  name: string;
  description: string | null;
  schema: string; // JSON Schema as string
  isDefault: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// Notification
interface Notification {
  id: string;
  userId: string;
  projectId: string | null;
  taskId: string | null;
  type: 'COMMENT' | 'ASSIGNMENT' | 'TAG' | 'STATUS_CHANGE' | 'TASK_CREATED' | 'TASK_UPDATED';
  payload: string; // JSON string
  read: boolean;
  createdAt: string;
}

// Group
interface Group {
  id: string;
  name: string;
  projectId: string;
  projectName: string;
  createdById: string;
  createdByName: string;
  isDefault: boolean;
  memberCount: number;
  createdAt: string;
}

// Attachment
interface Attachment {
  s3Key: string;
  filename: string;
  contentType: string;
  size: number;
  type?: string;
  downloadUrl: string;
}

// Cursor Page Response
interface CursorPageResponse<T> {
  content: T[];
  nextCursor: string | null;
  prevCursor: string | null;
  hasNext: boolean;
  hasPrevious: boolean;
  limit: number;
}
```

---

## Best Practices

1. **Token Management**: Store refresh token securely, refresh access token before expiration
2. **Error Handling**: Always handle 401 (token expired) and 403 (access denied)
3. **Optimistic Updates**: Update UI immediately, sync with server response
4. **WebSocket**: Connect on app start, handle reconnection
5. **Pagination**: Use cursor-based pagination for feeds
6. **File Uploads**: Show progress, handle errors gracefully
7. **Search**: Debounce search queries
8. **Caching**: Cache project/task lists, invalidate on updates

---

## Critical Implementation Details

### Auth / Tokens

#### JWT Token Format

**Access Token Claims**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",  // User ID (UUID as string)
  "iat": 1704067200,  // Issued at (Unix timestamp in seconds)
  "exp": 1704153600,  // Expiration (Unix timestamp in seconds)
  "typ": "JWT",
  "alg": "HS256"
}
```

**Refresh Token Claims**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "iat": 1704067200,
  "exp": 1704672000,  // 7 days from iat
  "type": "refresh",  // Distinguishes refresh token
  "typ": "JWT",
  "alg": "HS256"
}
```

**Token Expiration**:
- **Access Token**: 24 hours (86400000 ms)
- **Refresh Token**: 7 days (604800000 ms)

**Token Response Format** (Enhanced):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-01-02T00:00:00Z",  // Access token expiration (UTC)
  "refreshExpiresAt": "2024-01-08T00:00:00Z",  // Refresh token expiration (UTC)
  "user": { ... }
}
```

**Note**: Currently, `expiresAt` is not returned in the response. Calculate it client-side:
- Access token: `issuedAt + 24 hours`
- Refresh token: `issuedAt + 7 days`

#### Refresh Token Rotation

**Current Behavior**: Refresh tokens are **NOT rotated** on each refresh. The same refresh token can be used multiple times until it expires.

**Refresh Flow**:
1. Access token expires (24h)
2. Call `POST /auth/refresh` with refresh token
3. Receive new access token and new refresh token
4. Old refresh token remains valid until expiration
5. Store new tokens

**Recommendation**: Implement client-side refresh token rotation by storing only the latest refresh token.

#### Logout Endpoint

**Endpoint**: `POST /auth/logout` (Not currently implemented)

**Recommended Implementation**:
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Current Workaround**: Delete tokens client-side. Server-side token revocation not implemented.

#### WebSocket Authentication

**Connection URL**: `ws://13.203.46.227:8080/api/ws`

**Authentication Method**: JWT token in **query parameter** during WebSocket handshake:

```javascript
const socket = new SockJS(`http://13.203.46.227:8080/api/ws?token=${accessToken}`);
```

**Alternative**: Some STOMP clients support headers:
```javascript
const client = new Client({
  webSocketFactory: () => socket,
  connectHeaders: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

**Reconnection**: Re-authenticate on reconnect with current access token. If token expired, refresh first.

---

### Rate Limiting & Retry Semantics

#### Rate Limits

**OTP Requests**:
- Limit: **1 request per minute** per phone/email
- Error Response: `400 Bad Request` with message "OTP request too frequent. Please wait before requesting another OTP."
- Retry-After: Not provided (wait 60 seconds)

**API Requests**:
- Limit: **1000 requests per hour** per user (not strictly enforced currently)
- Error Response: `429 Too Many Requests` (if implemented)
- Retry-After: Header provided (seconds to wait)

**File Uploads**:
- Per file: **10MB maximum**
- Per hour: **100MB total** per user (not strictly enforced)
- Error Response: `413 Payload Too Large` or `400 Bad Request`

#### Retry Strategy

**Recommended Client Behavior**:
1. **Exponential Backoff**: Start with 1s, double on each retry (max 30s)
2. **Max Retries**: 3 attempts for transient errors
3. **Retry-After Header**: Respect server-provided wait time
4. **Idempotency**: Use `Idempotency-Key` header for POST requests (not currently supported)

**Idempotency Key** (Recommended for future):
```http
POST /projects/{projectId}/tasks
Authorization: Bearer <token>
Idempotency-Key: <uuid>
Content-Type: application/json
```

**Retryable Errors**:
- `429 Too Many Requests`
- `500 Internal Server Error`
- `502 Bad Gateway`
- `503 Service Unavailable`
- `504 Gateway Timeout`

**Non-Retryable Errors**:
- `400 Bad Request` (validation errors)
- `401 Unauthorized` (refresh token first)
- `403 Forbidden` (permission denied)
- `404 Not Found`

---

### Pagination Consistency

#### Cursor-Based Pagination (Recommended)

**Endpoints Using Cursor Pagination**:
- `GET /feeds/projects/{projectId}/general` (when `cursor` or `limit` provided)

**Request**:
```
GET /feeds/projects/{projectId}/general?cursor=abc123&limit=20
```

**Response**:
```json
{
  "content": [...],
  "nextCursor": "def456",  // Opaque string, base64-encoded timestamp + ID
  "prevCursor": "xyz789",  // Opaque string for previous page
  "hasNext": true,
  "hasPrevious": false,
  "limit": 20
}
```

**Cursor Encoding**: Opaque base64 string containing timestamp and last item ID. **Do not parse or modify**.

**Pagination Limits**:
- `defaultLimit`: 20
- `minLimit`: 1
- `maxLimit`: 100

**Usage**:
```typescript
// First page
const response = await fetch('/feeds/projects/{id}/general?limit=20');

// Next page
if (response.hasNext) {
  const nextPage = await fetch(`/feeds/projects/{id}/general?cursor=${response.nextCursor}&limit=20`);
}

// Previous page
if (response.hasPrevious) {
  const prevPage = await fetch(`/feeds/projects/{id}/general?cursor=${response.prevCursor}&limit=20`);
}
```

#### Page-Based Pagination (Legacy)

**Endpoints Using Page Pagination**:
- `GET /projects/{projectId}/tasks` (default)
- `GET /feeds/search`
- `GET /notifications`

**Request**:
```
GET /projects/{projectId}/tasks?page=0&size=20
```

**Response**: Array of items (no pagination metadata)

**Pagination Limits**:
- `defaultPage`: 0
- `defaultSize`: 20
- `maxSize`: 100

**Canonical Pagination**:
- **Feeds**: Use cursor-based when available
- **Tasks**: Page-based (consider migrating to cursor)
- **Search**: Page-based
- **Notifications**: Page-based

---

### Error Format Details

#### Standard Error Response

**Current Format** (Simple):
```json
{
  "error": "Error message",
  "message": "Detailed error description",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

**Recommended Enhanced Format**:
```json
{
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required",
      "code": "REQUIRED"
    },
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "INVALID_FORMAT"
    }
  ],
  "timestamp": "2024-01-01T00:00:00Z",
  "path": "/api/projects/{projectId}/tasks"
}
```

**Error Codes**:
- `VALIDATION_FAILED`: Request validation errors
- `UNAUTHORIZED`: Invalid or expired token
- `FORBIDDEN`: Access denied
- `NOT_FOUND`: Resource not found
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `CONFLICT`: Resource conflict (e.g., duplicate name)

**HTTP Status Codes**:
- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Validation error, bad request
- `401 Unauthorized`: Invalid/missing token
- `403 Forbidden`: Access denied (user lacks permission)
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict
- `413 Payload Too Large`: File too large
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

**Error Handling Example**:
```typescript
try {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json();
    if (error.errors) {
      // Validation errors
      error.errors.forEach(err => {
        console.error(`${err.field}: ${err.message}`);
      });
    } else {
      // General error
      console.error(error.message);
    }
  }
} catch (error) {
  // Network error
}
```

---

### WebSocket Contract & Delivery Guarantees

#### Connection Setup

**URL**: `ws://13.203.46.227:8080/api/ws`  
**Protocol**: STOMP over SockJS  
**Authentication**: Token in query parameter or Authorization header

#### Message Schema

**Standard Event Structure**:
```json
{
  "type": "task.updated",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "taskId": "uuid",
    "projectId": "uuid",
    "changes": { ... }
  }
}
```

#### Delivery Guarantees

**Current Implementation**: **At-least-once delivery**
- Messages may be delivered multiple times
- Implement idempotent handlers
- Use message IDs to deduplicate

**Ordering**: **Best-effort ordering** (not guaranteed)
- Messages may arrive out of order
- Use timestamps to sort client-side

**Acknowledgments**: **Not currently supported**
- No ACK/NACK mechanism
- Messages are fire-and-forget

#### Reconnection Strategy

**Recommended Backoff**:
1. Immediate retry on disconnect
2. Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
3. Max retry attempts: 10
4. After max attempts: Show "Connection failed" to user

**Reconnection Flow**:
```typescript
let reconnectAttempts = 0;
const maxAttempts = 10;
const baseDelay = 1000;

function reconnect() {
  if (reconnectAttempts >= maxAttempts) {
    console.error('Max reconnection attempts reached');
    return;
  }
  
  const delay = Math.min(baseDelay * Math.pow(2, reconnectAttempts), 30000);
  setTimeout(() => {
    reconnectAttempts++;
    connectWebSocket();
  }, delay);
}
```

#### Presence & Typing Events

**Not Currently Implemented**

**Recommended for Future**:
- Typing indicators: `type: "user.typing"`
- Presence: `type: "user.online"` / `type: "user.offline"`
- Read receipts: `type: "message.read"`

#### Event Versioning

**Current**: No versioning
**Recommendation**: Include version in event type:
```json
{
  "type": "task.updated.v1",
  "version": "1.0",
  "data": { ... }
}
```

---

### File Upload Constraints & Resumability

#### File Size Limits

**Per File**:
- **Maximum**: 10MB (10,485,760 bytes)
- **Recommended**: < 5MB for better UX
- **Error**: `413 Payload Too Large` or `400 Bad Request` with message "File size exceeds 10MB limit"

**Per User Per Hour**:
- **Limit**: 100MB (not strictly enforced)
- **Monitoring**: Track client-side

#### Allowed Content Types

**Allowed Types** (not strictly enforced):
- Images: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Archives: `application/zip`, `application/x-rar-compressed`

**Validation**: Server validates `Content-Type` header. Invalid types may be rejected.

#### Upload Method

**Current**: **Direct upload via multipart/form-data** (proxied through server to S3)

**Flow**:
1. Client uploads file via `POST /projects/{projectId}/tasks/{taskId}/assets/upload`
2. Server receives file, validates size/type
3. Server uploads to S3
4. Server returns asset metadata immediately

**Response Time**: Immediate (no polling required)

#### Resumable Uploads

**Not Currently Supported**

**Future Recommendation**: Implement chunked uploads with resume capability:
```
POST /assets/upload/initiate
POST /assets/upload/chunk
POST /assets/upload/complete
```

#### Presigned URLs

**Download URLs**: Generated on-demand, expire in **1 hour**

**Upload URLs**: Not currently supported (direct upload only)

---

### Concurrency & Conflict Handling

#### Optimistic Concurrency Control

**Current**: **No explicit concurrency control**

**Recommended Implementation**: Use `updatedAt` timestamp for optimistic locking:

**Request**:
```http
PATCH /projects/{projectId}/tasks/{taskId}
If-Match: "2024-01-01T12:00:00Z"  // Last known updatedAt
```

**Response** (409 Conflict):
```json
{
  "status": 409,
  "code": "CONCURRENT_MODIFICATION",
  "message": "Task was modified by another user",
  "conflict": {
    "currentVersion": "2024-01-01T12:05:00Z",
    "yourVersion": "2024-01-01T12:00:00Z"
  }
}
```

**Client Handling**:
1. Store `updatedAt` from GET response
2. Include `If-Match` header in PATCH requests
3. On 409, refresh data and show conflict resolution UI
4. Allow user to merge changes or overwrite

**Current Workaround**: 
- Always fetch latest data before editing
- Show warning if `updatedAt` changed since last fetch
- Implement client-side conflict detection

---

### Permissions & Roles Matrix

#### Role Definitions

**ADMIN**:
- ✅ Create/update/delete projects
- ✅ Add/remove project members
- ✅ Update member roles
- ✅ Create/update/delete tasks
- ✅ Assign tasks
- ✅ Update any task
- ✅ Delete tasks
- ✅ Create/update/delete groups
- ✅ Manage group members
- ✅ Create/update/delete metadata templates
- ✅ Upload/delete assets
- ✅ View all project data

**PROJECT_MANAGER**:
- ✅ Create/update tasks
- ✅ Assign tasks
- ✅ Update any task
- ✅ Create/update groups
- ✅ Manage group members (except default group)
- ✅ Create/update metadata templates
- ✅ Upload/delete assets
- ✅ View all project data
- ❌ Delete projects
- ❌ Add/remove project members
- ❌ Update member roles

**MEMBER**:
- ✅ Create tasks
- ✅ Update own tasks
- ✅ Update assigned tasks
- ✅ Assign tasks (if assigned to them)
- ✅ Create/update/delete own comments
- ✅ Upload assets to tasks
- ✅ View project data
- ✅ Join groups
- ❌ Delete tasks
- ❌ Update other users' tasks
- ❌ Create/delete groups
- ❌ Manage group members
- ❌ Create/update metadata templates

**VIEWER**:
- ✅ View projects
- ✅ View tasks
- ✅ View comments
- ✅ View assets (download)
- ✅ View groups
- ❌ Create/update/delete anything
- ❌ Upload assets
- ❌ Add comments

#### Permission Checks

**Project Access**: User must be project member (any role)

**Task Operations**:
- Create: Project member
- Update: Creator, assigned user, or ADMIN/PROJECT_MANAGER
- Delete: Creator or ADMIN/PROJECT_MANAGER
- Assign: Current assignee or ADMIN/PROJECT_MANAGER

**Comment Operations**:
- Create: Project member
- Update/Delete: Comment creator only

**Group Operations**:
- Create: ADMIN or PROJECT_MANAGER
- Manage members: Group creator, ADMIN, or PROJECT_MANAGER
- Default group: Only ADMIN can modify

---

### Validation & Field Constraints

#### Field Length Limits

**Project**:
- `name`: 1-255 characters (required)
- `description`: 0-1000 characters (optional)

**Task**:
- `title`: 1-255 characters (required)
- `description`: 0-2000 characters (optional)
- `location`: No explicit limit (recommended: < 500 chars)
- `metadata`: JSON string, recommended < 10KB

**Comment**:
- `body`: 1-5000 characters (required)

**Group**:
- `name`: Required, no explicit limit (recommended: < 100 chars)
- `description`: Optional, no explicit limit

**User**:
- `name`: Required, no explicit limit (recommended: < 100 chars)
- `phone`: E.164 format (e.g., +1234567890)
- `email`: Valid email format

#### Numeric Ranges

**Task Priority**:
- Type: Integer
- Range: No explicit limits (typically 0-10)
- Default: 0
- Higher number = higher priority

**Task Duration**:
- Type: Integer
- Unit: Hours
- Range: No explicit limits (recommended: 0-8760, i.e., 1 year)

**Task Quantity**:
- Type: Double
- Range: No explicit limits (must be positive if provided)

#### Allowed Values

**Task Status**:
- `OPEN`, `IN_PROGRESS`, `BLOCKED`, `DONE`, `CLOSED`, `WIP`, `INSPECTION`

**Task Category**:
- `SNAG`, `QUALITY_ISSUE`, `EHS_ISSUE`, `OTHER`

**Project Role**:
- `ADMIN`, `PROJECT_MANAGER`, `MEMBER`, `VIEWER`

**Message Type**:
- `TEXT`, `IMAGE`, `FILE`, `SYSTEM`

#### Date Formats

**Format**: **ISO 8601 / RFC3339** (e.g., `2024-01-01T12:00:00Z`)

**Timezone**: **Always UTC**
- Server expects UTC
- Server returns UTC
- Client should:
  - Send dates in UTC
  - Display dates in user's local timezone
  - Store dates as UTC

**Example**:
```typescript
// Sending
const dueDate = new Date('2024-12-31T23:59:59Z').toISOString();

// Displaying
const localDate = new Date(dueDate).toLocaleString();
```

---

### Search & Indexing

#### Search Endpoint

**Endpoint**: `GET /feeds/search?query={query}&projectId={projectId}`

**Query Syntax**:
- **Simple text search**: Searches in task title, description, and metadata
- **No fuzzy matching**: Exact word matching
- **Case-insensitive**: Yes
- **No special operators**: No quotes, boolean operators, or wildcards

**Indexed Fields**:
- Task title
- Task description
- Task metadata (JSON string, basic search)

**Response Ordering**:
- **Default**: Relevance (not explicitly defined, likely by creation date)
- **No explicit sort parameter**: Use task filtering endpoints for sorting

**Highlighting**: **Not supported**

**Example**:
```
GET /feeds/search?query=concrete&projectId={projectId}
```

**Returns**: Tasks containing "concrete" in title, description, or metadata

---

### Timezones & Date Format Rules

#### Date Format

**Standard**: **ISO 8601 / RFC3339**
- Format: `YYYY-MM-DDTHH:mm:ssZ` (e.g., `2024-01-01T12:00:00Z`)
- Always UTC (Z suffix)
- Milliseconds: Optional (e.g., `2024-01-01T12:00:00.123Z`)

#### Timezone Handling

**Server**:
- Stores all dates in UTC
- Returns all dates in UTC
- No timezone conversion on server

**Client**:
- **Send**: Always UTC
- **Receive**: Always UTC
- **Display**: Convert to user's local timezone
- **Store**: Store as UTC

**Example Implementation**:
```typescript
// Sending
const dueDate = new Date('2024-12-31T23:59:59').toISOString();

// Receiving & Displaying
const serverDate = "2024-01-01T12:00:00Z";
const localDate = new Date(serverDate);
const displayString = localDate.toLocaleString('en-US', {
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
});
```

---

### Localization & i18n

#### Current Status

**Not Implemented**

**Error Messages**: English only

**Recommendation for Future**:
- Accept `Accept-Language` header
- Return localized error messages
- Support: `en-US`, `en-GB`, `es-ES`, etc.

**Current Workaround**: Client-side translation of error codes

---

### Monitoring & Analytics Hooks

#### Current Status

**Not Implemented**

**Recommendation for Future**:
- Optional `X-Client-Version` header
- Optional `X-Device-Id` header
- Performance metrics endpoint: `POST /analytics/metrics`

**Client Implementation**:
```typescript
headers: {
  'X-Client-Version': '1.0.0',
  'X-Device-Id': 'unique-device-id',
  'X-Platform': 'web' // or 'ios', 'android'
}
```

---

### API Versioning & Stability

#### Current Versioning

**Base Path**: `/api` (no version in URL)

**Version Strategy**: **No explicit versioning**

**Recommendation for Future**:
- URL versioning: `/api/v1/...`
- Header versioning: `Accept: application/vnd.nimbuild.v1+json`
- Deprecation policy: 6 months notice before breaking changes

**Current Stability**:
- Breaking changes may occur without notice
- Monitor API responses for schema changes
- Implement defensive parsing

---

### CORS

#### CORS Configuration

**Allowed Origins**: **All origins** (configured in `SecurityConfig`)

**Allowed Methods**: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

**Allowed Headers**: `Authorization`, `Content-Type`, `X-Requested-With`

**Credentials**: **Not explicitly configured** (cookies not used)

**Preflight**: **Handled automatically** by Spring Security CORS

**Example**:
```typescript
// Browser will automatically handle CORS preflight
fetch('http://13.203.46.227:8080/api/projects', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

### Sample Responses for Edge Cases

#### Empty Lists

**Response** (200 OK):
```json
[]
```

**Not**:
```json
{
  "data": [],
  "count": 0
}
```

#### Partial Failures

**Not Currently Supported**

**Batch Operations**: Not implemented (create tasks one at a time)

**Future Recommendation**:
```json
{
  "successful": [
    { "id": "uuid1", "title": "Task 1" }
  ],
  "failed": [
    { "input": { "title": "" }, "error": "Title is required" }
  ]
}
```

#### 404 vs 403

**404 Not Found**: Resource doesn't exist or user doesn't have access to know it exists
- Example: Task not found, or task exists but user isn't project member

**403 Forbidden**: Resource exists, but user lacks permission
- Example: User is project member but not ADMIN (trying to delete project)

**Current Behavior**: May return `400 Bad Request` for both cases. Check error message.

**Recommended Handling**:
```typescript
if (response.status === 403) {
  // Show "You don't have permission"
} else if (response.status === 404) {
  // Show "Not found"
} else if (response.status === 400) {
  // Check error message for context
}
```

#### Null vs Empty

**Null Values**: Used for optional fields that weren't set
- Example: `"description": null`

**Empty Strings**: Used for optional text fields that were explicitly set to empty
- Example: `"description": ""`

**Arrays**: Always arrays, never null
- Empty: `"ccUserIds": []`
- With items: `"ccUserIds": ["uuid1", "uuid2"]`

---

## Implementation Checklist

### Before Starting Development

- [ ] Set up token refresh mechanism
- [ ] Implement WebSocket reconnection with backoff
- [ ] Add error boundary for API errors
- [ ] Configure CORS if needed
- [ ] Set up date/timezone handling
- [ ] Implement pagination (cursor vs page)
- [ ] Add file upload size validation client-side
- [ ] Set up retry logic for transient errors
- [ ] Implement optimistic updates
- [ ] Add conflict detection for concurrent edits

### During Development

- [ ] Validate all field lengths client-side
- [ ] Handle 401/403/404 appropriately
- [ ] Show loading states for async operations
- [ ] Implement proper error messages
- [ ] Add pagination controls
- [ ] Handle empty states
- [ ] Test WebSocket reconnection
- [ ] Verify date formatting
- [ ] Test file upload limits

### Testing

- [ ] Test token expiration and refresh
- [ ] Test rate limiting
- [ ] Test file upload size limits
- [ ] Test concurrent edits
- [ ] Test WebSocket disconnection/reconnection
- [ ] Test pagination edge cases
- [ ] Test error scenarios
- [ ] Test empty responses
- [ ] Test timezone handling

---

**Last Updated**: 2025-11-22  
**API Version**: 1.0  
**Base URL**: http://13.203.46.227:8080/api

