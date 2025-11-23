import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { Heading, Body, Icon, Badge, Card, Caption, Button, EmptyState } from '../../components';
import { THEME } from '../../theme/Theme';
import { ProjectDashboardScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { projectService } from '../../services/api/projectService';
import { feedService } from '../../services/api/feedService';
import { groupService } from '../../services/api/groupService';
import { Project, Task, GroupMessage } from '../../types/api';
import { useCursorPagination } from '../../hooks/useCursorPagination';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';
import { ProjectFeed } from '../../components/project/ProjectFeed'; // We will create this next
import { ProjectTaskList } from '../../components/project/ProjectTaskList'; // We will create this next

type DashboardTab = 'general' | 'assigned-to-me' | 'assigned-by-me';

export const ProjectDashboardScreen: React.FC<ProjectDashboardScreenProps> = ({ route, navigation }) => {
    const { projectId } = route.params || {};
    const [activeTab, setActiveTab] = useState<DashboardTab>('general');
    const { user } = useAuthStore();

    // Fetch Project Details
    const { request: fetchProject, data: project, loading: loadingProject } = useRequest(projectService.getProjectDetails);

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId);
        }
    }, [projectId]);

    useEffect(() => {
        if (project) {
            navigation.setOptions({
                headerTitle: project.name,
                headerLeft: () => (
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 16 }}>
                        <Icon name="menu" size="base" color={THEME.colors.text} />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity onPress={() => navigation.navigate('ProjectDetails', { projectId })} style={{ marginRight: 16 }}>
                        <Icon name="information-outline" size="base" color={THEME.colors.primary} />
                    </TouchableOpacity>
                ),
            });
        }
    }, [project, navigation, projectId]);

    const renderTab = (tab: DashboardTab, label: string) => (
        <TouchableOpacity
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
        >
            <Body style={activeTab === tab ? styles.tabTextActive : styles.tabText}>{label}</Body>
        </TouchableOpacity>
    );

    if (!projectId) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ marginLeft: 16, marginTop: 16 }}>
                        <Icon name="menu" size="base" color={THEME.colors.text} />
                    </TouchableOpacity>
                </View>
                <EmptyState
                    icon="arrow-left"
                    title="Select a Project"
                    message="Open the sidebar to select a project or create a new one."
                />
            </View>
        );
    }

    if (loadingProject && !project) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={styles.container}>
                <EmptyState
                    icon="folder-alert"
                    title="Project not found"
                    message="The project you are looking for does not exist or you don't have access."
                />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Tabs */}
            <View style={styles.tabContainer}>
                {renderTab('general', 'General')}
                {renderTab('assigned-to-me', 'To Me')}
                {renderTab('assigned-by-me', 'By Me')}
            </View>

            {/* Content */}
            <View style={styles.content}>
                {activeTab === 'general' && projectId && (
                    <ProjectTaskList projectId={projectId} type="general" />
                )}
                {activeTab === 'assigned-to-me' && projectId && (
                    <ProjectTaskList projectId={projectId} type="assigned-to-me" />
                )}
                {activeTab === 'assigned-by-me' && projectId && (
                    <ProjectTaskList projectId={projectId} type="assigned-by-me" />
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        height: 60,
        justifyContent: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: THEME.colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: THEME.spacing.m,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: THEME.colors.primary,
    },
    tabText: {
        color: THEME.colors.textSecondary,
        fontWeight: '500',
    },
    tabTextActive: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
    },
});
