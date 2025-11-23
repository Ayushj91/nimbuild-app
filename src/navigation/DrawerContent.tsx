import React, { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import { DrawerContentScrollView, DrawerItem, DrawerContentComponentProps } from '@react-navigation/drawer';
import { Heading, Body, Icon, Avatar, Caption } from '../components';
import { THEME } from '../theme/Theme';
import { useAuthStore } from '../store/authStore';
import { projectService } from '../services/api/projectService';
import { Project } from '../types/api';
import { useFocusEffect } from '@react-navigation/native';

export const DrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
    const { user, logout } = useAuthStore();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await projectService.getProjects();
            setProjects(data);
            // Set first project as active if none selected and projects exist
            if (!activeProjectId && data.length > 0) {
                // We don't auto-navigate here to avoid loops, but we could set the ID for highlighting
                // The initial navigation should happen in MainNavigator or Dashboard
            }
        } catch (error) {
            console.error('Failed to fetch projects', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchProjects();
        }, [])
    );

    // Listen to route params to update active project highlight
    useEffect(() => {
        const route = props.state.routes[props.state.index];
        if (route.name === 'ProjectDashboard' && route.params && (route.params as any).projectId) {
            setActiveProjectId((route.params as any).projectId);
        }
    }, [props.state]);

    const handleProjectSelect = (projectId: string) => {
        setActiveProjectId(projectId);
        props.navigation.navigate('ProjectDashboard', { projectId });
    };

    const renderProjectItem = ({ item }: { item: Project }) => (
        <TouchableOpacity
            style={[
                styles.projectItem,
                activeProjectId === item.id && styles.projectItemActive
            ]}
            onPress={() => handleProjectSelect(item.id)}
        >
            <View style={[styles.projectIcon, { backgroundColor: THEME.colors.primary }]}>
                <Body style={styles.projectIconText}>{item.name.substring(0, 2).toUpperCase()}</Body>
            </View>
            <Body style={[
                styles.projectName,
                activeProjectId === item.id && styles.projectNameActive
            ]} numberOfLines={1}>
                {item.name}
            </Body>
            {activeProjectId === item.id && (
                <Icon name="chevron-right" size="sm" color={THEME.colors.primary} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* User Header */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar name={user?.name} size="lg" />
                    <View style={styles.userDetails}>
                        <Heading level={3}>{user?.name}</Heading>
                        <Caption>{user?.email}</Caption>
                    </View>
                </View>
                <TouchableOpacity onPress={() => props.navigation.navigate('Profile')} style={styles.profileButton}>
                    <Icon name="cog" size="sm" color={THEME.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Projects List */}
            <View style={styles.projectsSection}>
                <View style={styles.sectionHeader}>
                    <Body style={styles.sectionTitle}>PROJECTS</Body>
                    <TouchableOpacity onPress={() => props.navigation.navigate('CreateProject')}>
                        <Icon name="plus" size="sm" color={THEME.colors.primary} />
                    </TouchableOpacity>
                </View>

                {loading && projects.length === 0 ? (
                    <ActivityIndicator style={styles.loader} color={THEME.colors.primary} />
                ) : (
                    <FlatList
                        data={projects}
                        renderItem={renderProjectItem}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyState}>
                                <Body style={styles.emptyText}>No projects found</Body>
                                <TouchableOpacity onPress={() => props.navigation.navigate('CreateProject')}>
                                    <Body style={styles.createLink}>Create one?</Body>
                                </TouchableOpacity>
                            </View>
                        }
                    />
                )}
            </View>

            {/* Footer Actions */}
            <View style={styles.footer}>
                <TouchableOpacity style={styles.footerItem} onPress={logout}>
                    <Icon name="logout" size="sm" color={THEME.colors.error} />
                    <Body style={styles.logoutText}>Logout</Body>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.surface,
    },
    header: {
        padding: THEME.spacing.l,
        paddingTop: 60, // Safe area top
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.m,
        flex: 1,
    },
    userDetails: {
        flex: 1,
    },
    profileButton: {
        padding: THEME.spacing.s,
    },
    projectsSection: {
        flex: 1,
        paddingTop: THEME.spacing.m,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: THEME.spacing.l,
        marginBottom: THEME.spacing.s,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: THEME.colors.textSecondary,
        letterSpacing: 1,
    },
    loader: {
        marginTop: THEME.spacing.xl,
    },
    listContent: {
        paddingHorizontal: THEME.spacing.m,
    },
    projectItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: THEME.spacing.m,
        borderRadius: THEME.radius.base,
        marginBottom: THEME.spacing.xs,
    },
    projectItemActive: {
        backgroundColor: THEME.colors.primaryLight,
    },
    projectIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.m,
    },
    projectIconText: {
        color: THEME.colors.white,
        fontWeight: 'bold',
        fontSize: 12,
    },
    projectName: {
        flex: 1,
        fontWeight: '500',
        color: THEME.colors.text,
    },
    projectNameActive: {
        color: THEME.colors.primary,
        fontWeight: 'bold',
    },
    emptyState: {
        padding: THEME.spacing.l,
        alignItems: 'center',
    },
    emptyText: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.s,
    },
    createLink: {
        color: THEME.colors.primary,
        fontWeight: '600',
    },
    footer: {
        padding: THEME.spacing.l,
        borderTopWidth: 1,
        borderTopColor: THEME.colors.border,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.m,
    },
    logoutText: {
        color: THEME.colors.error,
        fontWeight: '500',
    },
});
