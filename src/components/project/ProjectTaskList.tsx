import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, ListRenderItem } from 'react-native';
import { Heading, Body, Caption, Card, Icon, Badge, Button, EmptyState } from '../../components';
import { THEME } from '../../theme/Theme';
import { taskService } from '../../services/api/taskService';
import { Task } from '../../types/api';
import { format } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useRequest } from '../../hooks/useRequest';

interface ProjectTaskListProps {
    projectId: string;
    type: 'general' | 'assigned-to-me' | 'assigned-by-me';
}

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ProjectTaskList: React.FC<ProjectTaskListProps> = ({ projectId, type }) => {
    const navigation = useNavigation<NavigationProp>();
    const { user } = useAuthStore();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTasks = async () => {
        console.log('🔍 ProjectTaskList.fetchTasks called', {
            projectId,
            projectName: 'Current Project',
            type,
            userId: user?.id,
            userName: user?.name
        });
        if (!user?.id) {
            console.log('⚠️ No user ID, skipping fetch');
            return;
        }
        try {
            let filters;

            if (type === 'general') {
                // For general tab: No filters - show ALL tasks in the project
                filters = undefined;
                console.log('📋 Fetching ALL tasks for project (no filters)');
            } else if (type === 'assigned-to-me') {
                filters = { assignedToId: user.id };
            } else {
                filters = { createdById: user.id };
            }


            console.log('📋 Fetching tasks with filters:', { projectId, filters });
            console.log('🌐 API CALL: POST /projects/' + projectId + '/tasks/filter');
            const response = await taskService.getTasks(projectId, filters);

            console.log('🔍 RAW API RESPONSE TYPE:', typeof response);
            console.log('🔍 IS ARRAY:', Array.isArray(response));

            // Handle paginated response
            let data: any[];
            if (Array.isArray(response)) {
                data = response;
            } else if (response && typeof response === 'object' && 'content' in response) {
                // Paginated response
                data = (response as any).content || [];
                console.log('📄 Extracted from paginated response');
            } else {
                data = [];
            }

            console.log('✅ Tasks fetched:', data.length, 'tasks');

            if (data.length > 0) {
                console.log('📝 First task:', { title: data[0].title, id: data[0].id });
            }
            setTasks(data);
        } catch (error) {
            console.error('❌ Failed to fetch tasks', error);
        }
    };

    const { request: loadTasks, loading } = useRequest(fetchTasks);

    useEffect(() => {
        console.log('🔄 ProjectTaskList useEffect triggered', { projectId, type, userId: user?.id });
        loadTasks();
    }, [projectId, type, user?.id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTasks();
        setRefreshing(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DONE':
            case 'CLOSED':
                return 'success';
            case 'IN_PROGRESS':
            case 'WIP':
                return 'warning';
            case 'BLOCKED':
                return 'error';
            default:
                return 'primary';
        }
    };

    const getPriorityLabel = (priority?: number) => {
        if (!priority) return null;
        if (priority >= 8) return { label: 'High', color: 'error' as const };
        if (priority >= 5) return { label: 'Medium', color: 'warning' as const };
        return { label: 'Low', color: 'info' as const };
    };

    const renderTask: ListRenderItem<Task> = ({ item: task }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('TaskDetails', { projectId: task.projectId, taskId: task.id })}
        >
            <Card style={styles.taskCard} shadow="sm">
                <View style={styles.taskHeader}>
                    <Body style={styles.projectName} numberOfLines={1}>{task.projectName}</Body>
                    <View style={styles.badges}>
                        {task.isWatching && (
                            <View style={{ marginRight: 8 }}>
                                <Icon name="eye" size="sm" color={THEME.colors.primary} />
                            </View>
                        )}
                        <Badge variant={getStatusColor(task.status)} value={task.status.replace('_', ' ')} />
                    </View>
                </View>
                <Heading level={3} style={styles.taskTitle}>{task.title}</Heading>

                <View style={styles.taskMeta}>
                    {task.category && (
                        <Badge variant="info" value={task.category.replace('_', ' ')} />
                    )}
                    {getPriorityLabel(task.priority) && (
                        <Badge
                            variant={getPriorityLabel(task.priority)!.color}
                            value={getPriorityLabel(task.priority)!.label}
                        />
                    )}
                </View>

                <View style={styles.taskFooter}>
                    <Icon name="calendar" size="sm" color={THEME.colors.textSecondary} />
                    <Caption style={styles.dateText}>
                        Updated {format(new Date(task.updatedAt), 'MMM d, h:mm a')}
                    </Caption>
                </View>
            </Card>
        </TouchableOpacity>
    );

    const renderEmpty = () => {
        let message = "No tasks found in this project.";
        if (type === 'assigned-to-me') {
            message = "You have no tasks assigned in this project.";
        } else if (type === 'assigned-by-me') {
            message = "You haven't created any tasks in this project.";
        }

        return (
            <EmptyState
                icon="clipboard-text-outline"
                title="No tasks found"
                message={message}
                style={styles.emptyState}
            />
        );
    };

    if (loading && !refreshing && tasks.length === 0) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={tasks}
                renderItem={renderTask}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={THEME.colors.primary}
                        colors={[THEME.colors.primary]}
                    />
                }
            />
            <TouchableOpacity
                style={styles.fab}
                onPress={() => navigation.navigate('CreateTask', { projectId })}
            >
                <Icon name="plus" size="lg" color={THEME.colors.white} />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.backgroundGray,
    },
    content: {
        padding: THEME.spacing.l,
        flexGrow: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: THEME.colors.backgroundGray,
    },
    taskCard: {
        padding: THEME.spacing.m,
        marginBottom: THEME.spacing.m,
    },
    taskHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: THEME.spacing.s,
    },
    projectName: {
        fontSize: 12,
        color: THEME.colors.textSecondary,
        fontWeight: '600',
        flex: 1,
        marginRight: THEME.spacing.s,
    },
    badges: {
        flexDirection: 'row',
        gap: THEME.spacing.xs,
    },
    taskTitle: {
        marginBottom: THEME.spacing.s,
    },
    taskMeta: {
        flexDirection: 'row',
        gap: THEME.spacing.xs,
        marginBottom: THEME.spacing.m,
    },
    taskFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: THEME.spacing.xs,
    },
    dateText: {
        color: THEME.colors.textSecondary,
    },
    emptyState: {
        marginTop: THEME.spacing.xl,
    },
    fab: {
        position: 'absolute',
        right: THEME.spacing.l,
        bottom: THEME.spacing.l,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: THEME.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
});
