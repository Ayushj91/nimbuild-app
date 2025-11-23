import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Heading, Body, Card, Avatar, Badge, Button, Icon, AddMemberModal, Caption } from '../../components';
import { Restricted } from '../../components/auth/Restricted';
import { Permission } from '../../types/permissions';
import { useToast } from '../../contexts/ToastContext';
import { THEME } from '../../theme/Theme';
import { ProjectDetailsScreenProps } from '../../navigation/types';
import { useRequest } from '../../hooks/useRequest';
import { projectService } from '../../services/api/projectService';
import { taskService, TaskFilterParams } from '../../services/api/taskService';
import { useFocusEffect } from '@react-navigation/native';
import { Modal } from 'react-native';
import { TaskFilterPanel } from '../../components';

export const ProjectDetailsScreen: React.FC<ProjectDetailsScreenProps> = ({
    route,
    navigation,
}) => {
    const { projectId } = route.params;
    const toast = useToast();
    const [isAddMemberVisible, setIsAddMemberVisible] = React.useState(false);
    const [isFilterVisible, setIsFilterVisible] = React.useState(false);
    const [filters, setFilters] = React.useState<TaskFilterParams>({});

    const {
        request: fetchDetails,
        data: project,
        loading: loadingDetails,
    } = useRequest(projectService.getProjectDetails);

    const {
        request: fetchMembers,
        data: members,
        loading: loadingMembers,
    } = useRequest(projectService.getProjectMembers);

    const {
        request: fetchTasks,
        data: tasks,
        loading: loadingTasks,
    } = useRequest((pid: string, taskFilters?: TaskFilterParams) =>
        taskService.getTasks(pid, taskFilters)
    );

    const { request: addMember, loading: addingMember } = useRequest(projectService.addMember, {
        onSuccess: () => {
            setIsAddMemberVisible(false);
            toast.showToast({ message: 'Member added successfully', type: 'success' });
            fetchMembers(projectId);
        },
        successMessage: 'Member added',
    });

    const handleAddMember = async (email: string, role: 'ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'VIEWER') => {
        await addMember(projectId, { userEmail: email, role });
    };

    // Load project details and members only when projectId changes
    useEffect(() => {
        fetchDetails(projectId);
        fetchMembers(projectId);
    }, [projectId]); // Only depend on projectId, not the functions

    // Reload tasks when screen is focused or filters change
    useFocusEffect(
        useCallback(() => {
            fetchTasks(projectId, filters);
        }, [projectId, filters]) // Only depend on projectId and filters, not fetchTasks
    );

    const handleApplyFilters = (newFilters: TaskFilterParams) => {
        setFilters(newFilters);
    };

    const handleClearFilters = () => {
        setFilters({});
    };

    if (loadingDetails && !project) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    if (!project) {
        return (
            <View style={styles.container}>
                <Body>Project not found</Body>
            </View>
        );
    }

    const renderTaskItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('TaskDetails', { projectId, taskId: item.id })}>
            <Card style={styles.taskCard}>
                <View style={styles.taskHeader}>
                    <Body style={styles.taskTitle}>{item.title}</Body>
                    <Badge
                        value={item.status}
                        variant={item.status === 'DONE' ? 'success' : 'primary'}
                    />
                </View>
                {item.description && (
                    <Body size="sm" style={styles.taskDescription} numberOfLines={2}>
                        {item.description}
                    </Body>
                )}
                <View style={styles.taskFooter}>
                    <Body size="sm" style={styles.taskDate}>
                        Due: {item.dueDate || 'No date'}
                    </Body>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Heading level={1} style={styles.title}>
                    {project.name}
                </Heading>
                {project.description && (
                    <Body style={styles.description}>{project.description}</Body>
                )}

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Heading level={3} style={styles.sectionTitle}>
                            Tasks
                        </Heading>
                        <TouchableOpacity onPress={() => setIsFilterVisible(true)}>
                            <View style={styles.filterButton}>
                                <Icon name="filter-variant" size="base" color={THEME.colors.primary} />
                                {Object.keys(filters).length > 0 && (
                                    <View style={styles.filterBadge}>
                                        <Caption style={styles.filterBadgeText}>
                                            {Object.keys(filters).length}
                                        </Caption>
                                    </View>
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                    {loadingTasks && !tasks ? (
                        <ActivityIndicator color={THEME.colors.primary} />
                    ) : tasks?.length === 0 ? (
                        <Body style={styles.emptyText}>No tasks yet</Body>
                    ) : (
                        tasks?.map((task) => (
                            <View key={task.id} style={styles.taskWrapper}>
                                {renderTaskItem({ item: task })}
                            </View>
                        ))
                    )}
                </View>

                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Heading level={3} style={styles.sectionTitle}>
                            Members
                        </Heading>
                        <Restricted to={Permission.ADD_MEMBER} projectId={projectId}>
                            <TouchableOpacity onPress={() => setIsAddMemberVisible(true)}>
                                <Icon name="plus-circle" size="base" color={THEME.colors.primary} />
                            </TouchableOpacity>
                        </Restricted>
                    </View>
                    {loadingMembers ? (
                        <ActivityIndicator color={THEME.colors.primary} />
                    ) : (
                        members?.map((member) => (
                            <Card key={member.id} style={styles.memberCard}>
                                <View style={styles.memberRow}>
                                    <Avatar
                                        name={member.user.name}
                                        source={member.user.avatarUrl ? { uri: member.user.avatarUrl } : undefined}
                                        size="sm"
                                    />
                                    <View style={styles.memberInfo}>
                                        <Body style={styles.memberName}>{member.user.name}</Body>
                                        <Body style={styles.memberEmail}>{member.user.email}</Body>
                                    </View>
                                    <Badge
                                        value={member.role}
                                        variant={member.role === 'ADMIN' ? 'primary' : 'info'}
                                    />
                                </View>
                            </Card>
                        ))
                    )}
                </View>
            </ScrollView>

            <View style={styles.fabContainer}>
                <Button
                    title=""
                    icon={<Icon name="message-text" size="lg" color={THEME.colors.white} />}
                    onPress={() => navigation.navigate('ProjectFeed', { projectId })}
                    style={[styles.fab, styles.fabSecondary] as any}
                    variant="secondary"
                />
                <Restricted to={Permission.CREATE_TASK} projectId={projectId}>
                    <Button
                        title=""
                        icon={<Icon name="plus" size="lg" color={THEME.colors.white} />}
                        onPress={() => navigation.navigate('CreateTask', { projectId })}
                        style={styles.fab}
                        variant="primary"
                    />
                </Restricted>
            </View>

            <AddMemberModal
                visible={isAddMemberVisible}
                onClose={() => setIsAddMemberVisible(false)}
                onAdd={handleAddMember}
                loading={addingMember}
            />

            <Modal
                visible={isFilterVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setIsFilterVisible(false)}
            >
                <TaskFilterPanel
                    onApplyFilters={handleApplyFilters}
                    onClear={handleClearFilters}
                    onClose={() => setIsFilterVisible(false)}
                    initialFilters={filters}
                />
            </Modal>
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
        backgroundColor: THEME.colors.background,
    },
    content: {
        padding: THEME.spacing.l,
        paddingBottom: 100,
    },
    title: {
        marginBottom: THEME.spacing.s,
    },
    description: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xl,
    },
    section: {
        marginTop: THEME.spacing.l,
    },
    sectionTitle: {
        marginBottom: 0,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.m,
    },
    memberCard: {
        marginBottom: THEME.spacing.s,
        padding: THEME.spacing.m,
    },
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memberInfo: {
        flex: 1,
        marginLeft: THEME.spacing.m,
    },
    memberName: {
        fontWeight: '600',
    },
    memberEmail: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
    },
    taskWrapper: {
        marginBottom: THEME.spacing.m,
    },
    taskCard: {
        padding: THEME.spacing.m,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.s,
    },
    taskTitle: {
        fontWeight: '600',
        flex: 1,
        marginRight: THEME.spacing.s,
    },
    taskDescription: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.s,
    },
    taskFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    taskDate: {
        color: THEME.colors.textTertiary,
        fontSize: 12,
    },
    emptyText: {
        color: THEME.colors.textTertiary,
        fontStyle: 'italic',
    },
    fabContainer: {
        position: 'absolute',
        bottom: THEME.spacing.xl,
        right: THEME.spacing.xl,
        gap: THEME.spacing.m,
        alignItems: 'center',
    },
    fab: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 0,
        elevation: 6,
        shadowColor: THEME.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    fabSecondary: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: THEME.colors.secondary,
        shadowColor: THEME.colors.secondary,
        bottom: 100,
    },
    filterButton: {
        position: 'relative',
        padding: THEME.spacing.s,
    },
    filterBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: THEME.colors.error,
        borderRadius: 10,
        minWidth: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: THEME.colors.white,
        fontSize: 10,
        fontWeight: '600',
    },
});
