# Nimbuild App Development Tasks

## ✅ Phase 1: Foundation (Complete)
- [x] **Project Initialization**
    - [x] Initialize React Native project
    - [x] Setup TypeScript configuration
    - [x] Configure directory structure
- [x] **Design System & UI Foundation**
    - [x] Define Theme (Colors, Typography, Spacing, Shadows)
    - [x] Create Reusable Components (Button, Input, Card, Typography, Avatar, Badge, Icon)
    - [x] Setup Vector Icons (MaterialCommunityIcons)
- [x] **Navigation**
    - [x] Install React Navigation dependencies
    - [x] Configure Stack Navigator (Auth flow)
    - [x] Configure Tab Navigator (Home, Projects, Tasks, Profile)
    - [x] Setup Zustand for state management
    - [x] Create placeholder screens

## 🔄 Phase 2: API Integration & Services
- [x] **API Service Layer**
    - [x] Setup Axios instance with interceptors
    - [x] Create API base configuration
    - [x] Implement JWT token management
    - [x] Create type definitions for API responses
- [x] **Authentication Integration** (`/auth`)
    - [x] Connect Login screen to `POST /auth/otp/request`
    - [x] Connect OTP Verification to `POST /auth/otp/verify`
    - [x] Implement `GET /auth/me` for user session
    - [x] Store JWT tokens securely
    - [x] Handle token refresh logic
- [x] **Project APIs** (`/projects`)
    - [x] Implement project service (`GET /projects`, `POST /projects`)
    - [x] Create project list with real data
    - [x] Build project detail screen (`GET /projects/{projectId}`)
    - [x] Add project member management
- [/] **Task APIs (Enhanced)** (`/projects/{projectId}/tasks`)
    - [x] Implement basic task service (CRUD operations)
    - [x] Build create task screen
    - [x] Update types to include new fields (category, location, dates, quantity, unit)
    - [ ] Implement enhanced task creation with all new fields
    - [ ] Build task detail screen with comments and assets
    - [ ] Implement direct assignment (assignedToId - "To" field)
    - [ ] Implement CC user selection (ccUserIds)
    - [ ] Show all task statuses (OPEN, WIP, INSPECTION, CLOSED, IN_PROGRESS, BLOCKED, DONE)
    - [ ] Show task categories (SNAG, QUALITY_ISSUE, EHS_ISSUE, OTHER)
- [/] **Comment System** (`/projects/{projectId}/tasks/{taskId}/comments`)
## 📦 Phase 2: API Alignment & Services
- [x] **Type System Updates**
    - [x] Update User interface (companyName, role)
    - [x] Extend Task interface with all new fields
    - [x] Add Comment, Attachment, CcUser interfaces
    - [x] Add TaskCategory and update TaskStatus enums
- [x] **Service Layer**
    - [x] Update taskService (create, update)
    - [x] Create commentService (full CRUD + attachments)
    - [x] Update userService (profile, avatar)
    - [x] Implement user search
    - [x] Display user avatars throughout app

## 📱 Phase 3: Enhanced Task & Comment Features
- [x] **Task Details Enhancement**
    - [x] Update Task interface with all new fields
    - [x] Build comprehensive task detail screen
    - [x] Display task metadata (location, category, dates)
    - [x] Show assigned user (To field) and CC users
    - [ ] Display task assets with download
    - [ ] Add task update screen
    - [x] Implement all status transitions
    - [x] Add quantity and unit tracking
- [ ] **Asset Management**
    - [ ] Implement task asset upload
    - [ ] Display asset list in task details
    - [ ] Generate presigned download URLs
    - [ ] Support image preview
    - [ ] Support file type icons
    - [ ] Implement asset deletion
- [x] **Comment Features**
    - [x] Display comments in task details
    - [x] Add comment composer
    - [ ] Implement comment attachments
    - [ ] Show threaded replies
    - [x] Add edit/delete for own comments
    - [x] Display creator info with avatars
    - [x] Show comment timestamps
- [/] **Create Task UI Enhancement**
    - [x] Redesign with modern, clean UI
    - [x] Add media attachment buttons
    - [x] Pill-style category selector
    - [x] Add all new input fields (location, CC, etc.)
    - [x] Side-by-side date and quantity fields
    - [x] Pill-style status selector
    - [ ] Implement user search for assignee/CC
    - [ ] Add media attachment functionality
    - [ ] Add user-friendly iconography
- [ ] **User Profile & Settings**
    - [ ] Build profile screen with all fields
    - [ ] Implement profile editing
    - [ ] Add avatar picker and upload
    - [ ] Update company name and role
    - [ ] Show verification status

## 📋 Phase 4: Feeds & Advanced Features
- [ ] **Home/Feed Screen** (`/feeds`)
    - [ ] Implement `GET /feeds/assigned-to-me`
    - [ ] Implement `GET /feeds/assigned-by-me`
    - [ ] Add task search (`GET /feeds/search`)
    - [ ] Show recent tasks
    - [ ] Display task categories and priorities
- [ ] **Project Management**
    - [ ] Enhanced project creation
    - [ ] Member invitation (`POST /projects/{projectId}/members`)
    - [ ] Role management (ADMIN, PROJECT_MANAGER, MEMBER, VIEWER)
    - [ ] Project details with members list
    - [ ] Project-level filters

## 💬 Phase 5: Communication & Collaboration
- [ ] **Groups** (`/groups`)
    - [ ] Group list screen (`GET /groups/user`)
    - [ ] Group creation (`POST /groups`)
    - [ ] Add/remove group members
    - [ ] Group details screen
- [ ] **Group Chat** (`/groups/{groupId}/messages`)
    - [ ] Chat UI with message list
    - [ ] Send text messages (`POST /groups/{groupId}/messages`)
    - [ ] Message reactions/replies (replyToMessageId)
    - [ ] Group asset sharing (`POST /groups/{groupId}/assets`)
    - [ ] View group assets (`GET /groups/{groupId}/assets`)

## 🔔 Phase 6: Real-time Features
- [ ] **WebSocket Integration**
    - [ ] Setup WebSocket client (STOMP)
    - [ ] Connect to `/ws` endpoint with JWT
    - [ ] Subscribe to `/queue/notifications/{userId}`
    - [ ] Subscribe to `/topic/group/{groupId}/messages`
    - [ ] Handle connection/disconnection
- [ ] **Notifications** (`/notifications`)
    - [ ] Notification list screen
    - [ ] Real-time notification updates
    - [ ] Unread count badge (`GET /notifications/unread-count`)
    - [ ] Mark as read (`PATCH /notifications/{notificationId}/read`)
    - [ ] Notification types (ASSIGNMENT, TASK_UPDATED, COMMENT, TAG)
    - [ ] In-app notification toast/banner

## 📎 Phase 7: Additional File Management
- [ ] **Group Assets** (`/groups/{groupId}/assets`)
    - [ ] Upload files to group
    - [ ] View group files
    - [ ] File type icons and previews
    - [ ] Asset organization

## 🎨 Phase 8: Polish & Enhancement
- [ ] **User Experience**
    - [ ] Pull-to-refresh on lists
    - [ ] Infinite scroll/pagination
    - [ ] Loading states and skeletons
    - [ ] Error handling with retry
    - [ ] Offline support (cache API responses)
    - [ ] Empty states with helpful messages
- [ ] **Profile & Settings**
    - [ ] Update profile (name, avatar)
    - [ ] Avatar upload
    - [ ] App settings
    - [ ] Logout confirmation
- [ ] **Accessibility & Performance**
    - [ ] Test screen readers
    - [ ] Keyboard navigation
    - [ ] Performance optimization (memo, useMemo, useCallback)
    - [ ] Image optimization
    - [ ] Bundle size optimization

## 🚀 Phase 9: Deployment
- [ ] **Build & Release**
    - [ ] Configure app icons
    - [ ] Configure splash screens
    - [ ] Setup environment variables (dev, staging, prod)
    - [ ] Build Android release APK/AAB
    - [ ] Build iOS release (if applicable)
    - [ ] Test on physical devices
    - [ ] Prepare for Play Store/App Store submission

