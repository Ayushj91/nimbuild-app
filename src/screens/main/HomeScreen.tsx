import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, RefreshControl, ActivityIndicator, TouchableOpacity, TextInput, FlatList, ListRenderItem } from 'react-native';
import { Heading, Body, Caption, Card, Icon, Badge, Button, EmptyState } from '../../components';
import { THEME } from '../../theme/Theme';
import { useAuthStore } from '../../store/authStore';
import { feedService } from '../../services/api/feedService';
import { Task } from '../../types/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../navigation/types';
import { format } from 'date-fns';
import { useCursorPagination } from '../../hooks/useCursorPagination';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type FeedTab = 'assigned-to-me' | 'assigned-by-me';

export const HomeScreen: React.FC = () => {
    const { user } = useAuthStore();
    const navigation = useNavigation<NavigationProp>();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<FeedTab>('assigned-to-me');

    // Use cursor pagination hook
    const {
        items: tasks,
        loading,
        initialLoading,
        hasMore,
        loadMore,
        refresh,
        reset
    } = useCursorPagination({
        fetchFunction: useCallback((cursor, limit) => {
            return activeTab === 'assigned-to-me'
                ? feedService.getAssignedToMe(cursor, limit)
                : feedService.getAssignedByMe(cursor, limit);
        }, [activeTab]),
        limit: 20,
        autoLoad: true
    });

    // Reset and reload when tab changes
    useEffect(() => {
        refresh();
    }, [activeTab]);

    // Calculate stats from current tasks
    const stats = React.useMemo(() => {
        const completed = tasks.filter(t => t.status === 'DONE' || t.status === 'CLOSED').length;
        const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'WIP').length;

        return {
            completed,
            inProgress,
            total: tasks.length
        };
    }, [tasks]);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        // Search implementation can be enhanced later with debouncing
    }, []);

    const handleTabChange = (tab: FeedTab) => {
        if (tab !== activeTab) {
            setActiveTab(tab);
            setSearchQuery('');
        }
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
                    <Body style={styles.projectName}>{task.projectName}</Body>
                    <View style={styles.badges}>
                        <Badge variant={getStatusColor(task.status)} value={task.status.replace('_', ' ')} />
                    </View>
                </View>
                <Heading level={3} style={styles.taskTitle}>{task.title}</Heading>

                {/* Category and Priority */}
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

    const renderHeader = () => (
        <>
            <View style={styles.header}>
                <Heading level={2}>Hello, {user?.name?.split(' ')[0] || 'User'}</Heading>
                <Body style={styles.subtitle}>Here's your daily briefing</Body>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Icon name="magnify" size="base" color={THEME.colors.textSecondary} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChangeText={handleSearch}
                    placeholderTextColor={THEME.colors.textTertiary}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => handleSearch('')}>
                        <Icon name="close-circle" size="base" color={THEME.colors.textSecondary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'assigned-to-me' && styles.tabActive]}
                    onPress={() => handleTabChange('assigned-to-me')}
                >
                    <Body style={activeTab === 'assigned-to-me' ? styles.tabTextActive : styles.tabText}>
                        Assigned to Me
                    </Body>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'assigned-by-me' && styles.tabActive]}
                    onPress={() => handleTabChange('assigned-by-me')}
                >
                    <Body style={activeTab === 'assigned-by-me' ? styles.tabTextActive : styles.tabText}>
                        Assigned by Me
                    </Body>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.grid}>
                <Card style={styles.statCard} shadow="sm">
                    <View style={[styles.iconContainer, { backgroundColor: THEME.colors.successLight }]}>
                        <Icon name="check-circle" size="lg" color={THEME.colors.success} />
                    </View>
                    <Heading level={3} style={styles.statNumber}>{stats.completed}</Heading>
                    <Body size="sm" style={styles.statLabel}>Completed</Body>
                </Card>

                <Card style={styles.statCard} shadow="sm">
                    <View style={[styles.iconContainer, { backgroundColor: THEME.colors.warningLight }]}>
                        <Icon name="clock-outline" size="lg" color={THEME.colors.warning} />
                    </View>
                    <Heading level={3} style={styles.statNumber}>{stats.inProgress}</Heading>
                    <Body size="sm" style={styles.statLabel}>In Progress</Body>
                </Card>
            </View>

            {/* Section Title */}
            <Heading level={3} style={styles.sectionTitle}>
                {searchQuery ? 'Search Results' : 'Recent Activity'}
            </Heading>
        </>
    );

    const renderFooter = () => {
        if (!hasMore && tasks.length > 0) {
            return (
                <View style={styles.footer}>
                    <Caption style={styles.footerText}>You've reached the end</Caption>
                </View>
            );
        }

        if (loading && tasks.length > 0) {
            return (
                <View style={styles.footer}>
                    <ActivityIndicator size="small" color={THEME.colors.primary} />
                </View>
            );
        }

        if (hasMore && tasks.length > 0) {
            return (
                <View style={styles.footer}>
                    <Button
                        title="Load More"
                        onPress={loadMore}
                        variant="text"
                    />
                </View>
            );
        }

        return null;
    };

    const renderEmpty = () => (
        <EmptyState
            icon="clipboard-text-outline"
            title={searchQuery ? 'No tasks found' : 'No recent tasks found'}
            message={searchQuery ? `No tasks matching "${searchQuery}"` : "Tasks assigned to you or created by you will appear here."}
            style={styles.emptyState}
        />
    );

    if (initialLoading) {
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
                ListHeaderComponent={renderHeader}
                ListFooterComponent={renderFooter}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={loading && tasks.length === 0}
                        onRefresh={refresh}
                        tintColor={THEME.colors.primary}
                        colors={[THEME.colors.primary]}
                    />
                }
                onEndReached={() => {
                    if (hasMore && !loading) {
                        loadMore();
                    }
                }}
                onEndReachedThreshold={0.5}
            />
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
    header: {
        marginBottom: THEME.spacing.l,
    },
    subtitle: {
        color: THEME.colors.textSecondary,
        marginTop: THEME.spacing.xs,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.base,
        paddingHorizontal: THEME.spacing.m,
        paddingVertical: THEME.spacing.s,
        marginBottom: THEME.spacing.m,
        gap: THEME.spacing.s,
    },
    searchInput: {
        flex: 1,
        fontSize: THEME.typography.fontSize.base,
        color: THEME.colors.text,
        padding: 0,
    },
    tabContainer: {
        flexDirection: 'row',
        marginBottom: THEME.spacing.l,
        backgroundColor: THEME.colors.surface,
        borderRadius: THEME.radius.base,
        padding: 4,
    },
    tab: {
        flex: 1,
        paddingVertical: THEME.spacing.s,
        alignItems: 'center',
        borderRadius: THEME.radius.base - 2,
    },
    tabActive: {
        backgroundColor: THEME.colors.primary,
    },
    tabText: {
        color: THEME.colors.textSecondary,
    },
    tabTextActive: {
        color: THEME.colors.white,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        gap: THEME.spacing.m,
        marginBottom: THEME.spacing.xl,
    },
    statCard: {
        flex: 1,
        padding: THEME.spacing.m,
        alignItems: 'center',
    },
    iconContainer: {
        padding: THEME.spacing.s,
        borderRadius: THEME.radius.full,
        marginBottom: THEME.spacing.s,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: THEME.colors.text,
    },
    statLabel: {
        color: THEME.colors.textSecondary,
    },
    sectionTitle: {
        marginBottom: THEME.spacing.m,
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
    footer: {
        padding: THEME.spacing.l,
        alignItems: 'center',
    },
    footerText: {
        color: THEME.colors.textSecondary,
    },
});
