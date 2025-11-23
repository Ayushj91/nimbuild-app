import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainStackParamList } from './types';
import { MainNavigator } from './MainNavigator';
import { CreateProjectScreen } from '../screens/main/CreateProjectScreen';
import { ProjectDetailsScreen } from '../screens/main/ProjectDetailsScreen';
import { CreateTaskScreen } from '../screens/main/CreateTaskScreen';
import { TaskDetailsScreen } from '../screens/main/TaskDetailsScreen';
import { EditTaskScreen } from '../screens/main/EditTaskScreen';
import { ProjectFeedScreen } from '../screens/main/ProjectFeedScreen';
import { GroupsListScreen } from '../screens/main/GroupsListScreen';
import { CreateGroupScreen } from '../screens/main/CreateGroupScreen';
import { GroupDetailsScreen } from '../screens/main/GroupDetailsScreen';
import { GroupChatScreen } from '../screens/main/GroupChatScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStackNavigator = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainTabs"
                component={MainNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="CreateProject"
                component={CreateProjectScreen}
                options={{ title: 'Create Project' }}
            />
            <Stack.Screen
                name="ProjectDetails"
                component={ProjectDetailsScreen}
                options={{ title: 'Project Details' }}
            />
            <Stack.Screen
                name="CreateTask"
                component={CreateTaskScreen}
                options={{ title: 'Create Task' }}
            />
            <Stack.Screen
                name="TaskDetails"
                component={TaskDetailsScreen}
                options={{ title: 'Task Details' }}
            />
            <Stack.Screen
                name="EditTask"
                component={EditTaskScreen}
                options={{ title: 'Edit Task' }}
            />
            <Stack.Screen
                name="ProjectFeed"
                component={ProjectFeedScreen}
                options={{ title: 'Project Feed' }}
            />
            <Stack.Screen
                name="GroupsList"
                component={GroupsListScreen}
                options={{ title: 'Groups' }}
            />
            <Stack.Screen
                name="CreateGroup"
                component={CreateGroupScreen}
                options={{ title: 'Create Group' }}
            />
            <Stack.Screen
                name="GroupDetails"
                component={GroupDetailsScreen}
                options={{ title: 'Group Details' }}
            />
            <Stack.Screen
                name="GroupChat"
                component={GroupChatScreen}
                options={{ title: 'Group Chat' }}
            />
            <Stack.Screen
                name="Notifications"
                component={NotificationsScreen}
                options={{ title: 'Notifications' }}
            />
        </Stack.Navigator>
    );
};
