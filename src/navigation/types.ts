import { NavigatorScreenParams, CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DrawerScreenProps } from '@react-navigation/drawer';

// Auth Stack Param List
export type AuthStackParamList = {
    Login: undefined;
    OtpVerification: {
        phone?: string;
        email?: string;
    };
};

// Drawer Param List
export type DrawerParamList = {
    ProjectDashboard: { projectId?: string };
    Profile: undefined;
    CreateProject: undefined; // Accessible from drawer
};

// Main Stack Param List
export type MainStackParamList = {
    Drawer: NavigatorScreenParams<DrawerParamList>;
    CreateProject: undefined;
    ProjectDetails: { projectId: string }; // Keeping for specific details view if needed, or might merge into Dashboard
    CreateTask: { projectId: string };
    TaskDetails: { projectId: string; taskId: string };
    EditTask: { projectId: string; taskId: string; task?: any };
    ProjectFeed: { projectId: string }; // Might be part of Dashboard now
    GroupsList: { projectId: string }; // Scoped to project
    CreateGroup: { projectId?: string };
    GroupDetails: { groupId: string };
    GroupChat: { groupId: string };
    Notifications: undefined;
};

// Root Stack Param List
export type RootStackParamList = {
    Auth: NavigatorScreenParams<AuthStackParamList>;
    Main: NavigatorScreenParams<MainStackParamList>;
};

// Auth Stack Screen Props
export type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;
export type OtpVerificationScreenProps = NativeStackScreenProps<AuthStackParamList, 'OtpVerification'>;

// Main Stack Screen Props
export type CreateProjectScreenProps = NativeStackScreenProps<MainStackParamList, 'CreateProject'>;
export type ProjectDetailsScreenProps = NativeStackScreenProps<MainStackParamList, 'ProjectDetails'>;
export type CreateTaskScreenProps = NativeStackScreenProps<MainStackParamList, 'CreateTask'>;
export type TaskDetailsScreenProps = NativeStackScreenProps<MainStackParamList, 'TaskDetails'>;
export type EditTaskScreenProps = NativeStackScreenProps<MainStackParamList, 'EditTask'>;
export type ProjectFeedScreenProps = NativeStackScreenProps<MainStackParamList, 'ProjectFeed'>;
export type GroupsListScreenProps = NativeStackScreenProps<MainStackParamList, 'GroupsList'>;
export type CreateGroupScreenProps = NativeStackScreenProps<MainStackParamList, 'CreateGroup'>;
export type GroupDetailsScreenProps = NativeStackScreenProps<MainStackParamList, 'GroupDetails'>;
export type GroupChatScreenProps = NativeStackScreenProps<MainStackParamList, 'GroupChat'>;

// Drawer Screen Props
export type ProjectDashboardScreenProps = CompositeScreenProps<
    DrawerScreenProps<DrawerParamList, 'ProjectDashboard'>,
    NativeStackScreenProps<MainStackParamList>
>;
export type ProfileScreenProps = CompositeScreenProps<
    DrawerScreenProps<DrawerParamList, 'Profile'>,
    NativeStackScreenProps<MainStackParamList>
>;
export type NotificationsScreenProps = NativeStackScreenProps<MainStackParamList, 'Notifications'>;
