import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Heading, Body, Caption, Card, Icon } from '../../components';
import { THEME } from '../../theme/Theme';
import { NotificationsScreenProps } from '../../navigation/types';
import { notificationService, Notification } from '../../services/api/notificationService';
import { wsClient, WebSocketEvent } from '../../services/websocket/websocketClient';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    // Listen for real-time notifications
    useEffect(() => {
        const handleNotification = (event: WebSocketEvent) => {
            // Prepend new notification to list
            const newNotification = event.data as Notification;
            setNotifications(prev => [newNotification, ...prev]);
        };

        wsClient.on('notification', handleNotification);

        return () => {
            wsClient.off('notification', handleNotification);
        };
    }, []);

    const fetchNotifications = async (pageNum = 0) => {
        try {
            if (pageNum === 0) {
                setLoading(true);
            }

            const response = await notificationService.getNotifications(pageNum, 20);

            if (pageNum === 0) {
                setNotifications(response.content);
            } else {
                setNotifications(prev => [...prev, ...response.content]);
            }

            setHasMore(pageNum < response.totalPages - 1);
            setPage(pageNum);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications(0);
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            fetchNotifications(page + 1);
        }
    };

    const handleNotificationPress = async (notification: Notification) => {
        // Mark as read
        if (!notification.isRead) {
            try {
                await notificationService.markAsRead(notification.id);
                setNotifications(prev =>
                    prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
                );
            } catch (error) {
                console.error('Failed to mark as read:', error);
            }
        }

        // Navigate based on notification type and data
        if (notification.data.taskId && notification.data.projectId) {
            navigation.navigate('TaskDetails', {
                projectId: notification.data.projectId,
                taskId: notification.data.taskId,
            });
        } else if (notification.data.projectId) {
            navigation.navigate('ProjectDetails', {
                projectId: notification.data.projectId,
            });
        } else if (notification.data.groupId) {
            navigation.navigate('GroupChat', {
                groupId: notification.data.groupId,
            });
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']): string => {
        switch (type) {
            case 'TASK_ASSIGNED':
                return 'account-arrow-right';
            case 'TASK_UPDATED':
                return 'clipboard-edit';
            case 'TASK_COMPLETED':
                return 'check-circle';
            case 'COMMENT_ADDED':
                return 'comment';
            case 'MENTION':
                return 'at';
            case 'PROJECT_INVITE':
                return 'folder-account';
            default:
                return 'bell';
        }
    };

    const renderNotification = ({ item }: { item: Notification }) => (
        <TouchableOpacity onPress={() => handleNotificationPress(item)}>
            <Card
                style={!item.isRead ? [styles.notificationCard, styles.unreadCard] : styles.notificationCard}
                shadow="sm"
            >
                <View style={styles.notificationContent}>
                    <View style={[
                        styles.iconContainer,
                        !item.isRead && styles.unreadIconContainer,
                    ]}>
                        <Icon
                            name={getNotificationIcon(item.type)}
                            size="base"
                            color={!item.isRead ? THEME.colors.primary : THEME.colors.textSecondary}
                        />
                    </View>

                    <View style={styles.textContainer}>
                        <Body
                            size="sm"
                            style={[
                                styles.title,
                                !item.isRead && styles.unreadTitle,
                            ]}
                        >
                            {item.title}
                        </Body>
                        <Caption style={styles.message}>{item.message}</Caption>
                        <Caption style={styles.time}>
                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                        </Caption>
                    </View>

                    {!item.isRead && <View style={styles.unreadDot} />}
                </View>
            </Card>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Icon name="bell-outline" size="xl" color={THEME.colors.textSecondary} />
            <Body style={styles.emptyText}>No notifications yet</Body>
        </View>
    );

    const renderFooter = () => {
        if (!loading) return null;
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={THEME.colors.primary} />
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Heading level={2}>Notifications</Heading>
                {notifications.some(n => !n.isRead) && (
                    <TouchableOpacity onPress={handleMarkAllRead}>
                        <Body size="sm" style={styles.markAllRead}>
                            Mark all read
                        </Body>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                renderItem={renderNotification}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={!loading ? renderEmptyState : null}
                ListFooterComponent={renderFooter}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={THEME.colors.primary}
                    />
                }
                onEndReached={handleLoadMore}
                onEndReachedThreshold={0.5}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: THEME.spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: THEME.colors.border,
    },
    markAllRead: {
        color: THEME.colors.primary,
    },
    list: {
        padding: THEME.spacing.m,
        flexGrow: 1,
    },
    notificationCard: {
        marginBottom: THEME.spacing.m,
        padding: THEME.spacing.m,
    },
    unreadCard: {
        backgroundColor: THEME.colors.primaryLight + '20',
        borderLeftWidth: 3,
        borderLeftColor: THEME.colors.primary,
    },
    notificationContent: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: THEME.colors.surfaceVariant,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: THEME.spacing.m,
    },
    unreadIconContainer: {
        backgroundColor: THEME.colors.primaryLight + '40',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        marginBottom: THEME.spacing.xs,
    },
    unreadTitle: {
        fontWeight: THEME.typography.fontWeight.bold,
    },
    message: {
        color: THEME.colors.textSecondary,
        marginBottom: THEME.spacing.xs,
    },
    time: {
        color: THEME.colors.textSecondary,
        fontSize: 11,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: THEME.colors.primary,
        marginLeft: THEME.spacing.s,
        marginTop: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: THEME.spacing['2xl'],
    },
    emptyText: {
        marginTop: THEME.spacing.m,
        color: THEME.colors.textSecondary,
    },
    footer: {
        padding: THEME.spacing.m,
        alignItems: 'center',
    },
});
