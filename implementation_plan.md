# Task APIs Integration Plan

## Goal Description
Implement the Task Service and integrate it into the app. This involves listing tasks within a project, creating new tasks, and viewing/updating task details.

## Proposed Changes

### 1. Task Service
#### [NEW] [src/services/api/taskService.ts](file:///Users/ayushjha/Documents/nimbuild%20app/src/services/api/taskService.ts)
- `getTasks(projectId)`: `GET /projects/{projectId}/tasks`
- `createTask(projectId, data)`: `POST /projects/{projectId}/tasks`
- `getTaskDetails(projectId, taskId)`: `GET /projects/{projectId}/tasks/{taskId}`
- `updateTaskStatus(projectId, taskId, status)`: `PATCH /projects/{projectId}/tasks/{taskId}/status`

### 2. Project Details Screen Integration
#### [MODIFY] [src/screens/main/ProjectDetailsScreen.tsx](file:///Users/ayushjha/Documents/nimbuild%20app/src/screens/main/ProjectDetailsScreen.tsx)
- Add a "Tasks" tab or section.
- Fetch and display list of tasks using `taskService`.
- Add "Create Task" button (FAB).

### 3. Create Task Screen
#### [NEW] [src/screens/main/CreateTaskScreen.tsx](file:///Users/ayushjha/Documents/nimbuild%20app/src/screens/main/CreateTaskScreen.tsx)
- Form with Title, Description, Priority, Due Date.
- Use `useRequest` to call `taskService.createTask`.

### 4. Task Details Screen
#### [NEW] [src/screens/main/TaskDetailsScreen.tsx](file:///Users/ayushjha/Documents/nimbuild%20app/src/screens/main/TaskDetailsScreen.tsx)
- Display task info.
- Allow status updates (e.g., Move to In Progress, Done).
- Show assignee (future: allow assignment).

### 5. Navigation Update
#### [MODIFY] [src/navigation/types.ts](file:///Users/ayushjha/Documents/nimbuild%20app/src/navigation/types.ts)
- Add `CreateTask` and `TaskDetails` to `MainStackParamList`.

#### [MODIFY] [src/navigation/MainStackNavigator.tsx](file:///Users/ayushjha/Documents/nimbuild%20app/src/navigation/MainStackNavigator.tsx)
- Add screens to the stack.

## Verification Plan

### Manual Verification
1. **List Tasks**:
   - Open Project Details -> Verify tasks are listed.
2. **Create Task**:
   - Tap "Create Task" -> Enter details -> Submit -> Verify API call.
   - Verify list updates.
3. **Task Details & Status**:
   - Tap a task -> Verify details.
   - Change status -> Verify API call and UI update.
